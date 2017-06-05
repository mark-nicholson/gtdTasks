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
function authorizeClientJS() {
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
window.gapi_onload = authorizeClientJS;
loadScript('https://apis.google.com/js/client.js', null);

// This works as well
//loadScript('https://apis.google.com/js/client.js?onload=authorizeClientJS', null);

// theoretically should use 'api.js', but we get a load error... Nobody seems
// to have this working in a chrome-extension.



/*
 *  Still does not work.
 *
 function authorizeApiJS() {
    chrome.identity.getAuthToken(
	{'interactive': true},
	function(token) {
	    // apply the token from chrome
	    gapi.auth.setToken( { access_token: token } );
	}
    );
    gapi.load('client:auth2', initClient);
}
function initClient() {
    // kick things off
    gapi.client.load('tasks', 'v1', tasksAPILoaded);
}

loadGapiScript('https://apis.google.com/js/api.js', authorizeApiJS);
*/

/******************************************************************************
 *   Tasks Interface
 ******************************************************************************/

var g_taskLists = null;
var gtdTaskLists = [];
var gtdTasks = {};

function logTaskLists(response) {
    console.log("logTaskLists: entry");

    var taskLists = response.result.items;

    g_taskLists = response.result.items;

    if (taskLists && taskLists.length > 0) {
	for (var i = 0; i < taskLists.length; i++) {
	    var tl = taskLists[i];
	    console.log("list[" + i + "]: " + tl.title);

	    /* create an entry for the tasks */
	    gtdTaskLists.push(tl);
	    gtdTasks[tl.id] = [];

	    /* fetch the tasks for this one */
	    gapi.client.tasks.tasks.list({'tasklist': tl.id}).then(
		logTasks,
		handleTasks,
		tl
	    );
	}
    }
    else {
	console.log("No task lists found");
    }
}

function logTasks(response) {
    console.log("logTasks: entry");

    var tasks = response.result.items;

    if (tasks && tasks.length > 0) {
	for (var i = 0; i < tasks.length; i++) {
	    var t = tasks[i];
	    console.log(this.title + ": task[" + i + "]: " + t.title);

	    gtdTasks[this.id].push(t);
	}
    }
    else {
	console.log("No tasks found for " + this.title);
    }    
}
function handleTasks(reason) {
    console.log("problem collecting tasks for " + this.title);
}

/*
 * Adding something here
 */

function tasksAPILoaded() {
    //do stuff here=
    console.log('gapi loaded.', gapi.auth, gapi.client);

    /* works */
    //var request = gapi.client.tasks.tasklists.list();
    //request.execute( logTaskLists );

    gapi.client.tasks.tasklists.list().then( logTaskLists );

    var talTL = [];
    var blob = {
	'taskLists': [],
	'done': false,
	'error': null
    };

    /*gapi.client.tasks.tasklists.list().then(
	function(response) {
	    //talResponse = response;
	    var taskLists = response.result.items;
	    for (var i = 0; i < taskLists.length; i++) {
		var taskList = taskLists[i];
		console.log("[tAL] " + taskList.title);
		this.taskLists.push(taskList);
	    }
	    blob.done = true;
	},
	function(reason) {
	    console.error(
		"[tAL] taskList listing failed: " +
		    reason.result.error.message);
	    blob.error = reason.result.error;
	    blob.done = true;
	},
	blob
    );

    console.log("talTL: " + talTL.length);
    */
    //printAllTasks("a", "b", "c");
}

function testMe() {
    var myList = [];
    
}

var msgCount = 0;

function messageDispatch(msg, sender, sendResponse) {
    console.log("[md] MSG: received (" + msgCount + ") - Action: " + msg.action);
    msgCount++;
    var rMsg;
    var request;
    var blob = {
	'rx': {
	    'sentMsg': msg,
	    'sender': sender,
	    'sendResponse': sendResponse
	},
	'tx': {
	    'items': [],
	    'error': "",
	    'msg': ""
	}
    };

    /* every call chain must end with sending a message */
    if (msg.action == 'update') {
	rMsg = updateNextTasks(msg, sender, sendResponse);
    }
    else if (msg.action == 'print') {
	//rMsg = printAllTasks(msg, sender, sendResponse);
	console.log(JSON.stringify(gtdTaskLists));
	console.log(JSON.stringify(gtdTasks));
    }
    else if (msg.action == 'getTaskListsA') {
	blob.tx.msg = "message from blob";
	messageBack(blob);
    }
    else if (msg.action == 'getTaskListsB') {
	request = gapi.client.tasks.tasklists.list().then(
	    messageBack, //fetchTaskLists,
	    handleFetchTaskLists,
	    blob
	);
    }
    else if (msg.action == 'getTaskLists') {
	var r = {
	    'msg': 'success',
	    'error': "",
	    'items': gtdTaskLists
	};
	sendResponse(r);
    }
    else if (msg.action == 'getTasks') {
	console.log("returning tasks for " + msg.taskListID);
	var r = {
	    'msg': 'success',
	    'error': "",
	    'items': gtdTasks[msg.taskListID]
	};
	sendResponse(r);
    }
    else {
	console.log("[mD] unsupported action: '" + msg.action + "'.");
	sendResponse( { msg: "unsupported action: '" + msg.action + "'." });
    }
}
    
/* install the handler */
chrome.runtime.onMessage.addListener(messageDispatch);

//function messageBack(msg, sender, sendResponse, note) {
//function messageBack(sendResponse, note) {
function messageBack(response) {
    var keys = Object.keys(this);
    for (var i in keys) {
	var key = keys[i];
	console.log("--- this." + key + " = " + this[key]);
    }
    //console.log("response: " + JSON.stringify(response));
    //console.log("this: " + JSON.stringify(this));
    var sr = this.rx.sendResponse;
    //var info = blob.tx;
    /*var info = {
	'msg': blob.tx.msg,
	'error': '',
	'items': [ 'thing1', 'thing2' ]
    };*/
    //blob.rx.sendResponse( { msg: blob.tx.msg } );
    //this.rx.sendResponse( {'msg': "hello world"} );
    sr( {'msg': "hello world"} );
}

function fetchTaskLists(response) {
    var taskLists = response.result.items;

    /* bail out if there is nothing to do */
    if (!taskLists || taskLists.length <= 0) {
	this.tx.msg = "no task lists available";
	console.log("[fAL] " + this.tx.msg);
	this.rx.sendResponse(this.tx);
	return;
    }

    
    for (var i = 0; i < taskLists.length; i++) {
	var taskList = taskLists[i];
	console.log("[fAL] " + taskList.title);
	this.tx.items.push(taskList);
    }

    /* all good */
    //this.tx.msg = "success";
    //this.rx.sendResponse(this.tx);
    console.log("[fAL] sending response: " + this.tx.items.length);
    this.rx.sendResponse( { 'msg': "success: " + this.tx.items.length } );
    return;
}

function handleFetchTaskLists(reason) {
    this.tx.msg = "error: " + reason.result.error.message;
    this.rx.sendResponse(this.tx);
    return;
}

function updateNextTasks(msg, sender, sendResponse) {
    console.log("[uNT] begin"); 
}

function printAllTasks(msg, sender, sendResponse) {
//function printAllTasks(response) {
    console.log("[pAT] begin");

    //var response = gapi.client.tasks.tasklists.list().execute();
    //console.log(response.toString());
    var taskLists = []; //response.result.items;
    //console.log(taskLists.toString());

    /* make sure there is something to do */
    if (!taskLists || taskLists.length <= 0) {
	console.log("[pAT] No task lists found");
	return { msg: "no task lists" };
    }

    /* iterate them */
    for (var i = 0; i < taskLists.length; i++) {
	var tl = taskLists[i];
	console.log("[pAT] list[" + i + "]: " + tl.title);
    }

    /* success */
    return { msg: "Success!" };
}


/*
chrome.runtime.onMessage.addListener(
    function(msg, sender, sendResponse) {

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
*/
