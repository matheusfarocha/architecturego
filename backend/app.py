from flask import Flask, request
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai

load_dotenv()
app = Flask(__name__)
GEMINI_KEY = os.environ.get("GEMINI_KEY")
client = genai.Client(api_key=GEMINI_KEY)

@app.route('/pull_desc', methods =['POST'])
def handle_desc():
    name = request.form['name']
    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Based on the piece: " + name + "generate a short 2-3 sentence description about it.",
    )
    return response.text

@app.route('/receive_scan', methods=['POST'])
def handle_scan():
    
    if request.method == 'POST':
        id = request.form['id']
        what = request.form['what']
        where = request.form['where']

        #load supabase
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        supabase: Client = create_client(url, key)
        #check if exists already
        if supabase.table("main").select("*", count="exact").eq("id", id).eq("what", what).execute().count >= 1:
            return "already scanned"
        # send to database
        supabase.table("main").insert({"id": id, "what": what, "where": where}).execute()

        ##### get desc, data, etc...  from wherever scan is pulling it from possibly, if not query somethin else
        desc = None
        img = None

        return 

@app.route('/profile', methods=['POST'])
def handle_profile():
    if request.method == 'POST':
        id = request.form['id']
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        supabase: Client = create_client(url, key)
        amount = supabase.table("main").select("*", count="exact").eq("id", id).execute().count
        return amount
        
@app.route('/collection', methods=['POST'])
def handle_collection():
    if request.method == 'POST':
        id = request.form['id']
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        supabase: Client = create_client(url, key)
        #query supabase collecting all stuff from user
        pieces = supabase.table("main").select("*").eq("id", id).execute()
        return str(pieces)

if __name__ == '__main__':
    app.run()