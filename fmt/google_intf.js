

// Client ID and API key from the Developer Console
var CLIENT_ID = '276059749769-fv7rj6tn4lot7ispmr5udorskla6fbuc.apps.googleusercontent.com';
var CLIENT_SECRET = 'Lbta6k0-4kBHfnyPUmDijNjF';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/tasks';

var authorizeButton = document.getElementById('authorize-button');
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
        loadData();
    } else {
        authorizeButton.innerHTML = 'Authorize'
    }
}

/**
*  Sign in/out the user upon button click.
*/
function handleAuthClick(event) {
    if (authorizeButton.innerHTML == 'Authorize')
        gapi.auth2.getAuthInstance().signIn();
    else
        gapi.auth2.getAuthInstance().signOut();
}

/**
*  Manage the JSON button
*/
function handleJsonClick(event) {
    if (taskData.loaded()) {
        var blob = new Blob(
            [ JSON.stringify(taskData) ],
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

function loadTasksCache(response) {
    tasks = response.result.items;

    /* add an index so we can lookup a taskList from a task.id */
    for (var ti in tasks)
        taskData.addTask(tasks[ti], this);

    /* whichever set of tasks is last to be added triggers the initial render */
    if (taskData.loaded) {
        
        gtdTaskPreferences.taskLists = taskData.getTaskLists();
        
        renderTasks();
    }
}

function loadTaskListsCache(response) {
    for (var idx in response.result.items) {
        var tl = response.result.items[idx];
        
        /* add the tasklist to the cache first */
        taskData.addTaskList(tl);
        
        gapi.client.tasks.tasks.list({'tasklist': tl.id}).then(
            loadTasksCache, handleTasksError, tl
        );
    }
}

function loadData() {
    gapi.client.tasks.tasklists.list({
        'maxResults': 100
    }).then(loadTaskListsCache);
}

function handleTasksError(reason) {
    console.log("problem collecting tasks for " + this.title);
}
