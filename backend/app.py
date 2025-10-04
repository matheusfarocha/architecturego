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
        
        # get desc, data, etc... 
        desc = None
        img = None
        return ['desc': desc, 'image': img]

@app.route('/profile', methods = ['POST'])
def handle_profile():
    if request.method == ['POST']:
        id = request.form['id']
        # collect total art scanned by id, whatever else
        # variable with stats
        