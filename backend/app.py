from flask import Flask, request, jsonify, session
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# --- Setup ---
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("JWT_SECRET") or "secret-key"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- SIGNUP ---
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        if res.user:
            return jsonify({"message": "User created!", "email": email})
        else:
            return jsonify({"error": "Signup failed."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# --- LOGIN ---
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        session['access_token'] = res.session.access_token
        session['user'] = res.user.email
        return jsonify({"message": "Logged in!", "email": res.user.email})
    except Exception as e:
        return jsonify({"error": str(e)}), 401


# --- LOGOUT ---
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})


# --- PROFILE ---
@app.route('/profile', methods=['GET'])
def profile():
    """Show current logged-in user's profile."""
    if 'user' in session:
        return jsonify({"logged_in_as": session['user']})
    else:
        return jsonify({"error": "Not logged in"}), 401


# --- RECEIVE SCAN ---
@app.route('/receive_scan', methods=['POST'])
def handle_scan():
    data = request.get_json()
    user_email = session.get('user')

    if not user_email:
        return jsonify({"error": "Not logged in"}), 401

    what = data.get('what')
    when = data.get('when')
    where = data.get('where')

    # Store scan data in Supabase
    res = supabase.table("scans").insert({
        "user_email": user_email,
        "what": what,
        "when": when,
        "where": where
    }).execute()

    return jsonify({"message": "Scan received!", "data": res.data})


# --- COLLECTION ---
@app.route('/collection', methods=['GET'])
def handle_collection():
    user_email = session.get('user')

    if not user_email:
        return jsonify({"error": "Not logged in"}), 401

    res = supabase.table("scans").select("*").eq("user_email", user_email).execute()

    return jsonify({
        "collection": res.data
    })


if __name__ == '__main__':
    app.run(debug=True)
