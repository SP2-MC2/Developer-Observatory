from flask import request, redirect, url_for, make_response
from flask.blueprints import Blueprint
from flask_login import LoginManager, UserMixin, login_user

login_manager = LoginManager()
login_manager.login_view = "auth.login"
PASSWORD = "pass123"

auth_bp = Blueprint('auth', __name__)

class AdminUser(UserMixin):
    def __init__(self):
        self.id = "admin"


@login_manager.request_loader
def load_user_from_header(request):
    try:
        header_val = request.headers["Authorization"].replace('Basic ', '', 1)
        header_val = base64.b64decode(header_val)
        print("password:", header_val)
        if header_val == PASSWORD:
            return AdminUser()
        else:
            return None
    except (TypeError, KeyError):
        return None


@auth_bp.route("login")
def login():
    if "Authorization" not in request.headers:
        resp = make_response("Unauthorized")
        resp.status = 401
        resp.headers["WWW-Authenticate"] = "Basic"
        return resp
    elif login_user(AdminUser()):
        print("Login succeded")

        return redirect(url_for('nbg.index'))
    else:
        return ("Unauthorized", 401)

    return ("Unauthorized", 401)
