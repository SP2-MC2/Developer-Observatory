#! Copyright (C) 2017 Christian Stransky
#!
#! This software may be modified and distributed under the terms
#! of the MIT license.  See the LICENSE file for details.

from flask import Flask, redirect, request, make_response, jsonify
from shutil import copyfile, chown
import json
import requests
import os.path
import uuid
import urllib

app = Flask(__name__)

remote_task_file = "%landingURL%/get_ipynb/"
target_file = "/home/jupyter/tasks.ipynb"
user_data_file = "/home/jupyter/.instanceinfo"
app_mode = "%appMode%"

DB_HOST = "%landingURL%"
DB_URL = "{:s}/submit".format(DB_HOST)

def sendData(data):
    import urllib3
    from urllib3.util import Timeout
    
    #Ensure we have the correct data for this user
    try:
        with open(user_data_file) as data_file:    
            user_data = json.load(data_file)
            data["user_id"] = user_data["user_id"]
            data["token"] = user_data["token"]
    except Exception:
        pass

    https = urllib3.PoolManager()
    dataRaw = {}
    dataRaw['auth-token'] = "q9c(,}=C{mQD~)2#&t3!`fLQ3zk`9," # our client authentication, should be switched to a dynamic token
    dataRaw['json-payload'] = json.dumps(data)
    encoded_body = json.dumps(dataRaw).encode('utf-8')
    https.request('POST', DB_URL, headers={'Content-Type': 'application/json'}, body=encoded_body)


@app.route('/')
def init():
    print(request.args)
    user_id = request.args.get('userId') 
    token = request.args.get('token')
    user_data = {}
    user_data["user_id"] = user_id
    user_data["token"] = token
    
    #Check if a task file already exists on this instance
    if not os.path.isfile(target_file):
        #If not, then request data for this user from the landing page
        task_file = urllib.request.URLopener()
        task_file.retrieve(remote_task_file+user_id+"/"+token, target_file)
        chown(target_file, user="jupyter", group="jupyter")


        
    #Prepare the response to the client -> Redirect + set cookies for uid and token
    response = make_response(redirect('nb/notebooks/tasks.ipynb'))
    response.set_cookie('userId', user_id)
    response.set_cookie('token', token)
    
    # Check if we already stored user data on this instance
    if not os.path.isfile(user_data_file):
        with open(user_data_file, "w") as f:
            #writing the data allows us to retrieve it anytime, if the user has cookies disabled for example.
            json.dump(user_data, f)
    return response


@app.route("/survey", methods=['GET'])
def forward_to_survey():
    '''
    User has finished, now redirect to the exit survey.
    '''
    try:
        with open(user_data_file) as data_file:    
            user_data = json.load(data_file)
            user_id = user_data["user_id"]
            token = user_data["token"]
            return redirect("/survey/"+user_id+"/"+token)
    except Exception:
        pass


@app.route("/submit", methods=['POST'])
def send_notebook():
    '''
    This function sends the participant code to the landing server.
    It also verifies that the JSON data is less than 1 MB to avoid unnecessary traffic by malicious users who could let the JSON file grow.
    '''
    if request.method == 'POST' and request.json:
        # check json size
        # only send, if size is less than 1 MB
        if len(request.json) < 1*1024*1024:
            sendData(request.json)
            return ""
        abort(400)
    else:
        abort(400)


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=60000, debug=app_mode == "DEBUG")
