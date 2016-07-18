/*var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://apis.google.com/js/client.js";
head.appendChild(script);
*/

var manifest = chrome.runtime.getManifest();
console.log("BG: " + manifest.name);
console.log("BG: " + manifest.version);

//oauth2 auth
chrome.identity.getAuthToken(
    {'interactive': true},
    function() {
	//load Google's javascript client libraries
	window.gapi_onload = authorize;
	loadScript('https://apis.google.com/js/client.js');
	//loadScript('https://apis.google.com/js/api.js');
    }
);

function loadScript(url){
    var request = new XMLHttpRequest();

    request.onreadystatechange = function(){
	if(request.readyState !== 4) {
	    return;
	}
	
	if(request.status !== 200) {
	    return;
	}
	
	eval(request.responseText);
	};
    
    request.open('GET', url);
    request.send();
}

function authorize() {
    gapi.auth.authorize(
	{
	    client_id: '276059749769-k2cb4aolh55lo9ujb7e8r49prh45jek6.apps.googleusercontent.com',
	    immediate: true,
	    scope: 'https://www.googleapis.com/auth/tasks'
	},
	function(){
	    gapi.client.load('tasks', 'v1', tasksAPILoaded);
	}
    );
}

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


/*
window.gapi_onload = function () {
    console.log('gapi loaded.', gapi.auth, gapi.client);
}*/

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
