# usmcadri-vss

## Quick-start Flask app in Codespaces

Paste the following block directly into your Codespaces terminal to create (or overwrite) `app.py` and start the server on port 5000:

```bash
cat <<'EOF' > app.py
from flask import Flask

app = Flask(__name__)


@app.route('/')
def index():
    return 'Hello from usmcadri-vss!'


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
EOF
pip install -r requirements.txt
python app.py
```