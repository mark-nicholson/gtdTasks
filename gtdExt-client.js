
function gtdButtonClick () {
    console.log("GTD: button clicked!");
    chrome.runtime.sendMessage(
	{appName: "gtdGtasks", update: true},
	function(response) {
	    console.log("click: got response: " + response.msg);
	}
    );
    console.log("GTD: msg done");
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

/*
 * This enclosing function provides some sort of page context.
 */
(function () {

    var iFrame = document.querySelector('iframe');

    console.log("GTD: enter");

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
	var newButton = createGoogleToolbarButton("GTD", gtdButtonClick);
    
	toolbarDiv.appendChild(newButton);
    }
    
    console.log("GDT: done");
    
})();
