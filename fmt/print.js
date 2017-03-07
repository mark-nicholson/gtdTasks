
function tasksUL(taskList) {
    var hlist = document.createElement("UL");
    var tasks = tData['tasks'][taskList.id];
    var ti, task, item;
    for (ti in tasks) {
        task = tasks[ti];
        item = document.createElement('li');
        item.innerHTML = task.title;
        hlist.appendChild(item);
    }

    return hlist;
}

/*
 * Generate an HTML <table> which contains the tasks, each with
 *  a checkbox.  If the list is long, broaden the table to have
 *  multiple "sets" of cb/task entries.
 */
function tasksTable(tasks) {
    var idx, task;
    var table = document.createElement("table");
    var colSetCount = 1;
    var row, cb, info, checkbox;
    var taskEntry = [];
    var rowIdx, setIdx;
    
    table.classList.add('gtd-task-table');
    
    if (tasks.length > 24) {
        colSetCount = Math.ceil(tasks.length/16);
    }
        
    for (idx in tasks) {
        task = tasks[idx];
        
        if (colSetCount > 1) {
            setIdx = Math.round(idx/16);
            rowIdx = idx % 16;
        }
        else {
            setIdx = 1;
            rowIdx = idx;
        }
        
        /* ignore cruft */
        if (task.title == "" || task.hidden)
            continue;
        
        /* do what was asked */
        if (task.completed && !printDialogPrefs.includeCompleted)
            continue;
        
        /* create the html framework */
        row = taskEntry[rowIdx];
        if (!row) {
            row = document.createElement('tr');
            taskEntry.push(row);
        }
        cb = document.createElement('td');
        info = document.createElement('td');
        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        
        /* formatting */
        if (task.completed) {
            checkbox.checked = true;
            info.classList.add('gtd-completed');
        }
        
        /* fill in the contents */
        cb.appendChild(checkbox);
        info.innerHTML = task.title;
        info.style.width = "175px";
        
        row.appendChild(cb);
        row.appendChild(info);
        
        table.appendChild(row);
    }

    return [table, colSetCount];
}

/*
 * Populate <div> with a checkbox list of tasklists
 */
function taskListsSelectionDiv(divID) {
    var div = document.getElementById(divID);
    var taskLists = dupTasksList();
    var table = document.createElement("table");
    var idx, taskList, row, cb, checkbox;

    /* clear out any previous list ... */
    while (div.childElementCount > 0)
        div.removeChild(div.firstChild);
    
    /* re-add the current task lists */
    for (idx in taskLists) {
        taskList = taskLists[idx];
        
        /* ignore cruft */
        if (taskList.title == "")
            continue;

        row = document.createElement('tr');
        cb = document.createElement('td');
        info = document.createElement('td');
        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;  /* Default to selected */
        checkbox.onclick = updatePrefsTaskLists;
        checkbox.taskList = taskList;
        printDialogPrefs.taskLists.push(taskList);
        
        /* fill in the contents */
        cb.appendChild(checkbox);
        info.innerHTML = taskList.title;
        
        /* weave ... */
        row.appendChild(cb);
        row.appendChild(info);
        table.appendChild(row);
    }
    
    div.appendChild(table);
    return div;
}

/*
 * manage adding/removing tasklists as selected by the user
 */
function updatePrefsTaskLists(event) {
    var pdp = printDialogPrefs;
    var idx;
    var tl = event.target.taskList;
    
    idx = pdp.taskLists.findIndex(function(element) {
        return element.title == tl.title;
    })

    console.log("updatePrefsTaskLists(" +
        event.target.checked + ")[" + idx +"]");

    if (idx >= 0) {
        if (!event.target.checked) {
            console.log("Removing " + tl.title);
            pdp.taskLists.splice(idx,1);
        }
    }
    else {
        console.log("Appending " + tl.title);
        pdp.taskLists.push(tl);
    }
    
}

/*
 * Create a <div> which contains a heading an a table of tasks
 */
function taskListDiv(taskList) {
    var div = document.createElement('div');
    var tasksDisplay;
    div.float = 'left';
    //div.style.visibility = 'hidden';
    var heading = document.createElement("div");
    heading.innerHTML = taskList.title;
    heading.classList.add('gtd-list-title');
    div.appendChild(heading);

    /* local working copy array */
    var tasks = tData['tasks'][taskList.id];
    
    /* simple unordered list */
    //var tasksDisplay = tasksUL(taskList);
    var extraCol = false;
    if (extraCol && tasks.length > 25) {
        var n = Math.ceil(tasks.length/2);
        console.log("n = " + n);
        var tCols = [];
        for (var x=0; x < tasks.length; x += n) {
            var a = tasks.slice(x, n);
            tCols.push(a);
        }
        //var trows = tasks.splice(0, Math.ceil(tasks.length/2));
        console.log("tCols: " + tCols.length);

        /* make it tabular */
        for (var tri in tCols) {
            var tdiv = document.createElement('div');
            tdiv.float = 'left';
            tdiv.classList.add('gtd-list');
            tasksDisplay = tasksTable(tCols[tri]);
            tdiv.appendChild(tasksDisplay);

            /* bind it */
            div.appendChild(tdiv);
        }
    }
    else {
        div.classList.add('gtd-list');

        /* make it tabular */
        var tt = tasksTable(tasks);
        tasksDisplay = tt[0];
        var colSetCount = tt[1];
        
        div.clientWidth = 200 * colSetCount;
        
        /* bind it */
        div.appendChild(tasksDisplay);
    }
    
    /* done */
    return div;
}

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

function getBestTL(taskListDivs, size) {
    var i, bestIdx = -1, bestSize = 0;
    var n = 0;
    for (i in taskListDivs) {
        n = taskListDivs[i].clientHeight;
        console.log("[" + i +"] bIdx: " + bestIdx + " n:" + n + " bS:" + bestSize);
        if (n <= size && n > bestSize) {
            bestIdx = i;
            bestSize = n;
        }
    }
        
    /* nothing fits */
    if (bestIdx < 0)
        return null;
    
    /* remove 'best' from the list and return it */
    return taskListDivs.splice(bestIdx, 1)[0];
}

function fillDivColumn(taskLists, columnTaskLists) {
    if (!columnTaskLists)
        columnTaskLists = [];
    
    var used = 0;
    var tMax = window.innerHeight;
    var i;
    
    /* current count */
    for (i in columnTaskLists)
        used += columnTaskLists[i].clientHeight;
    
    while (used < tMax) {
        var tl = getBestTL(taskLists, tMax-used);
        if (!tl)
            break;  /* nothing fits */
        columnTaskLists.push(tl);
        used += tl.clientHeight;
        console.log("cd[" + columnTaskLists.length +"]  used:" + used);
    }
    
    console.log("FINAL: cd[" + columnTaskLists.length +"]  used:" + used);
    return columnTaskLists;
}



function renderTasks(prefs) {
    'use strict';
    var fit = 'linear';
    var ti, tl, nextTL=null, item, taskLists, divs = [], tls = [], nextTLDiv;
    console.log("do_it: begin");
    var printArea = document.getElementById('printArea');
    
    /* always have next-tasks first */
    taskLists = prefs.taskLists; //dupTasksList();

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

    /* setup the next task div */
    if (nextTL) {
        nextTLDiv = taskListDiv(nextTL);
        printArea.appendChild(nextTLDiv);
    }

    /* fill in the rest of the divs */
    for (ti in taskLists) {
        tl = taskLists[ti];
        item = taskListDiv(tl);
        printArea.appendChild(item);
    }
    
    //printArea.style.display = 'none';
    //printArea.style.display = 'block';
    //return;
    /*
     * Now that the divs are rendered, adjust positioning
     */
    console.log("best-fit algorithm");
    taskLists = [];
    var idx;

    console.log("pa-count: " + printArea.childElementCount);
    for (idx = 0; idx < printArea.childElementCount; idx++) {
        console.log("A[" + idx + "] ch="+printArea.childNodes[idx].clientHeight);
        taskLists.push(printArea.childNodes[idx]);
    }
    
    nextTL = taskLists.shift();

    for (idx in taskLists) {
        console.log("B[" + idx + "] ch="+taskLists[idx].clientHeight);
    }
    
    var divColumn, colDiv, x;
    var columnTaskLists = [nextTL];
    
    while (taskLists.length > 0) {
        columnTaskLists = fillDivColumn(taskLists, columnTaskLists);

        if (columnTaskLists.length == 0) {
            console.log("empty divcolumn")
            break;
        }
        console.log("ctl.length: " + columnTaskLists.length);
        colDiv = document.createElement('div');
        colDiv.classList.add('gtd-left');
        for (x in columnTaskLists) {
            colDiv.appendChild( columnTaskLists[x] );
        }
        printArea.appendChild(colDiv);
        columnTaskLists = [];
    }

    /* fill in the rest of the divs */
    for (ti = 0; ti < taskLists.length; ti++) {
        tl = taskLists[ti];
        printArea.appendChild(tl);
    }

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
