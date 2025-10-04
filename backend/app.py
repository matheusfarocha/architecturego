from flask import Flask, request, session

app = Flask(__name__)

if __name__ == '__main__':
    app.run()

@app.route('/receive_scan', methods=['GET'])
def handle_scan():
    if request.method == 'GET':
        id = request.form['id']
        what = request.form['what']
        when = request.form['where']
        #send to database
        
        # get desc, data, etc...  from wherever scan is pulling it from possibly, if not query somethin else
        desc = None
        img = None
        return ['desc': desc, 'image': img]

@app.route('/profile', methods=['GET'])
def handle_profile():
    if request.method == 'GET':
        id = request.form['id']
        #collect total art scanned by id, whatever else
        #return variable with stats
        
@app.route('collection', methods=['GET'])
def handle_collection():
    if request.method == 'GET':
        id = request.form['id']
        #query supabase collecting stuff
        # return imgs (possibly link), descs, etc. how they want it ig