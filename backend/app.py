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

# --- AUTH ROUTES ---

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        res = supabase.auth.sign_up({"email": email, "password": password})
        if res.user:
            return jsonify({"message": "User created!", "email": email})
        else:
            return jsonify({"error": "Signup failed."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if res.user:
            session['access_token'] = res.session.access_token
            session['user'] = res.user.email
            return jsonify({"message": "Logged in!", "email": res.user.email})
        else:
            return jsonify({"error": "Login failed."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})

@app.route('/profile', methods=['GET'])
def profile():
    if 'user' in session:
        return jsonify({"logged_in_as": session['user']})
    return jsonify({"error": "Not logged in"}), 401

# --- SCAN ROUTES ---

@app.route('/receive_scan', methods=['POST'])
def receive_scan():
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    user_email = session['user']
    id_ = data.get('id')
    what = data.get('what')
    where = data.get('where')

    if not id_ or not what or not where:
        return jsonify({"error": "id, what, and where are required"}), 400

    try:
        # Check for duplicates
        existing = supabase.table("main").select("*", count="exact")\
            .eq("id", id_).eq("what", what).execute()

        if existing.count >= 1:
            return jsonify({"message": "Already scanned"}), 400

        # Insert scan
        supabase.table("main").insert({
            "user_email": user_email,
            "id": id_,
            "what": what,
            "where": where
        }).execute()

        # Placeholder for extra data (desc, image)
        desc = None
        img = None

        return jsonify({"message": "Scan saved!", "desc": desc, "image": img})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/collection', methods=['GET'])
def collection():
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401

    user_email = session['user']

    try:
        scans = supabase.table("main").select("*").eq("user_email", user_email).execute()
        return jsonify({"collection": scans.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- RUN SERVER ---
if __name__ == '__main__':
    app.run(debug=True)
