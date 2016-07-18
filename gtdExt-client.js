(function () {

    var iFrame = document.querySelector('iframe');

    console.log("GTD: enter");

    console.log("window.gapi_onload = " + window.gapi_onload);
    
    /* wait until the table is set */
    if (iFrame == null 
        || iFrame.contentDocument == undefined
        || iFrame.contentDocument.querySelector('table.Pb') == undefined) {
	console.log("GTD: Table not yet loaded");
        return setTimeout(arguments.callee, 33);
    }

    var contentDocument = iFrame.contentDocument;

    /*
    $('head', contentDocument).append('<link rel="stylesheet" type="text/css" href="' + chrome.extension.getURL('iframe.css') + '" />');
*/
    
    
    function addGtdSupport(cDoc) {
	//var stuff = [ '#:1.t', '#:1.t.goog-toolbar', '#:1.t.goog-toolbar.Mc' ]
	//var stuff = [ 'div#:1.t', 'div#:1.t.goog-toolbar', 'div#:1.t.goog-toolbar.Mc' ]
	var stuff = [ '.goog-toolbar', '.goog-toolbar.Mc' ];
	var toolbarDiv;
	var found = '';
	
	for (var i = 0; i < stuff.length; i++) {
	    console.log("GTD: grabbing toolbar using: " + stuff[i]);
	    
	    //toolbarDiv = $(stuff[i]);
	    //if (toolbarDiv) {
		//found += 'a';
	    //}
	    //toolbarDiv = cDoc.getElementById(stuff[i]);
	    //if (toolbarDiv) {
		//found += 'b';
	    //}
	    toolbarDiv = iFrame.contentDocument.querySelector(stuff[i]);
	    if (toolbarDiv) {
		found += 'c';
	    }
	    
	    if (found != "") {
		break;
	    }
	    
	    console.log("GTD: Failed to locate the toolbar-div");
	}

	if (!toolbarDiv) {
	    console.log("GTD: Cannot continue");
	    return;
	}
	
	console.log("GTD: Success: " + toolbarDiv);
	console.log("GTD: Success: " + toolbarDiv.id);

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

	var newButton = document.createElement("DIV");
	newButton.setAttribute("id", ":1.gtd");
	newButton.setAttribute("class", "goog-toolbar-button goog-inline-block");
	newButton.setAttribute("title", "Get-Things-Done");
	//newButton.setAttribute("aria-pressed", "false");
	newButton.setAttribute("role", "button");
	newButton.setAttribute("style", "-webkit-user-select: none;");
	newButton.addEventListener("click", gtdButtonClick);

	var nbOuter = document.createElement("DIV");
	nbOuter.setAttribute("class", "goog-inline-block goog-toolbar-button-outer-box");
	nbOuter.setAttribute("style", "-webkit-user-select: none;");

	var nbInner = document.createElement("DIV");
	nbInner.setAttribute("class", "goog-inline-block goog-toolbar-button-inner-box");
	nbInner.setAttribute("style", "-webkit-user-select: none;");

	var nbText = document.createElement("DIV");
	nbText.setAttribute("class", "goog-inline-block e");
	nbText.setAttribute("style", "-webkit-user-select: none;");
	nbText.innerHTML = "GTD";
	
	nbInner.appendChild(nbText);
	nbOuter.appendChild(nbInner);
	newButton.appendChild(nbOuter);
	toolbarDiv.appendChild(newButton);

    };

    /* setup the trigger */
    //window.onload = addGtdSupport;

    console.log("GTD: All good -- adding support");

    addGtdSupport(contentDocument);

    console.log("GDT: done");
})();
