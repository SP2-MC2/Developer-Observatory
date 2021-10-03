from flask import Flask, abort
app = Flask(__name__)

@app.route("/")
def index():
    abort(404)

@app.route("/token/gettoken/<string:tok1>/<string:tok2>")
def get_token(tok1, tok2):
    return "Valid"

@app.route("/token/settoken/<string:tok1>/<string:tok2>")
def set_token(tok1, tok2):
    return ("", 200)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
