
/*
 * Data Management Structure
 */
class TaskData {
    
    constructor() {
        this._taskLists = {};             // all taskslists by id
        this._tasks = {};                 // all tasks by id
        this._tasks_by_tasklist = {};     // all tasks per task list
        this._lists_loaded = 0;
        
        /* preferences */
        this._pref_taskLists = [];
        this._pref_includeCompleted = false;
        this._pref_refresh_interval = 0;  // minutes
        
        this._updateTimer = null;
    }

    /*
     * Add update timer for a forced update every 10 minutes
     */
    updateRefresh(newRefresh) {
        
        /* nothing to do? bail... */
        if (newRefresh == taskData._pref_refresh_interval)
            return;

        /* shut down any previous timer */
        if (this._updateTimer) {
            window.clearInterval(this._updateTimer);
            this._updateTimer = null;
        }
        
        /* remember the value */
        this._pref_refresh_interval = newRefresh;
        
        if (this._pref_refresh_interval > 0)
            this._updateTimer = setInterval(loadData, this._pref_refresh_interval * 60 * 1000);
    }
    
    clearTasksCache() {
        this._taskLists = {};             // all taskslists by id
        this._tasks = {};                 // all tasks by id
        this._tasks_by_tasklist = {};     // all tasks per task list
        this._lists_loaded = 0;        
        this._pref_taskLists = [];
    }

    loaded() {
        console.log("loaded() " + Object.keys(this._taskLists).length + " : " + this._lists_loaded);
        return Object.keys(this._taskLists).length == this._lists_loaded;
    }
    
    addTaskList(newTL) {
        /* check for previous entry */
        var oldTL = this.taskListByID(newTL.id);
        
        if (oldTL != null) {
            if (oldTL.updated == newTL.updated)
                return;  /* same old data */
            else {
                this.removeTaskList(oldTL);
            }
        }
        
        this._taskLists[newTL.id] = newTL;
        this._tasks_by_tasklist[newTL.id] = [];
        this._pref_taskLists.push(newTL);
    }
    
    removeTaskList(tl) {
        /* blow away all of the tasks associated with this tasklist */
        var localTL = this._tasks_by_tasklist[tl.id].slice();
        for (var idx in localTL)
            this.removeTask(localTL[idx]);

        /* remove the tasklist from the cache buckets */
        delete this._taskLists[tl.id];
        delete this._tasks_by_tasklist[tl.id]
        
        /* remove it from the prefs -- may not be in it */
        var idx = this._pref_taskLists.findIndex( function(item) {
            return item.id == tl.id;
        });
        if (idx >= 0) {
            this._pref_taskLists.splice(idx,1);
        }
    }
    
    addTasks(newTasks, taskList) {
        for (var task in newTasks)
            this.addTask(task, taskList);
    }
    
    addTask(newTask, taskList) {
        var oldTask = this.taskByID(newTask.id);
        
        if (oldTask != null) {
            if (oldTask.updated == newTask.updated)
                return;  /* same old data */
	    else
		this.removeTask(oldTask);
        }
        
        this._tasks[newTask.id] = newTask;
        this._tasks_by_tasklist[taskList.id].push(newTask);
    }
    
    removeTask(task) {
        var tl = this.taskListFromTaskID(task.id);

        var idx = this._tasks_by_tasklist[tl.id].findIndex(function (item) {
            return item.id == task.id;
        });

        /* remove it from the tasklist */
        var rv = this._tasks_by_tasklist[tl.id].splice(idx,1);

        /* do this last */
        delete this._tasks[task.id];
    }

    updateTask(task) {
	var taskList = taskData.taskListFromTaskID(task.id);
	this.removeTask(task);
	this.addTask(task, taskList);
    }

    _removeTaskFromTaskList(task, taskList) {
        var idx = this._tasks_by_tasklist[taskList.id].findIndex(function (item) {
            return item.id == task.id;
        });

        /* remove it from the tasklist */
        this._tasks_by_tasklist[taskList.id].splice(idx,1);
    }
    
    moveTask(task, targetTaskList, idx) {
        
        /* remove task from current tasklist */
        var curTL = this.taskListFromTaskID(task.id);
        this._removeTaskFromTaskList(task, curTL);
        
        /* insert it into new task list at given position */
        this._tasks_by_tasklist[targetTaskList.id].splice(idx, 0, task);
    }
    
    getTaskLists() {
    	var dupeTLs = [];
        for (var key in this._taskLists) {
            if (! this._taskLists.hasOwnProperty(key))
                continue;
            var tl = this._taskLists[key];
            if (tl.title == 'Next-Tasks')
                dupeTLs.unshift(tl);
            else
                dupeTLs.push(tl);
        }
        return dupeTLs;
    }
    
    taskListByID(id) {
    	if (! id in this._taskLists)
            return null;
        return this._taskLists[id];
    }
    
    taskByID(id) {
    	if (! id in this._tasks)
            return null;
        return this._tasks[id];
    }
    
    taskListFromTaskID(id) {
    	var task = this.taskByID(id);
    	return this.taskListByID( task.selfLink.split('/')[6]);
    }

    tasksByTaskListID(id) {
        return this._tasks_by_tasklist[id];
    }
}

/* global data management */
var taskData = new TaskData();

/* classes used for indentation */
var indentClasstagList = [
    'gtd-task-indent-0',
    'gtd-task-indent-1',
    'gtd-task-indent-2',
    'gtd-task-indent-3',
    'gtd-task-indent-4'
];
var labelClasstagList = [
    'gtd-task-label-0',
    'gtd-task-label-1',
    'gtd-task-label-2',
    'gtd-task-label-3',
    'gtd-task-label-4'
];

/*******************************************************************************
 *
 *          GAPI Common Routines
 *
 ******************************************************************************/

function gapi_console_logger(response) {
    console.log(JSON.stringify(response, undefined, 2));
}

function gapi_task_response_error(response) {
    console.log("GAPI Error:");
    gapi_console_logger(response);
}

function gapi_task_response_ok(response) {
    var task = response.result;
    
    /* log the return data */
    console.log(JSON.stringify(response, undefined, 2));

    /* update the cache with the latest version of this task */
    taskData.updateTask(task);

    /* located the UI list-item block associated with this task's id */
    //var item = document.getElementById(task.id);
    var item = $('#'+task.id);
    console.log("ITEM:");
    console.log($(item));

    updateTaskItemUI(item, task);
}

function updateTaskItemUI(taskItem, task) {
    
    /* update the entry to reflect the indentation, etc */

    var cur = task;
    var pd = 0;

    /* get parent depth */
    while (cur && cur.hasOwnProperty('parent')) {
        cur = taskData.taskByID(cur.parent);
        pd++;
    }
    console.log("Task: " + task.title + " parentage: " + pd);

    var spacer = $(taskItem).find('.fa-square-o');
    var label = $(taskItem).find('.gtd-task-label');

    /* strip out any pre-existing indentation stuff */
    spacer.removeClass(indentClasstagList.join(' '));
    label.removeClass(labelClasstagList.join(' '));

    /* add in the indentation which SHOULD be there */
    spacer.addClass(indentClasstagList[pd]);
    label.addClass(labelClasstagList[pd]);
}



/*
 * Populate <div> with a checkbox list of tasklists
 */
function taskListsSelectionList(divID) {
    var taskList, tIdx, checkbox, label, pItem;
    var pList = document.getElementById(divID);
    var taskLists = taskData.getTaskLists();
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
        if (taskData._pref_taskLists != null) {
            for (sIdx in taskData._pref_taskLists) {
                stl = taskData._pref_taskLists[sIdx];
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

function uiSetAlert(htmlMsg, level) {
    var alertArea = document.getElementById('alertArea');
    var alertDiv = document.createElement('div');
    var closer = document.createElement('A');
    var message = document.createElement('P');

    message.innerHTML = htmlMsg;
    message.style.textAlign = "center";

    closer.href = '#';
    closer.innerHTML = "&times;";
    closer.classList.add('close');
    closer.setAttribute('data-dismiss', 'alert');
    closer.setAttribute('aria-label', 'close');

    alertDiv.appendChild(closer);
    alertDiv.appendChild(message);
    alertDiv.classList.add('alert', level, 'alert-dismissable');
}

function uiNewTaskListOk() {
    var name = $('#gtdNewTaskListName').val();    
    var params = {
	'resource': {
            'title': name
	}
    }
 
    /* function callback is inline to access local function namespace */
    gapi.client.tasks.tasklists.insert( params ).then(
	function(response) {
            var newTL = response.result;

            /* add to the local cache... */
            taskData.addTaskList(newTL);
	    
            /* re-render the page -- should create the new panel */
            renderTasks();
	},
	function(response) {
	    uiSetAlert(
		"<strong>Error</strong> - Failed to create new task-list",
		'alert-danger'
	    );
	}
    );
}

function uiDeleteTaskList(e) {
    var card = $(this).closest('.card');
    var taskList = taskData.taskListByID(card.attr('id'));

    /* add ARE YOU SURE modal... 
     *  Should have 'x' open modal with yes/no, yes -> this routine, no just closes
     */

    /* update google and the local cache */
    gapi.client.tasks.tasklists.delete( {'tasklist': taskList.id} ).then(
	function(response) {
	    /* tidy up the cache */
            taskData.removeTaskList(taskList);
    
	    /* remove the card itself */
	    card.remove();
	},
	function(response) {
	    uiSetAlert(
		"<strong>Error!</strong> - Failed to delete task-list",
		'alert-danger'
	    );
	}
    );
}

function createCard(title, footer, id) {
    var card = document.createElement('div');
    var cardHeading = document.createElement('div');
    var phData = document.createElement('div');
 
    card.classList.add('card', 'card-gtd', 'border-primary', 'mb-3');
    card.id = id;
    
    cardHeading.classList.add('card-header', 'text-center', 'h5', 'bg-primary', 'border-primary', 'mb-3', 'text-white');
    cardHeading.innerHTML = title
    
    var phCloser = document.createElement('div');
    phCloser.classList.add("close", 'd-print-none');
    phCloser.onclick = uiDeleteTaskList;
    phCloser.innerHTML = "&times;";

    cardHeading.appendChild(phCloser);
    card.appendChild(cardHeading);
    
    pBody = document.createElement('div');
    pBody.classList.add('card-body', 'border-primary', 'mb-3');
    card.appendChild(pBody);
    
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
    pFoot.classList.add('card-footer', 'd-print-none', 'bg-primary', 'text-white');

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
    card.appendChild(pFoot);

    return { card: card, body: pBody, list: pList, footer: pFoot };
}

function calcIndentLevel(task) {
    var indentLevel = 0;
    while (task && task.hasOwnProperty('parent')) {
        task = taskData.taskByID(task.parent);
        indentLevel++;
    }
    return indentLevel;
}

/*
 * Locate 'active' list items and indent or outdent them as needed
 */
function indentActiveItems(do_indent) {
    var area = document.getElementById('tasksArea');
    var items = $(area).find('li.active');
    //var items = document.getElementsByClassName('li.active');
    
    console.log("got: " + do_indent);
    
    /* skip errant calls */
    if (items.length == 0) {
        console.log("No items selected for indent.")
        return;
    }

    /* grab the previous entry -- something must exist to be a parent */
    var previousItem = items[0].previousSibling;
    if (! previousItem) {
	uiSetAlert(
	    "<strong>Notice</strong> - Task has no preceding entry to make a parent.",
	    'alert-info'
	);
        return;
    }

    var taskItem = items[0];
    var task = taskData.taskByID(taskItem.id);
    var taskList = taskData.taskListFromTaskID(task.id);
    var previousTask = taskData.taskByID(previousItem.id);
	
    /* gapi update info */
    params = {
	'tasklist': taskList.id,
	'task': task.id,
	'parent': null,          /* default: no parent (at top level) */
	'previous': null         /* default: top of list */
    };


    if (!do_indent) {

	/* OUTDENT */

	if (!task.hasOwnProperty('parent')) {
	    /* top-level item... can't outdent */
	    uiSetAlert(
		"<strong>Notice</strong> - Task already at top-level.",
		'alert-info'
	    );
	    return;
	}

	var parentTask = taskData.taskByID(task.parent);

	/* parent must be this */
	if (parentTask.hasOwnProperty('parent')) {
	    params['parent'] = parentTask.parent;

	    /* the previous entry should be the higest index, 
	       below item's whose parent is parentTask */
	    var tasks = taskData.tasksByTaskListID(taskList.id);
	    for (var idx = tasks.indexOf(task) - 1; idx >= 0; idx--) {
		if (tasks[idx].parent == parentTask.parent) {
		    params['previous'] = tasks[idx].id;
		    break;
		}
	    }
	}
	else {
	    /* no grand parent -- make the previous task still previous */
	    params['previous'] = parentTask.id;
	    console.log("parentTask set to previous");

	    /* find task which is has no indent */
	}
    }
    else {

	/* INDENT */

	var cur = task;
	var indentLevel = calcIndentLevel(task);
	var newIndentLevel = indentLevel + 1;
	console.log("IndentLevel: " + indentLevel);

	/* need to cap it */
	if (newIndentLevel > 4) {
	    uiSetAlert(
		"<strong>Warning!</strong> - Cannot outdent any further.",
		'alert-warning'
	    );
	    return;
	}

	/* previoustask is at the same level as the indenting one -- make it parent */
	if (calcIndentLevel(previousTask) == indentLevel)
	    params['parent'] = previousTask.id;
	else {
	    /* walk backwards to find the parent */
	    params['previous'] = previousTask.id;

	    var pi = previousItem;
	    while (pi) {
		var pit = taskData.taskByID(pi.id);

		if (calcIndentLevel(pit) == indentLevel) {
		    params['parent'] = pi.id;
		    break;
		}
		
		pi = pi.previousSibling;
	    }
	}
	    
    }

    /* run the update */
    gapi.client.tasks.tasks.move(params).then(
	function(response) {
	    var respTask = response.result;

	    console.log(JSON.stringify(response, undefined, 2));

	    /* update the cache */
	    taskData.removeTask(respTask);
	    taskData.addTask(respTask, taskList);

	    /* update the task's UI indentation */
	    updateTaskItemUI(taskItem, respTask);
	},
	function(response) {
	    gapi_task_response_error(response);
	    uiSetAlert(
		"<strong>Error</strong> - Failed to create new task-list",
		'alert-danger'
	    );
	}
    );

    return;
}


function uiTaskAdd(e) {
    
    /* ignore mouse clicks */
    if (! e.keyCode)
        return;
                
    if (e.keyCode != 13)
        return;
    
    /* do this on ENTER */
    var card = $(this).closest('.card');
    var taskList = taskData.taskListByID(card.attr('id'));
    var input = card.find('.gtd-add-task');
    var pList = card.find('ul');

    /* create a template */
    var params = {
        'tasklist': taskList.id,
	'resource': {
	    'title': input.val(),
	    'completed': null,
	    'status': 'needsAction'
	}
    };

    /* function callback is inline to access local function namespace */
    gapi.client.tasks.tasks.insert( params ).then(
	function(response) {
	    var newTask = response.result;
	    
	    /* update the cache */
	    taskData.addTask(newTask, taskList);
	    
	    /* polish the ui */
	    var pItem = document.createElement('li');
	    pItem.classList.add('list-group-item');
	    pItem.id = newTask.id;
	    
	    /* create the display entry for this task */
	    divTaskEntry(pItem, newTask);
	    
	    /* weave it into the list at the start */
	    pList.prepend(pItem);
	    
	    /* cleanup */
	    input.val("");
	    
        },
	function(response) {
	    uiSetAlert(
		"<strong>Error!</strong> - Failed to create new task",
		'alert-danger'
	    );
	}
    );
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
    var task = taskData.taskByID(listItem.attr('id'));
    var modal = $("#gtdTaskEditModal");
    
    var title = $("#gtdEditModalTitle");
    title.val(task.title);
    
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
        var notes = $("#gtdEditModalNotes");
        notes.val(task.notes);
    }
    
    modal.modal('show');
}

function gtdEditModalOk() {
    var task = taskData.taskByID($("#gtdEditModalTaskID").val());
    var taskItem = $('#'+task.id);
    var listInfo = taskItem.find('.gtd-task-label');
    var taskList = taskData.taskListFromTaskID(task.id);

    var params = {
        'task': task.id,
        'tasklist': taskList.id
    };

    /* are we blowing away? */
    var cb = document.getElementById("gtdEditModalDelete");
    var deleteMe = cb.checked;
    
    /* remove the task if requested */
    if (deleteMe) {
        gapi.client.tasks.tasks.delete(params).then(
	    function (response) {
		taskData.removeTask(task);   /* remove cache copy */
		taskItem.remove();           /* remove UI entry */
	    },
	    function(response) {
		uiSetAlert(
		    "<strong>Error!</strong> - Failed to delete task",
		    'alert-danger'
		);
	    }
	);

	/* clean up */
	gtdEditModalHide();

        /* end here */
        return;
    }

    /* prepare to add the updating fields */
    params['resource'] = {};

    /* extract the info from the modal */
    var title = $("#gtdEditModalTitle").val();
    if (title && title != "" && title != task.title)
	params['resource']['title'] = title;

    var notes = $("#gtdEditModalNotes").val();
    if (notes && notes != "" && notes != task.notes)
	params['resource']['notes'] = notes;

    var dueDate = $("#gtdEditModalDate").val();
    var dueTime = $("#gtdEditModalTime").val();
    if (dueDate && dueDate != "" && dueDate != task.due)
	params['resource']['due'] = dateTime_to_taskTime(dueDate, dueTime);

    
    /* eventually write back to google */
    gapi.client.tasks.tasks.patch(params).then(
	function (response) {
	    var respTask = response.result;

	    /* update the cache */
	    taskData.addTask(respTask, taskList);

	    /* UI should be updated */
	    listInfo.find('.gtd-task-title').html(respTask.title);
	    
	    listInfo.find('.gtd-item-notes').html(respTask.notes);

	    if (respTask.hasOwnProperty('due')) {
		var dueBlock = listInfo.find('.gtd-task-due-date');
		var dueDate = dueBlock.find('.gtd-item-date');
		dueDate.html(displayDateTime(respTask.due));
		dueBlock.show();
	    }
	},
	function(response) {
	    uiSetAlert(
		"<strong>Error!</strong> - Failed to update task",
		'alert-danger'
	    );
	}
    );

}

function uiTaskDrag(event, ui) {
    var dragItem = ui.item;
    var dragTask = taskData.taskByID(dragItem.attr('id'));
    var startCard = $(this).closest('.card');
    var startTaskList = taskData.taskListByID(startCard.attr('id'));
    
    var targetCard = dragItem.closest('.card');
    var targetTaskList = taskData.taskListByID(targetCard.attr('id'));

    //console.log("uiTaskDrag(" + dragTask.title + ") " + startTaskList.title+ " -> " + targetTaskList.title);
    //console.log("ui.item.index(" + dragItem.index() + ")");

    var params = {
        'task': dragTask.id,
        'tasklist': targetTaskList.id
    }
    
    /* locate the previous task */
    if (dragItem.index() > 0) {
        var tasks = taskData.tasksByTaskListID(targetTaskList.id);
        var prevTask = tasks[dragItem.index()-1]
        
        params['previous'] = prevTask.id;
    }

    /* do it */
    gapi.client.tasks.tasks.move(params).then(
	function (response) {
	    var respTask = response.result;

	    /* log the return data */
	    console.log(JSON.stringify(response, undefined, 2));
        
	    /* update cache -- with result entry*/
	    taskData.moveTask(respTask, targetTaskList, dragItem.index());
    
	    /* ui should be updated in case of lineage changes */
	    updateTaskItemUI(dragItem, respTask);
	},
	function(response) {
	    gapi_task_response_error(response);
	    uiSetAlert(
		"<strong>Error!</strong> - Failed to create new task",
		'alert-danger'
	    );
	}
    );
    
}

function uiTaskNext(e) {
    var listItem = $(this).closest('li');
    var task = taskData.taskByID(listItem.attr('id'));

    /* TO-DO: update data to reflect that this is a 'next-task' */
    
    /* make the user happy */
    this.classList.toggle('fa-star-o');
    this.classList.toggle('fa-star');
}

function uiTaskCompleted(e) {
    var boxIcon = $(this);
    var listItem = boxIcon.closest('li');
    var task = taskData.taskByID(listItem.attr('id'));
    var taskList = taskData.taskListFromTaskID(task.id);
    var params = {
        'tasklist': taskList.id,
        'task': task.id,
        'resource': {
	    'status': 'needsAction',
	    'completed': null
	}
    };

    /* toggle the task as completed if it was not */
    if (task.status != 'completed') {
        var dt = new Date();
        params['resource']['status'] = 'completed';
        params['resource']['completed'] = dt.toISOString();
    }

    /* turn off the active mode */
    listItem.toggleClass('active');

    /* update Google entry */
    gapi.client.tasks.tasks.patch(params).then(
	function (response) {
	    var respTask = response.result;

	    /* log the return data */
	    console.log(JSON.stringify(response, undefined, 2));
        
	    /* update cache -- with result entry*/
	    taskData.removeTask(task);
	    taskData.addTask(respTask, taskList);

	    /* switch out the icon */
	    boxIcon.toggleClass('fa-square-o');
	    boxIcon.toggleClass('fa-check');
    
	    /* track the text and rub it out */
	    listItem.find('.gtd-task-label').toggleClass('gtd-completed');
	},
	function(response) {
	    uiSetAlert(
		"<strong>Error!</strong> - Failed to mark task completed",
		'alert-danger'
	    );
	}
    );
}

function divTaskEntry(pItem, task) {
        
    var checkbox, label;
    var pd = 0;
    var cur = task;

    /* get parent depth */
    while (cur && cur.hasOwnProperty('parent')) {
        cur = taskData.taskByID(cur.parent);
        pd++;
    }
    //console.log("Task: " + task.title + " parentage: " + pd);

    /* setup icons */
    var drag = document.createElement('i');
    drag.classList.add('fa', 'fa-fw', 'fa-reorder', 'd-print-none', 'pull-left');
    
    var next = document.createElement('i');
    next.classList.add('fa', 'fa-fw', 'fa-star-o', 'pull-left');
    next.onclick = uiTaskNext;

    var done = document.createElement('i');
    done.classList.add('fa', 'fa-fw', 'fa-square-o', 'pull-left', 'gtd-task-indent-'+pd);
    //done.classList.add('fa', 'fa-fw', 'fa-square-o', 'pull-left'); //, 'gtd-task-indent-'+pd);
    done.onclick = uiTaskCompleted;

    var edit = document.createElement('i');
    edit.classList.add('fa', 'fa-fw', 'fa-edit', 'd-print-none', 'pull-right');
    edit.onclick = uiTaskEditModal;
    
    var info = document.createElement('div');
    info.classList.add('gtd-task-label', 'gtd-task-label-'+pd);
    //info.classList.add('gtd-task-label'); //, 'gtd-task-label-'+pd);
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
 * Create a BS-card for each tasklist and its tasks
 */
function taskListCard(taskList) {
    var pItem, task, tIdx, tasks;
    var cardInfo = {
        card: null,
        width: -1,
        height: -1,
        taskList: taskList,
        next: null
    };

    var pComp = createCard(taskList.title, "Footer Text", taskList.id);
    cardInfo.card = pComp.card;
    
    tasks = taskData.tasksByTaskListID(taskList.id);
    
    for (tIdx in tasks) {
        task = tasks[tIdx];
        
        /* ignore cruft */
        if (!task.title || task.title == "" || task.hidden)
            continue;
        
        /* manage user display */
        if (task.completed && !taskData._pref_includeCompleted)
            continue;

        /* make a new list item */
        pItem = document.createElement('li');
        pItem.classList.add('list-group-item');
        pItem.id = task.id;
        pItem.onclick = function(e) {
            e.preventDefault();
            //console.log("Got a list-item click");
            //console.log(e);

	    var multiSelect = false;

	    /*
	     * The multi-select seems to have some odd behaviours
	     */
	    if (!multiSelect) {
		/* this is for single select mode */
		$(this).parent().find('li').removeClass('active');
		this.classList.add('active');
	    }
	    else {
		/* use this for multi-select */
		this.classList.toggle('active');
	    }
        };

        /* create the display entry for this task */
        divTaskEntry(pItem, task);
        
        /* weave it into the list */
        pComp.list.appendChild(pItem);

    }
    
    /* should render in background (hidden) to get size estimates.*/
    var sb = document.getElementById('tasksArea');
    sb.appendChild(pComp.card);
    cardInfo.height = pComp.card.clientHeight;
    cardInfo.width = pComp.card.clientWidth;
    
    //DEBUG console.log(taskList.title + ": sandbox: " + pComp.card.clientWidth + " x " + pComp.card.clientHeight);
    
    sb.removeChild(pComp.card);

    if (cardInfo.height <= window.innerHeight)
        return cardInfo;
    
    /* split it up */
    cardInfo.next = createCard(taskList.title + " cont'd", "Footer Text", taskList.id+'-1')
    return cardInfo;
}

function renderTasks() {
    'use strict';
    var fit = 'linear';
    var ti, tl, nextTL=null, item, taskLists, divs = [], tls = [], nextTLDiv;
    var tasksArea = document.getElementById('tasksArea');
    
    /* always have next-tasks first */
    taskLists = taskData._pref_taskLists;

    //for (ti in taskLists){
    //    console.log("got: " + taskLists[ti].title);
    //}

    ti = taskLists.findIndex(function(element) {
        return element.title == 'Next-Tasks';
    })
    
    if (ti >= 0)
        nextTL = taskLists.splice(ti,1)[0];

    /* arrange the block shortest to tallest */
    taskLists.sort(function(a, b){
        var lenA = taskData.taskListByID(a.id).length;
        var lenB = taskData.taskListByID(b.id).length;
        if (lenA < lenB) return -1;
        if (lenA > lenB) return 1;
        return 0;
    });

    /*
     * Clear out any pre-existing divs...
     */
    while (tasksArea.childElementCount > 0)
        tasksArea.removeChild(tasksArea.firstChild);

    var cardInfo = [];
    
    /* setup the next task div */
    if (nextTL) {
        item = taskListCard(nextTL);
        cardInfo.push(item);
    }

    /* fill in the rest of the divs */
    for (ti in taskLists) {
        tl = taskLists[ti];
        item = taskListCard(tl);
        cardInfo.push(item);
    }
    
    /* lay them out so the screen can identify their true size */
    standardLayout(tasksArea, cardInfo);
    checkSizes();
    
    /* re-arrange the cards to be best fit */
    optimizeLayout(tasksArea, cardInfo);
}

function standardLayout(area, cardInfo) {
    var row, col, pi;
    
    for (pi in cardInfo) {
        if (pi % 3 == 0) {
            row = document.createElement('div');
            row.classList.add('row');
            tasksArea.appendChild(row);
        }
    
        col = document.createElement('div');
        col.classList.add('col-md-4');
        col.appendChild(cardInfo[pi].card);
        row.appendChild(col);
    }
    
    return;
}

function optimizeLayout(tasksArea, cardInfo) {
    var idx, tl, card;
    var nextCard = null;
    var row, col, cols = [];
    
    /* scrub it */
    while (tasksArea.childElementCount > 0)
        tasksArea.removeChild(tasksArea.firstChild);
    
    /* should be grabbing the Next-Tasks */
    for (idx in cardInfo) {
        if (cardInfo[idx].taskList.title == 'Next-Tasks') {
            nextCard = cardInfo.splice(idx, 1)[0];
            break;
        }
    }

    while (cardInfo.length > 0) {

        /* concern only with height */
        row = document.createElement('div');
        row.classList.add('row');
        row.classList.add('gtd-page');
        tasksArea.appendChild(row);

        /* add up to the max number of columns */
        for (idx=0; idx < 3; idx++) {
            colPx = window.innerHeight;
            col = document.createElement('div');
            col.classList.add('col-md-4');
            row.appendChild(col);
            cols.push(col);

            /* fill it up */
            while (cardInfo.length > 0) {
                if (!nextCard)
                    nextCard = getBestTL(colPx, cardInfo);

                if (!nextCard) {
                    //console.log("filled this column")
                    break;
                }

                col.appendChild(nextCard.card);
                colPx -= nextCard.height;
                nextCard = null;
            }
        }
        
        /* all done or nothing fits... */
        if (colPx == window.innerHeight && nextCard == null)
            break;
    }
    
    for (idx in cardInfo) {
        card = cardInfo[idx];
        console.log("Cannot fit card: "+card.height);
    }
}

function getBestTL(colPx, cards) {
    var i, bestIdx = -1, bestSize = 0;
    var n = 0;
    for (i in cards) {
        n = cards[i].height;
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
    return cards.splice(bestIdx, 1)[0];
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
    
    var idx, tl, card;
    var taskLists = taskData.getTaskLists();
    
    for (idx in taskLists) {
        tl = taskLists[idx];
        card = document.getElementById("card-"+tl.id);
        if (!card)
            continue;
        console.log(tl.title + ": " + card.clientWidth + " x " + card.clientHeight);
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

// Client ID and API key from the Developer Console
var CLIENT_ID = '276059749769-fv7rj6tn4lot7ispmr5udorskla6fbuc.apps.googleusercontent.com';
var CLIENT_SECRET = 'Lbta6k0-4kBHfnyPUmDijNjF';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/tasks';


/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(
	function () {
            /* Listen for sign-in state changes. */
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

            /* Handle the initial sign-in state. */
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
	},
	gapi_console_logger
    );
}

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
function updateSigninStatus(isSignedIn) {
    var authorizeButton = document.getElementById('authorize-button');
    if (isSignedIn) {
        authorizeButton.innerHTML = 'Sign Out'
        loadData();
    } else {
        authorizeButton.innerHTML = 'Authorize'
    }
}

/**
*  Sign in/out the user upon button click.
*/
function handleAuthClick(event) {
    var authorizeButton = document.getElementById('authorize-button');
    if (authorizeButton.innerHTML == 'Authorize')
        gapi.auth2.getAuthInstance().signIn();
    else
        gapi.auth2.getAuthInstance().signOut();
}

/**
*  Manage the JSON button
*/
function handleJsonClick(event) {
    if (taskData.loaded()) {
        var blob = new Blob(
            [ JSON.stringify(taskData) ],
            { type: "application/json;charset=utf-8"}
        );
        saveAs(blob, "data.json");              
    }
    else {
        console.log("Not complete yet...")
    }
}

/*
 * Loading support
 */

function loadTasksCache(response) {
    tasks = response.result.items;

    /* add an index so we can lookup a taskList from a task.id */
    for (var ti in tasks)
        taskData.addTask(tasks[ti], this);
    
    /* record that this list is loaded */
    taskData._lists_loaded += 1;

    /* whichever set of tasks is last to be added triggers the initial render */
    if (taskData.loaded()) {
        renderTasks();
    }
}

function loadTaskListsCache(response) {
    for (var idx in response.result.items) {
        var tl = response.result.items[idx];
        
        /* add the tasklist to the cache first */
        taskData.addTaskList(tl);

        /* fetch each list and load the tasks in it */
        gapi.client.tasks.tasks.list({'tasklist': tl.id}).then(
            loadTasksCache,
	    handleTasksError,
	    tl   /* context -- becomes 'this' */
        );
    }
}

function loadData() {
    /* reset so the population can trigger a refresh */
    taskData.clearTasksCache();
    
    gapi.client.tasks.tasklists.list({
        'maxResults': 100
    }).then(
	loadTaskListsCache,
	gapi_console_logger
    );
}

function handleTasksError(reason) {
    console.log("problem collecting tasks for '" + this.title + "'");
    console.log(JSON.stringify(reason, undefined, 2));
}

/* setup the initial refresh timer... */
taskData.updateRefresh(10);
