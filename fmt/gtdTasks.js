
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
    var found, sIdx, stl;

    /* clear out any previous list ... */
    while (pList.childElementCount > 0)
        pList.removeChild(pList.firstChild);
    
    /* fill in the list */
    for (tIdx in taskLists) {
        taskList = taskLists[tIdx];
        found = false;
        
        /* ignore cruft */
        if (!taskList.title || taskList.title == "")
            continue;
        
        /* check the existing prefs so the defaults match */
        if (gtdTaskPreferences.taskLists != null) {
            for (sIdx in gtdTaskPreferences.taskLists) {
                stl = gtdTaskPreferences.taskLists[sIdx];
                if (stl.id == taskList.id) {
                    found = true;
                    break;
                }
            }
        }

        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = taskList.id;
        checkbox.classList.add('gtd-checkbox');
        checkbox.checked = found;

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

function uiNewTaskListOk() {
    var name = $('#gtdNewTaskListName').val();
    
    console.log("uiNewTaskListOk() " + name);
}

function uiDeleteTaskList(e) {
    var panel = $(this).closest('.panel');
    var taskList = taskListByID(panel.attr('id'));

    console.log("deleteTaskList(" + taskList.id + ")");
}

function createPanel(title, footer, id) {
    var panel = document.createElement('div');
    var panelHeading = document.createElement('div');
    var phData = document.createElement('div');
 
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
    pList.classList.add('list-group');
    if (title != "Next-Tasks") {
        pList.classList.add('drag-list-group');
        $(pList).sortable({
            handle: ".fa-reorder",
            update: uiTaskDrag,
            connectWith: [ '.drag-list-group' ]
        });
    }
    pBody.appendChild(pList);

    pFoot = document.createElement('div');
    pFoot.classList.add('panel-footer');

    var newTaskButton = document.createElement('i');
    newTaskButton.classList.add('fa', 'fa-fw', 'fa-plus', 'gtd-add-task-button', 'pull-left');
    newTaskButton.onclick = uiTaskAdd;
    pFoot.appendChild(newTaskButton);

    var inputSpan = document.createElement('span');
    inputSpan.style.display = 'block';
    inputSpan.style.overflow = 'hidden';
    var newTask = document.createElement('input');
    newTask.type = 'text';
    newTask.classList.add('gtd-add-task');
    newTask.onkeyup = uiTaskAdd;
    inputSpan.appendChild(newTask);
    pFoot.appendChild(inputSpan);
    panel.appendChild(pFoot);

    return { panel: panel, body: pBody, list: pList, footer: pFoot };
}

function uiTaskAdd(e) {
    
    /* accept mouse clicks (keycode==undefined) and 'enter' */
    if (e.keyCode && e.keyCode != 13)
        return;
    
    var panel = $(this).closest('.panel');
    var taskList = taskListByID(panel.attr('id'));
    var input = panel.find('.gtd-add-task');
    var pList = panel.find('ul');

    //console.log("uiTaskAdd("+taskList.id+"): " + input.val());
    
    /* TO-DO: add the task to the google infra */
    var task = { 
        id: "this-is-a-bogus-id",
        title: input.val(),
        completed: false
    };
    
    var pItem = document.createElement('li');
    pItem.classList.add('list-group-item');
    pItem.id = task.id;

    /* create the display entry for this task */
    divTaskEntry(pItem, task, {});

    /* weave it into the list */
    pList.append(pItem);
    
    /* cleanup */
    input.val("");
}

/*
 * Convert a timestamp from a Task into DD/MM/YYYY and hh:mm:ss
 */
function taskTime_to_datetime(tt) {
    /* should probably adjust from GMT to locale */
    return [ tt.slice(0,10), tt.slice(11,19) ];
}

function dateTime_to_taskTime(dt, tt) {
    var gTime = dt + "T";
    if (tt && tt != "")
        gTime += tt;
    else
        gTime += "00:00:00"
    
    /* should probably adjust from GMT to locale */

    return gTime + ".000Z";
}

function uiTaskEditModal() {
    var listItem = $(this).closest('li');
    var task = taskByID(listItem.attr('id'));

    console.log("edit task: " + task.id + "  " + task.title);
    var modal = $("#gtdTaskEditModal");
    
    var title = $("#gtdEditModalTitle");
    title.html("Edit Task - " + task.title);
    
    var taskID = $("#gtdEditModalTaskID");
    taskID.val(task.id);
    
    if (task.hasOwnProperty('due')) {
        var dt = taskTime_to_datetime(task.due);
        console.log("Due: " + dt[0] + " Time: " + dt[1]);
        var dueDate = $("#gtdEditModalDate");
        dueDate.val(dt[0]);
        var dueTime = $("#gtdEditModalTime");
        dueTime.val(dt[1]);
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
    var listInfo = $('#'+task.id).find('.gtd-task-label');

    var notes = $("#gtdEditModalNotes").val();
    if (notes && notes != "") {
        task.notes = notes;
        listInfo.find('.gtd-item-notes').html(notes);
    }

    var dueDate = $("#gtdEditModalDate").val();
    var dueTime = $("#gtdEditModalTime").val();
    if (dueDate && dueDate != "") {
        console.log("Due Date: " + dueDate);
        console.log("Due Time: " + dueTime);
        
        task.due = dateTime_to_taskTime(dueDate, dueTime);
        
        var dueBlock = listInfo.find('.gtd-task-due-date');
        var dueDate = dueBlock.find('.gtd-item-date');
        dueDate.html(displayDateTime(task.due));
        dueBlock.show();
    }
    
    /* clean up */
    gtdEditModalHide();
    
    /* eventually write back to google */
}

function uiTaskDrag(event, ui) {
    var dragItem = ui.item;
    var dragTask = taskByID(dragItem.attr('id'));
    var startPanel = $(this).closest('.panel');
    var startTaskList = taskListByID(startPanel.attr('id'));
    
    var targetPanel = dragItem.closest('.panel');
    var targetTaskList = taskListByID(targetPanel.attr('id'));

    console.log("uiTaskDrag(" + dragTask.title + ") " + startTaskList.title+ " -> " + targetTaskList.title);
    
    /* TO-DO: update task entry to reflect the change */
    
    console.log("ui.item.index(" + dragItem.index() + ")");
    
    /* pop task from originate list */
    console.log("HOOK UP task relocation!!");
    /* insert into new list */
    
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

function divTaskEntry(pItem, task) {
        
    var checkbox, label;
    var pd = 0;
    var cur = task;

    /* get parent depth */
    while (cur.hasOwnProperty('parent')) {
        cur = taskByID(cur.parent);
        pd++;
    }
    //console.log("Task: " + task.title + " parentage: " + pd);

    /* setup icons */
    var drag = document.createElement('i');
    drag.classList.add('fa', 'fa-fw', 'fa-reorder', 'pull-left');
    
    var next = document.createElement('i');
    next.classList.add('fa', 'fa-fw', 'fa-star-o', 'pull-left');
    next.onclick = uiTaskNext;

    var done = document.createElement('i');
    done.classList.add('fa', 'fa-fw', 'fa-square-o', 'pull-left', 'gtd-task-indent-'+pd);
    done.onclick = uiTaskCompleted;

    var edit = document.createElement('i');
    edit.classList.add('fa', 'fa-fw', 'fa-edit', 'pull-right');
    edit.onclick = uiTaskEditModal;
    
    var info = document.createElement('div');
    info.classList.add('gtd-task-label', 'gtd-task-label-'+pd);
    var hInfo = document.createElement('span');
    hInfo.classList.add('gtd-task-title');
    hInfo.innerHTML = task.title;
    info.appendChild(hInfo);
    
    /* create the div for notes regardless */
    var notes = document.createElement('div');
    notes.classList.add('gtd-item-notes');
    info.appendChild(notes);
    if (task.notes)
        notes.innerHTML = task.notes;

    var due = document.createElement('div');
    due.classList.add('gtd-task-due-date');
    due.style.display = 'none';
    info.appendChild(due);
    var l = document.createElement('span');
    l.innerHTML = "Due: ";
    l.classList.add('gtd-item-due');
    var d = document.createElement('span');
    d.classList.add('gtd-item-date');
    d.innerHTML = "";
    due.appendChild(l);
    due.appendChild(d);
    if (task.due) {
        d.innerHTML = displayDateTime(task.due);
        due.style.display = 'block';
    }

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

function displayDateTime(gt) {
    var info = taskTime_to_datetime(gt);
    return info[0] + " at " + info[1];
}

/*
 * Create a BS-panel for each tasklist and its tasks
 */
function taskListPanel(taskList) {
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
        if (task.completed && !gtdTaskPreferences.includeCompleted)
            continue;

        /* make a new list item */
        pItem = document.createElement('li');
        pItem.classList.add('list-group-item');
        pItem.id = task.id;

        /* create the display entry for this task */
        divTaskEntry(pItem, task);
        
        /* weave it into the list */
        pComp.list.appendChild(pItem);

    }
    
    /* should render in background (hidden) to get size estimates.*/
    var sb = document.getElementById('tasksArea');
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

function renderTasks() {
    'use strict';
    var fit = 'linear';
    var ti, tl, nextTL=null, item, taskLists, divs = [], tls = [], nextTLDiv;
    var tasksArea = document.getElementById('tasksArea');
    
    /* always have next-tasks first */
    taskLists = gtdTaskPreferences.taskLists;

    for (ti in taskLists){
        console.log("got: " + taskLists[ti].title);
    }

    ti = taskLists.findIndex(function(element) {
        return element.title == 'Next-Tasks';
    })
    console.log("  next-tasks idx = " + ti);
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
    while (tasksArea.childElementCount > 0)
        tasksArea.removeChild(tasksArea.firstChild);

    var panelInfo = [];
    
    /* setup the next task div */
    if (nextTL) {
        console.log("cooking up nextTL panel");
        item = taskListPanel(nextTL);
        panelInfo.push(item);
    }

    /* fill in the rest of the divs */
    for (ti in taskLists) {
        tl = taskLists[ti];
        item = taskListPanel(tl);
        panelInfo.push(item);
    }
    
    /* lay them out so the screen can identify their true size */
    standardLayout(tasksArea, panelInfo);
    console.log("After Layout");
    checkSizes();
    
    /* re-arrange the panels to be best fit */
    optimizeLayout(tasksArea, panelInfo);
}

function standardLayout(area, panelInfo) {
    var row, col, pi;
    
    for (pi in panelInfo) {
        if (pi % 3 == 0) {
            row = document.createElement('div');
            row.classList.add('row');
            tasksArea.appendChild(row);
        }
    
        col = document.createElement('div');
        col.classList.add('col-xs-4');
        col.appendChild(panelInfo[pi].panel);
        row.appendChild(col);
    }
    
    return;
}

function optimizeLayout(tasksArea, panelInfo) {
    var idx, tl, panel;
    var nextPanel = null;
    var row, col, cols = [];
    
    /* scrub it */
    while (tasksArea.childElementCount > 0)
        tasksArea.removeChild(tasksArea.firstChild);
    
    /* should be grabbing the Next-Tasks */
    for (idx in panelInfo) {
        if (panelInfo[idx].taskList.title == 'Next-Tasks') {
            nextPanel = panelInfo.splice(idx, 1)[0];
            break;
        }
    }

    while (panelInfo.length > 0) {

        /* concern only with height */
        row = document.createElement('div');
        row.classList.add('row');
        row.classList.add('gtd-page');
        tasksArea.appendChild(row);

        /* add up to the max number of columns */
        for (idx=0; idx < 3; idx++) {
            colPx = window.innerHeight;
            col = document.createElement('div');
            col.classList.add('col-xs-4');
            row.appendChild(col);
            cols.push(col);

            /* fill it up */
            while (panelInfo.length > 0) {
                if (!nextPanel)
                    nextPanel = getBestTL(colPx, panelInfo);

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
    
    for (idx in panelInfo) {
        panel = panelInfo[idx];
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
    var tasksArea = document.getElementById('tasksArea');
    console.log("tasksArea.client: %sx%s", 
                tasksArea.clientWidth, tasksArea.clientHeight);
    console.log("tasksArea:        %sx%s",
                tasksArea.width, tasksArea.height);
    
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
    renderTasks();
}


/****************************************************************************************
 *
 *             Google API Setup
 *
 ***************************************************************************************/

//var google = require('googleapis');
//var googleAuth = require('google-auth-library');

//var OAuth2 = google.auth.OAuth2;
//var oauth2Client = new OAuth2(
//    "1068589952324-nikjd3ars2pghcbim00gsefn9r9inkso.apps.googleusercontent.com",
//    "SreSsnWOMEB2QjjI9Ap366M-",
//    "http://localhost"
//);

// set auth as a global default
//google.options({
//  auth: oauth2Client
//});

//var googleTasks = google.tasks({
//    version: 'v2',
//    auth: oauth2Client
//});

