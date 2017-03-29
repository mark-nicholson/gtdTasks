
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

function taskByID(id) {
    var idx, tlTasks, key, task;
    for (key in tData['tasks']) {
        tlTasks = tData['tasks'][key];
        
        for (idx in tlTasks) {
            task = tlTasks[idx];
            if (task.id == id)
                return task;
        }
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

function uiDeleteTaskList(e) {
    var panel = $(this).closest('.panel');
    var taskList = taskListByID(panel.attr('id'));

    console.log("deleteTaskList(" + taskList.id + ")");
}

function createPanel(title, footer, id) {
    var panel = document.createElement('div');
    var panelHeading = document.createElement('div');
    var phData = document.createElement('h3');
 
    panel.classList.add('panel', 'panel-primary', 'panel-gtd');
    panel.id = id;
    
    panelHeading.classList.add('panel-heading');

    phData.classList.add('panel-title');
    phData.innerHTML = title;
    
    var phButton = document.createElement('button');
    phButton.type = "button";
    phButton.classList.add("close");
    phButton.onclick = uiDeleteTaskList;
    phButton.innerHTML = "&times;";

    panelHeading.appendChild(phData);
    panelHeading.appendChild(phButton);
    panel.appendChild(panelHeading);
    
    pBody = document.createElement('div');
    pBody.classList.add('panel-body');
    panel.appendChild(pBody);
    
    pList = document.createElement('ul');
    pList.classList.add('list-group')
    pBody.appendChild(pList);

    pFoot = document.createElement('div');
    pFoot.classList.add('panel-footer');
    pFoot.innerHTML = "Footer Text";
    panel.appendChild(pFoot);

    return { panel: panel, body: pBody, list: pList, footer: pFoot };
}

function uiTaskEditModal() {
    var listItem = $(this).closest('li');
    var task = taskByID(listItem.attr('id'));

    console.log("edit task: " + this.id + "  " + task.title);
    var modal = $("#gtdTaskEditModal");
    
    var title = $("#gtdEditModalTitle");
    title.html("Edit Task - " + task.title);
    
    var taskID = $("#gtdEditModalTaskID");
    taskID.val(this.id);
    
    if (task.hasOwnProperty('due')) {
        console.log("Due: " + task.due);
        var dueDate = $("#gtdEditModalDate");
        dueDate.val(task.due);
    }
    
    if (task.hasOwnProperty('notes')) {
        console.log("Notes: " + task.notes);
        var notes = $("#gtdEditModalNotes");
        notes.val(task.notes);
    }
    
    modal.modal('show');
}

function gtdEditModalOk() {
    console.log("ID: " + $("#gtdEditModalTaskID").val());
    var task = taskByID($("#gtdEditModalTaskID").val());

    var notes = $("#gtdEditModalNotes").val();
    if (notes && notes != "") {
        console.log("Notes: " + notes);
        task.notes = notes;
    }

    var dueDate = $("#gtdEditModalDate").val();
    if (dueDate && dueDate != "") {
        console.log("Due Date: " + dueDate);
        task.due = dueDate;
    }
    
    /* clean up */
    gtdEditModalHide();
    
    /* eventually write back to google */
}

function uiTaskDrag(e) {
    var listItem = $(this).closest('li');
    var task = taskByID(listItem.attr('id'));

    console.log("uiTaskDrag()");
    
    /* TO-DO: update task entry to reflect the change */
    
    /* tweak the UI */
}

function uiTaskNext(e) {
    var listItem = $(this).closest('li');
    var task = taskByID(listItem.attr('id'));

    /* TO-DO: update data to reflect that this is a 'next-task' */
    
    /* make the user happy */
    this.classList.toggle('fa-star-o');
    this.classList.toggle('fa-star');
}

function uiTaskCompleted(e) {
    var listItem = $(this).closest('li');
    var task = taskByID(listItem.attr('id'));
    
    /* tag the task as complete */
    task.completed = !task.completed;

    /* switch out the icon */
    //this.classList.toggle('fa-square-o');
    //this.classList.toggle('fa-check');
    $(this).toggleClass('fa-square-o');
    $(this).toggleClass('fa-check');
    
    /* track the text and rub it out */
    listItem.find('.gtd-task-label').toggleClass('gtd-completed');
}

function divTaskEntry(pItem, task, prefs) {
        
    var checkbox, label;
    var pd = 0;
    var cur = task;

    /* get parent depth */
    while (cur.hasOwnProperty('parent')) {
        cur = taskByID(cur.parent);
        pd++;
    }
    console.log("Task: " + task.title + " parentage: " + pd);

    /* setup icons */
    var drag = document.createElement('i');
    drag.classList.add('fa', 'fa-fw', 'fa-reorder', 'pull-left');
    drag.ondrag = uiTaskDrag;
    
    var next = document.createElement('i');
    next.classList.add('fa', 'fa-fw', 'fa-star-o', 'pull-left');
    next.onclick = uiTaskNext;

    var done = document.createElement('i');
    done.classList.add('fa', 'fa-fw', 'fa-square-o', 'pull-left');
    done.onclick = uiTaskCompleted;

    var edit = document.createElement('i');
    edit.classList.add('fa', 'fa-fw', 'fa-edit', 'pull-right');
    edit.onclick = uiTaskEditModal;
    
    var info = document.createElement('div');
    info.classList.add('gtd-task-label');
    info.innerHTML = task.title;

    /* formatting */
    if (task.completed) {
        done.classList.remove('fa-square-o');
        done.classList.add('fa-check');
        info.classList.add('gtd-completed');
    }

    /* attach them in the expected order */
    pItem.appendChild(drag);
    pItem.appendChild(next);
    pItem.appendChild(done);
    pItem.appendChild(info);
    pItem.appendChild(edit);

    /* return the completed item */
    return pItem;
}

/*
 * Create a BS-panel for each tasklist and its tasks
 */
function taskListPanel(taskList, prefs) {
    var pItem, task, tIdx, tasks;
    var panelInfo = {
        panel: null,
        width: -1,
        height: -1,
        taskList: taskList,
        next: null
    };
    var pComp = createPanel(taskList.title, "Footer Text", taskList.id);
    panelInfo.panel = pComp.panel;
    
    tasks = tData['tasks'][taskList.id];
    
    for (tIdx in tasks) {
        task = tasks[tIdx];
        
        /* ignore cruft */
        if (!task.title || task.title == "" || task.hidden)
            continue;
        
        /* manage user display */
        if (task.completed && !prefs.includeCompleted)
            continue;

        /* make a new list item */
        pItem = document.createElement('li');
        pItem.classList.add('list-group-item');
        pItem.id = task.id;

        /* create the display entry for this task */
        divTaskEntry(pItem, task, prefs);
        
        /* weave it into the list */
        pComp.list.appendChild(pItem);

    }
    
    /* should render in background (hidden) to get size estimates.*/
    var sb = document.getElementById('printArea');
    sb.appendChild(pComp.panel);
    panelInfo.height = pComp.panel.clientHeight;
    panelInfo.width = pComp.panel.clientWidth;
    console.log(taskList.title + ": sandbox: " + pComp.panel.clientWidth + " x " + pComp.panel.clientHeight);
    sb.removeChild(pComp.panel);

    if (panelInfo.height <= window.innerHeight)
        return panelInfo;
    
    /* split it up */
    panelInfo.next = createPanel(taskList.title + " cont'd", "Footer Text", taskList.id+'-1')
    return panelInfo;
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
    
    /* lay them out so the screen can identify their true size */
    standardLayout(printArea, panels);
    console.log("After Layout");
    checkSizes();
    
    /* re-arrange the panels to be best fit */
    optimizeLayout(printArea, panels);
}

function standardLayout(area, panels) {
    var row, col, pi;
    
    for (pi in panels) {
        if (pi % 3 == 0) {
            row = document.createElement('div');
            row.classList.add('row');
            printArea.appendChild(row);
        }
    
        col = document.createElement('div');
        col.classList.add('col-xs-4');
        col.appendChild(panels[pi].panel);
        row.appendChild(col);
    }
    
    return;
}

function optimizeLayout(printArea, panels) {
    var idx, tl, panel;
    var taskLists = dupTasksList();
    var panels = [], nextPanel;
    var row, col, cols = [];
    
    for (idx in taskLists) {
        tl = taskLists[idx];
        panel = document.getElementById(tl.id);
        if (!panel)
            continue;
        
        /* check for panel taller than the screen... */
        if (panel.clientHeight >= window.innerHeight) {
            console.log(tl.title + ": " + panel.clientWidth + " x " + panel.clientHeight);
            console.log("----- need to split into more panels")
        }
        else {
            panels.push( { 
                panel: panel,
                taskList: tl,
                width: panel.clientWidth,
                height: panel.clientHeight,
                next: null
            });
            console.log(tl.title + ": " + panel.clientWidth + " x " + panel.clientHeight);
        }
        
        /* disconnect the panel */
        panel.parentElement.removeChild(panel);
    }

    /* scrub it */
    while (printArea.childElementCount > 0)
        printArea.removeChild(printArea.firstChild);
    
    /* should be grabbing the Next-Tasks */
    nextPanel = panels.shift();

    while (panels.length > 0) {

        /* concern only with height */
        row = document.createElement('div');
        row.classList.add('row');
        row.classList.add('gtd-page');
        printArea.appendChild(row);

        /* add up to the max number of columns */
        for (idx=0; idx < 3; idx++) {
            colPx = window.innerHeight;
            col = document.createElement('div');
            col.classList.add('col-xs-4');
            row.appendChild(col);
            cols.push(col);

            /* fill it up */
            while (panels.length > 0) {
                if (!nextPanel)
                    nextPanel = getBestTL(colPx, panels);

                if (!nextPanel) {
                    console.log("filled this column")
                    break;
                }

                col.appendChild(nextPanel.panel);
                colPx -= nextPanel.height;
                nextPanel = null;
            }
        }
        
        /* all done or nothing fits... */
        if (colPx == window.innerHeight && nextPanel == null)
            break;
    }
    
    for (idx in panels) {
        panel = panels[idx];
        console.log("Cannot fit panel: "+panel.height);
    }
}

function getBestTL(colPx, panels) {
    var i, bestIdx = -1, bestSize = 0;
    var n = 0;
    for (i in panels) {
        n = panels[i].height;
        //console.log("[" + i +"] bIdx: " + bestIdx + " n:" + n + " bS:" + bestSize);
        if (n <= colPx && n > bestSize) {
            bestIdx = i;
            bestSize = n;
        }
    }
        
    /* nothing fits */
    if (bestIdx < 0)
        return null;
    
    /* remove 'best' from the list and return it */
    return panels.splice(bestIdx, 1)[0];
}

function checkSizes() {
    var printArea = document.getElementById('printArea');
    console.log("printArea.client: %sx%s", 
                printArea.clientWidth, printArea.clientHeight);
    console.log("printArea:        %sx%s",
                printArea.width, printArea.height);
    
    console.log("window.inner:     %sx%s",
                window.innerWidth, window.innerHeight);
    console.log("$(window):        %sx%s",
                $(window).width(), $(window).height());
    
    var idx, tl, panel;
    var taskLists = dupTasksList();
    
    for (idx in taskLists) {
        tl = taskLists[idx];
        panel = document.getElementById("panel-"+tl.id);
        if (!panel)
            continue;
        console.log(tl.title + ": " + panel.clientWidth + " x " + panel.clientHeight);
    }
}

/*
 * Try adding resizing
 */
var addEvent = function(object, type, callback) {
    if (object == null || typeof(object) == 'undefined') return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
};
//addEvent(window, "resize", resizePage);

function resizePage() {
    renderTasks(prefs);
}