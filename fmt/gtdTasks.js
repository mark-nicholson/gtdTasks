
/* create a dup'ed list (shallow copy) and put next-tasks in 0 */
function dupTasksList() {
    var i, tl, rl;
    rl = tData['taskLists'].slice(0)
    for (i in rl) {
        if (rl[i].title == 'Next-Tasks')
            rl.unshift( rl.splice(i,1)[0] );
    }
    return rl;
}

function taskListByID(id) {
    var idx, tl;
    for (idx in tData['taskLists']) {
        tl = tData['taskLists'][idx];
        if (tl.id == id)
            return tl;
    }
    return null;
}

/*
 * Populate <div> with a checkbox list of tasklists
 */
function taskListsSelectionList(divID) {
    var taskList, tIdx, checkbox, label, pItem;
    var pList = document.getElementById(divID);
    var taskLists = dupTasksList();

    /* clear out any previous list ... */
    while (pList.childElementCount > 0)
        pList.removeChild(pList.firstChild);
    
    /* fill in the list */
    for (tIdx in taskLists) {
        taskList = taskLists[tIdx];
        
        /* ignore cruft */
        if (!taskList.title || taskList.title == "")
            continue;
        
        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = taskList.id;
        checkbox.classList.add('gtd-checkbox');
        checkbox.checked = true;  /* assume everything */

        var label = document.createElement('label');
        label.classList.add('gtd-checkbox-label');
        label.innerHTML = taskList.title;

        pItem = document.createElement('li');
        pItem.classList.add('list-group-item')
        pItem.appendChild(checkbox);
        pItem.appendChild(label);
        pList.appendChild(pItem);
        
    }
}

/*
 * Create a BS-panel for each tasklist and its tasks
 */
function taskListPanel(taskList, prefs) {
    var pItem, task, tIdx, checkbox, tDiv, pBody, pList, tasks, label, pFoot;
    var panel = document.createElement('div');
    var panelHeading = document.createElement('div');
    var phData = document.createElement('h3');
    
    panel.classList.add('panel');
    panel.classList.add('panel-primary');
    panel.classList.add('panel-gtd');
    
    panelHeading.classList.add('panel-heading');

    phData.classList.add('panel-title');
    phData.innerHTML = taskList.title;

    panelHeading.appendChild(phData);
    panel.appendChild(panelHeading);
    
    pBody = document.createElement('div');
    pBody.classList.add('panel-body');
    
    pList = document.createElement('ul');
    pList.classList.add('list-group')
    pBody.appendChild(pList);
    
    tasks = tData['tasks'][taskList.id];
    
    for (tIdx in tasks) {
        task = tasks[tIdx];
        
        /* ignore cruft */
        if (!task.title || task.title == "" || task.hidden)
            continue;
        
        var table = document.createElement('table');
        var row = document.createElement('tr');
        var cbCell = document.createElement('td');
        var lCell = document.createElement('td');
        
        table.appendChild(row);
        row.appendChild(cbCell);
        row.appendChild(lCell);
        
        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = task.id;
        checkbox.classList.add('gtd-checkbox');
        cbCell.appendChild(checkbox);

        label = document.createElement('label');
        label.classList.add('gtd-checkbox-label');
        label.innerHTML = task.title;
        lCell.appendChild(label);
        
        /* formatting */
        if (task.completed) {
            if (!prefs.includeCompleted)
                continue;
            
            checkbox.checked = true;
            label.classList.add('gtd-completed');
        }

        pItem = document.createElement('li');
        pItem.classList.add('list-group-item');
        pItem.appendChild(table);
        pList.appendChild(pItem);
        
    }
    
    panel.appendChild(pBody);
    
    pFoot = document.createElement('div');
    pFoot.classList.add('panel-footer');
    pFoot.innerHTML = "Footer Text";
    panel.appendChild(pFoot);
    
    return panel;
}

function renderTasks(prefs) {
    'use strict';
    var fit = 'linear';
    var ti, tl, nextTL=null, item, taskLists, divs = [], tls = [], nextTLDiv;
    var printArea = document.getElementById('printArea');
    
    /* always have next-tasks first */
    taskLists = prefs.taskLists;

    for (ti in taskLists){
        console.log("got: " + taskLists[ti].title);
    }

    ti = taskLists.findIndex(function(element) {
        return element.title == 'Next-Tasks';
    })
    if (ti >= 0)
        nextTL = taskLists.splice(ti,1)[0];

    /* arrange the block shortest to tallest */
    taskLists.sort(function(a, b){
        var lenA = tData['tasks'][a.id].length;
        var lenB = tData['tasks'][b.id].length;
        if(lenA < lenB) return -1;
        if(lenA > lenB) return 1;
        return 0;
    });

    /*
     * Clear out any pre-existing divs...
     */
    while (printArea.childElementCount > 0)
        printArea.removeChild(printArea.firstChild);

    var panels = [];
    
    /* setup the next task div */
    if (nextTL) {
        nextTLDiv = taskListPanel(nextTL, prefs);
        panels.push(nextTLDiv);
    }

    /* fill in the rest of the divs */
    for (ti in taskLists) {
        tl = taskLists[ti];
        item = taskListPanel(tl, prefs);
        panels.push(item);
    }
    
    var row, col, pi;
    
    for (pi in panels) {
        if (pi % 3 == 0) {
            row = document.createElement('div');
            row.classList.add('row');
            printArea.appendChild(row);
        }
    
        col = document.createElement('div');
        col.classList.add('col-md-4');
        col.appendChild(panels[pi]);
        row.appendChild(col);
    }
    
    return;
}


function checkSizes() {
    var printArea = document.getElementById('printArea');
    console.log("printArea.client: %sx%s", 
                printArea.clientWidth, printArea.clientHeight);
    console.log("printArea:        %sx%s",
                printArea.width, printArea.height);
    
    console.log("window.inner:     %sx%s",
                window.innerWidth, window.innerHeight);
    
    var child, idx;
    
    for (idx = 0; idx < printArea.childElementCount; idx++) {
        child = printArea.children[idx];
        console.log("child[%s] %sx%s", idx, 
                    child.clientWidth, child.clientHeight);
    }
}
