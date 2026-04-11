import io
import logging
import os

from flask import Flask, jsonify, render_template, request, send_file
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB

ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -- Parsers -------------------------------------------------------------------

def _parse_txt(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def _parse_docx(data: bytes) -> str:
    import docx  # python-docx

    doc = docx.Document(io.BytesIO(data))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _parse_pdf(data: bytes) -> str:
    import pdfplumber

    pages: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n\n".join(pages)


# -- Routes --------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "No file selected"}), 400

    if not _allowed(f.filename):
        return jsonify({"error": "Unsupported file type. Upload .txt, .pdf, or .docx"}), 400

    filename = secure_filename(f.filename)
    if not filename or "." not in filename:
        return jsonify({"error": "Invalid filename"}), 400

    ext = filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Unsupported file type. Upload .txt, .pdf, or .docx"}), 400

    data = f.read()

    try:
        if ext == "txt":
            text = _parse_txt(data)
        elif ext == "docx":
            text = _parse_docx(data)
        else:  # pdf
            text = _parse_pdf(data)
    except Exception as exc:
        app.logger.error("File parse error for %s: %s", filename, exc)
        return jsonify({"error": "Could not parse the uploaded file. Ensure it is a valid .txt, .pdf, or .docx document."}), 500

    return jsonify({"text": text, "filename": filename})


@app.route("/export", methods=["POST"])
def export():
    payload = request.get_json(silent=True) or {}
    text: str = payload.get("text", "")
    fmt: str = payload.get("format", "txt")
    base: str = payload.get("filename", "document").rsplit(".", 1)[0]
    settings: dict = payload.get("settings", {})

    if fmt == "txt":
        buf = io.BytesIO(text.encode("utf-8"))
        buf.seek(0)
        return send_file(
            buf,
            mimetype="text/plain",
            as_attachment=True,
            download_name=f"{base}.txt",
        )

    if fmt == "docx":
        buf = _build_docx(text, settings)
        buf.seek(0)
        return send_file(
            buf,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=f"{base}.docx",
        )

    return jsonify({"error": "Unsupported export format"}), 400


# -- Docx builder ---------------------------------------------------------------

def _build_docx(text: str, settings: dict) -> io.BytesIO:
    import docx
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt

    doc = docx.Document()

    font_name: str = settings.get("fontFamily", "Courier New")
    # OpenDyslexic is not a standard system font — fall back gracefully
    if "OpenDyslexic" in font_name:
        font_name = "Courier New"
    # Strip CSS font-stack fallbacks (e.g. "'Atkinson Hyperlegible', sans-serif")
    font_name = font_name.split(",")[0].strip().strip("'\"")

    font_size: float = float(settings.get("fontSize", 18))
    line_height: float = float(settings.get("lineHeight", 1.6))
    margin_px: float = float(settings.get("margin", 40))
    # px → cm, enforce a sensible minimum (≈ 0.5 in)
    margin_cm: float = max(margin_px * 0.026458, 1.27)

    for section in doc.sections:
        section.left_margin = Cm(margin_cm)
        section.right_margin = Cm(margin_cm)
        section.top_margin = Cm(margin_cm)
        section.bottom_margin = Cm(margin_cm)

    for raw_line in text.split("\n"):
        para = doc.add_paragraph()
        run = para.add_run(raw_line)
        run.font.name = font_name
        run.font.size = Pt(font_size)

        # Apply line-height via OOXML spacing element
        p_pr = para._p.get_or_add_pPr()
        for existing in p_pr.findall(qn("w:spacing")):
            p_pr.remove(existing)
        spacing_el = OxmlElement("w:spacing")
        spacing_el.set(qn("w:line"), str(int(line_height * 240)))
        spacing_el.set(qn("w:lineRule"), "auto")
        p_pr.append(spacing_el)

    buf = io.BytesIO()
    doc.save(buf)
    return buf


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug)
