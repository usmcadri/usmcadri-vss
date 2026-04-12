import os
import textwrap

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

# ── Optional: OpenAI for summarisation + chat ─────────────
try:
    from openai import OpenAI as _OAI

    _oa_client = _OAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
    _OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_AVAILABLE = bool(os.environ.get("OPENAI_API_KEY"))
except ImportError:
    _oa_client = None
    OPENAI_AVAILABLE = False


# ── Text extraction helpers ───────────────────────────────
def extract_txt(stream):
    return stream.read().decode("utf-8", errors="replace")


def extract_docx(stream):
    try:
        from docx import Document  # python-docx
        doc = Document(stream)
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as exc:
        raise ValueError(f"Could not parse .docx file: {exc}") from exc


def extract_pdf(stream):
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(stream) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n\n".join(text_parts)
    except Exception as exc:
        raise ValueError(f"Could not parse .pdf file: {exc}") from exc


EXTRACTORS = {
    ".txt":  extract_txt,
    ".docx": extract_docx,
    ".pdf":  extract_pdf,
}


# ── Summarisation helpers ─────────────────────────────────
def summarise_with_openai(text: str) -> str:
    snippet = text[:8000]
    resp = _oa_client.chat.completions.create(
        model=_OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful reading assistant for people with "
                    "Visual Snow Syndrome. Provide a concise 3-5 sentence "
                    "summary of the document the user has uploaded."
                ),
            },
            {"role": "user", "content": f"Please summarise this document:\n\n{snippet}"},
        ],
        max_tokens=300,
        temperature=0.4,
    )
    return resp.choices[0].message.content.strip()


def summarise_fallback(text: str) -> str:
    """Return the first ~400 characters as a basic excerpt-summary."""
    excerpt = " ".join(text.split())[:400]
    return excerpt + ("…" if len(text) > 400 else "")


def summarise(text: str) -> str:
    if OPENAI_AVAILABLE and _oa_client:
        try:
            return summarise_with_openai(text)
        except Exception:
            pass
    return summarise_fallback(text)


# ── Chat helper ───────────────────────────────────────────
def chat_with_openai(message: str, context: str) -> str:
    sys_prompt = textwrap.dedent("""\
        You are a helpful reading assistant for people with Visual Snow
        Syndrome. Answer questions about the provided document clearly and
        concisely. If the answer is not in the document, say so politely.
    """)
    doc_block = f"Document content:\n\n{context[:6000]}" if context else ""
    resp = _oa_client.chat.completions.create(
        model=_OPENAI_MODEL,
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user",   "content": f"{doc_block}\n\nQuestion: {message}"},
        ],
        max_tokens=512,
        temperature=0.5,
    )
    return resp.choices[0].message.content.strip()


def chat_fallback(message: str, context: str) -> str:
    msg_lower = message.lower()
    if any(w in msg_lower for w in ("summary", "summarise", "summarize", "about")):
        return summarise_fallback(context) if context else "No document loaded yet."
    if context:
        return (
            "I can see your document contains text, but I need an OpenAI API key "
            "to answer detailed questions. Set the OPENAI_API_KEY environment "
            "variable to enable AI-powered answers."
        )
    return "No document has been loaded yet. Please upload a file first."


# ── Routes ────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify(error="No file provided"), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify(error="Empty filename"), 400

    ext = os.path.splitext(f.filename)[1].lower()
    extractor = EXTRACTORS.get(ext)
    if not extractor:
        return jsonify(error=f"Unsupported file type: {ext}. Use .txt, .docx, or .pdf"), 415

    try:
        text = extractor(f.stream)
    except ValueError as exc:
        return jsonify(error=str(exc)), 422

    summary = summarise(text)
    return jsonify(text=text, summary=summary)


@app.route("/chat", methods=["POST"])
def chat():
    data    = request.get_json(force=True, silent=True) or {}
    message = (data.get("message") or "").strip()
    context = (data.get("context") or "").strip()

    if not message:
        return jsonify(error="message is required"), 400

    if OPENAI_AVAILABLE and _oa_client:
        try:
            reply = chat_with_openai(message, context)
            return jsonify(reply=reply)
        except Exception as exc:
            return jsonify(error=str(exc)), 500

    reply = chat_fallback(message, context)
    return jsonify(reply=reply)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host="0.0.0.0", port=5000)
