from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Preset definitions shared with the front-end via /api/presets.
# Each entry maps a display name to an RGB overlay colour.
PRESETS = {
    "whiteBalance": {
        "Neutral":     {"r": 255, "g": 255, "b": 255},
        "Warm":        {"r": 255, "g": 220, "b": 180},
        "Cool":        {"r": 180, "g": 210, "b": 255},
        "Daylight":    {"r": 255, "g": 244, "b": 230},
        "Candlelight": {"r": 255, "g": 197, "b": 143},
    },
    "visionCondition": {
        "High Contrast": {"r": 0,   "g": 0,   "b": 0  },
        "Reduced Glare": {"r": 100, "g": 100, "b": 100},
        "Muted":         {"r": 200, "g": 200, "b": 200},
        "Grayscale":     {"r": 150, "g": 150, "b": 150},
    },
    "noir": {
        "FL-41 Rose": {"r": 255, "g": 180, "b": 180},
        "Amber":      {"r": 255, "g": 191, "b":   0},
        "Gray":       {"r": 128, "g": 128, "b": 128},
        "Plum":       {"r": 180, "g": 100, "b": 180},
        "Yellow":     {"r": 255, "g": 255, "b":   0},
    },
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/presets")
def get_presets():
    """Return all preset definitions as JSON."""
    return jsonify(PRESETS)


if __name__ == "__main__":
    app.run()
