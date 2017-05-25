

// Client ID and API key from the Developer Console
var CLIENT_ID = '276059749769-fv7rj6tn4lot7ispmr5udorskla6fbuc.apps.googleusercontent.com';
var CLIENT_SECRET = 'Lbta6k0-4kBHfnyPUmDijNjF';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/tasks.readonly';

var authorizeButton = document.getElementById('authorize-button');
//var signoutButton = document.getElementById('signout-button');
var jsonButton = document.getElementById('json-button');

/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        //signoutButton.onclick = handleSignoutClick;
        jsonButton.onclick = handleJsonClick;
    });
}

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.innerHTML = 'Sign Out'
        //authorizeButton.style.display = 'none';
        //signoutButton.style.display = 'block';
        loadData();
    } else {
        authorizeButton.innerHTML = 'Authorize'
        //authorizeButton.style.display = 'block';
        //signoutButton.style.display = 'none';
    }
}

/**
*  Sign in the user upon button click.
*/
function handleAuthClick(event) {
    if (authorizeButton.innerHTML == 'Authorize')
        gapi.auth2.getAuthInstance().signIn();
    else
        gapi.auth2.getAuthInstance().signOut();
}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
*  Manage the JSON button
*/
function handleJsonClick(event) {
    if (mycache['taskLists'].length == Object.keys(mycache['tasks']).length) {
        var blob = new Blob(
            [ JSON.stringify(mycache) ],
            { type: "application/json;charset=utf-8"}
        );
        saveAs(blob, "data.json");              
    }
    else {
        console.log("Not complete yet...")
    }
}

/*
 * Loading support
 */
var mycache = {
  'taskLists': [],
  'tasks': {}
}

function loadTasksCache(response) {
    tasks = response.result.items;
    mycache['tasks'][this.id] = tasks;
    //json_when_complete();
}

function loadTaskListsCache(response) {
    mycache['taskLists'] = response.result.items;

    for (var idx in mycache['taskLists']) {
        var tl = mycache['taskLists'][idx];
        gapi.client.tasks.tasks.list({'tasklist': tl.id}).then(
            loadTasksCache, handleTasksError, tl
        );
    }
}

function loadData() {
    console.log("Load Data - Begin");
    gapi.client.tasks.tasklists.list({
        'maxResults': 100
    }).then(loadTaskListsCache);
    console.log("Load Data - End");
}

function handleTasksError(reason) {
    console.log("problem collecting tasks for " + this.title);
}


/**
* Append a pre element to the body containing the given message
* as its text node. Used to display the results of the API call.
*
* @param {string} message Text to be placed in pre element.
*/
/*function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}*/

/**
* Print task lists.
*/
/*function listTaskLists() {
gapi.client.tasks.tasklists.list({
    'maxResults': 10
}).then(function(response) {
  appendPre('Task Lists:');
  var taskLists = response.result.items;
  if (taskLists && taskLists.length > 0) {
    for (var i = 0; i < taskLists.length; i++) {
      var taskList = taskLists[i];
      appendPre(taskList.title + ' (' + taskList.id + ')');
    }
  } else {
    appendPre('No task lists found.');
  }
});
}*/

