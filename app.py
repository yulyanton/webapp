from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
@app.route('/assets/icons/<path:filename>')
def serve_static_image(filename):
    return send_from_directory('assets/icons/', filename)

@app.route('/styles/<path:filename>')
def serve_static_styles(filename):
    return send_from_directory('styles', filename)


@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
