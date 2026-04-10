import io
import os

from flask import Flask, jsonify, render_template, request, send_file
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"txt", "docx", "pdf"}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB


def _allowed(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def _text_from_bytes(data):
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return data.decode(enc)
        except (UnicodeDecodeError, ValueError):
            continue
    return data.decode("utf-8", errors="replace")


def _text_from_docx(data):
    from docx import Document  # python-docx

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def _text_from_pdf(data):
    import pdfplumber

    parts = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
    return "\n\n".join(parts)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    f = request.files["file"]
    if not f or not f.filename:
        return jsonify({"error": "No file selected."}), 400

    if not _allowed(f.filename):
        return jsonify(
            {"error": "Only .txt, .docx, and .pdf files are supported."}
        ), 400

    filename = secure_filename(f.filename)
    ext = filename.rsplit(".", 1)[1].lower()
    data = f.read()

    try:
        if ext == "txt":
            content = _text_from_bytes(data)
        elif ext == "docx":
            content = _text_from_docx(data)
        else:  # pdf
            content = _text_from_pdf(data)
    except Exception:
        app.logger.exception("Failed to parse uploaded file: %s", filename)
        return jsonify({"error": "Could not read the file. It may be corrupted or in an unsupported format."}), 422

    return jsonify({"content": content, "filename": filename})


@app.route("/export", methods=["POST"])
def export():
    body = request.get_json(silent=True) or {}
    content = body.get("content", "")
    filename = body.get("filename") or "document"

    base = os.path.splitext(secure_filename(filename))[0] or "document"
    # Restrict the base name to safe alphanumerics, hyphens, and underscores
    # to prevent any path-traversal or header-injection via download_name.
    safe_base = "".join(c if c.isalnum() or c in "-_" else "_" for c in base) or "document"
    buf = io.BytesIO(content.encode("utf-8"))

    return send_file(
        buf,
        as_attachment=True,
        download_name=f"{safe_base}_edited.txt",
        mimetype="text/plain",
    )


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug)
