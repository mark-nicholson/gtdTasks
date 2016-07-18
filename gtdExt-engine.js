/*
 * gtdGTasks main engine.
 *   This provides the JS interface to the tasks. It will perform the 
 *  task list updating and manage the callbacks.
 */

/* make sure we can track our info */
var manifest = chrome.runtime.getManifest();
console.log("BG: " + manifest.name);
console.log("BG: " + manifest.version);

/**
 * authorize the GAPI using Chrome's built-in OAuth2 mechanisms.
 */
function authorize() {
    var token = "";

    chrome.identity.getAuthToken(
	{'interactive': true},
	function(token) {
	    // apply the token from chrome
	    gapi.auth.setToken( { access_token: token } );
	}
    );
    
    // kick things off
    gapi.client.load('tasks', 'v1', tasksAPILoaded);
}


// Bootstrap
window.gapi_onload = authorize;

// theoretically should use 'api.js', but we get a load error...
loadScript('https://apis.google.com/js/client.js', null);


/******************************************************************************
 *   Tasks Interface
 ******************************************************************************/

var g_taskLists = null;

function logTaskLists(response) {
    console.log("logTaskLists: entry");

    var taskLists = response.items;

    g_taskLists = response.items;

    if (taskLists && taskLists.length > 0) {
	for (var i = 0; i < taskLists.length; i++) {
	    var tl = taskLists[i];
	    console.log("list[" + i + "]: " + tl.title);
	}
    }
    else {
	console.log("No task lists found");
    }
}

function tasksAPILoaded() {
    //do stuff here=
    console.log('gapi loaded.', gapi.auth, gapi.client);

    var request = gapi.client.tasks.tasklists.list();

    request.execute( logTaskLists );
}

var msgCount = 0;

chrome.runtime.onMessage.addListener(
    function(msg, sender, sendResponse) {
	console.log("MSG: received (" + msgCount + ")");
	msgCount++;

	if (g_taskLists != null) {
	    console.log("tasklists: " + g_taskLists.length);
	    tl = g_taskLists[msgCount % g_taskLists.length];
	    console.log("Showing tasks in: " + tl.title);

	    var request = gapi.client.tasks.tasks.list( {tasklist: tl.id} );

	    request.execute(
		function(response) {
		    tasks = response.items;

		    for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			console.log("" + tl.title + " / " + task.title);
		    }
		}
	    );
	}
	else {
	    console.log("no tasklists registered");
	}
	
	sendResponse( { msg: "back at you" } );
    }
);
