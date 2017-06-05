
function gtdButtonClick () {
    console.log("GTD: button clicked!");

    chrome.runtime.sendMessage(
	//{appName: "gtdGtasks", update: true, action: "update"},
	{appName: "gtdGtasks", action: "getTaskLists"},
	function(response) {
	    if (!response) {
		console.log("response argument is null");
		return;
	    }
	    var keys = Object.keys(response);
	    for (var k in keys) {
		console.log("--- response." + k + " = " + keys[k]);
	    }
	    
	    console.log("click: got response: " + response.msg);
	    if (response.error != "" ) {
		console.log("[gBC] error received: " + response.error);
		return;
	    }
	    if (!response.items || response.items.length <= 0) {
		console.log("[gBC] no items returned");
		return;
	    }
	    logTaskLists(response);
	}
    );
    console.log("GTD: msg done");
}

function gtdPrintButtonClick () {
    console.log("GTD: print button clicked!");
    chrome.runtime.sendMessage(
	{appName: "gtdGtasks", update: false, action: "print"},
	function(response) {
	    console.log("click: got response: " + response.msg);
	}
    );
    console.log("GTD: msg done");
}

function logTaskLists(response) {
    console.log("logTaskLists: entry");

    var taskLists = response.items;

    //g_taskLists = response.items;

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

function createGoogleToolbarButton(title, callback) {

    var newButton = document.createElement("DIV");
    newButton.setAttribute("id", ":1.gtd");
    newButton.setAttribute("class", "goog-toolbar-button goog-inline-block");
    newButton.setAttribute("title", "Get-Things-Done");
    //newButton.setAttribute("aria-pressed", "false");
    newButton.setAttribute("role", "button");
    newButton.setAttribute("style", "-webkit-user-select: none;");
    newButton.addEventListener("click", callback);
    
    var nbOuter = document.createElement("DIV");
    nbOuter.setAttribute("class", "goog-inline-block goog-toolbar-button-outer-box");
    nbOuter.setAttribute("style", "-webkit-user-select: none;");
    
    var nbInner = document.createElement("DIV");
    nbInner.setAttribute("class", "goog-inline-block goog-toolbar-button-inner-box");
    nbInner.setAttribute("style", "-webkit-user-select: none;");
    
    var nbText = document.createElement("DIV");
    nbText.setAttribute("class", "goog-inline-block e");
    nbText.setAttribute("style", "-webkit-user-select: none;");
    nbText.innerHTML = title;
    
    nbInner.appendChild(nbText);
    nbOuter.appendChild(nbInner);
    newButton.appendChild(nbOuter);

    return newButton;
}

function getGoogleToolbar(contentDoc) {
    var stuff = [ '.goog-toolbar', '.goog-toolbar.Mc' ];
    var toolbarDiv;
    var found = '';
	
    for (var i = 0; i < stuff.length; i++) {
	console.log("GTD: grabbing toolbar using: " + stuff[i]);

	toolbarDiv = contentDoc.querySelector(stuff[i]);
	if (toolbarDiv) {
	    break;
	}
    }

    if (!toolbarDiv) {	    
	console.log("GTD: Failed to locate the toolbar-div");
	console.log("GTD: Cannot continue");
	return null;
    }
	
    console.log("GTD: Success: " + toolbarDiv);
    console.log("GTD: Success: " + toolbarDiv.id);

    return toolbarDiv;
};

function loadScript(scriptName, callback) {
    var scriptEl = document.createElement('script');
    console.log("[LS] loading: " + scriptName);
    scriptEl.src = scriptName;
    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.addEventListener(
	'onload', "this.onload=function(){};loadClient()");
    scriptEl.addEventListener(
	'onreadystatechange',
	"if (this.readyState === 'complete') this.onload()");
    
    if (!scriptName.includes("://")) {
	scriptEl.src = chrome.extension.getURL('lib/' + scriptName + '.js');
    }
    if (callback) {
	scriptEl.addEventListener('load', callback, false);
    }
    document.head.appendChild(scriptEl);
    console.log("[LS] done");
}

var gapiLoaded = false;

/*
 * This enclosing function provides some sort of page context.
 */
(function () {

    var iFrame = document.querySelector('iframe');

    console.log("GTD: enter");

    if (!gapiLoaded) {
	loadScript('https://apis.google.com/js/api.js', null);
	gapiLoaded = true;
    }

    /* wait until the table is set */
    if (iFrame == null 
	|| iFrame.contentDocument == undefined
	|| iFrame.contentDocument.querySelector('table.Pb') == undefined) {
	console.log("GTD: Table not yet loaded");
	return setTimeout(arguments.callee, 33);
    }

    var contentDocument = iFrame.contentDocument;
    
    console.log("GTD: All good -- adding support");

    var toolbarDiv = getGoogleToolbar(contentDocument);
    if (toolbarDiv) {
	var gtdBt = createGoogleToolbarButton("GTD", gtdButtonClick);
	toolbarDiv.appendChild(gtdBt);
	var gtdPrBt = createGoogleToolbarButton("gtdPrint", gtdPrintButtonClick);
	toolbarDiv.appendChild(gtdPrBt);
    }
    
    console.log("GDT: done");
    
})();
