/*
 * Utility routines helpful in common places.
 */

/**
 * Load a JavaScript and make it ready.
 *
 *  scriptName - base name relative to extension's lib/ dir or full URL
 *  callback   - routine to execute upon load completion
 */
function loadScript(scriptName, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = scriptName
    if (!scriptName.includes("://")) {
	scriptEl.src = chrome.extension.getURL('lib/' + scriptName + '.js');
    }
    if (callback) {
	scriptEl.addEventListener('onload', callback, false);
    }
    document.head.appendChild(scriptEl);
}

function loadGapiScript(scriptName, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = scriptName;
    scriptEl.async = true;
    scriptEl.defer = true;
    
    scriptEl.addEventListener('load', callback, false);

    document.head.appendChild(scriptEl);
}

console.log("Utilities Loaded!");
