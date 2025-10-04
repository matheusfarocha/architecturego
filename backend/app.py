from flask import Flask, request
import os
from dotenv import load_dotenv
from supabase import create_client, Client

app = Flask(__name__)


@app.route('/receive_scan', methods=['POST'])
def handle_scan():
    if request.method == 'POST':
        id = request.form['id']
        what = request.form['what']
        where = request.form['where']

        #load supabase
        load_dotenv()
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
        return {'desc': desc, 'image': img}

@app.route('/profile', methods=['POST'])
def handle_profile():
    if request.method == 'POST':
        id = request.form['id']
        load_dotenv()
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        supabase: Client = create_client(url, key)
        pieces = supabase.table("main").select("*", count="exact").eq("id", id).execute().count
        return pieces
        
@app.route('/collection', methods=['POST'])
def handle_collection():
    if request.method == 'POST':
        id = request.form['id']
        load_dotenv()
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        supabase: Client = create_client(url, key)
        #query supabase collecting all stuff from user
        pieces = supabase.table("main").select("*").eq("id", id).execute()
        return str(pieces)

if __name__ == '__main__':
    app.run()