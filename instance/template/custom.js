/*
 * Copyright (C) 2017 Christian Stransky
 * Copyright (C) 2022 Joe Lewis
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

/*
 * Task numbering scheme:
 *
 * Jupyter notebooks used by this interface are required to have extra metadata
 * for each cell describing its task number. This is used by the interface to
 * correctly hide and show cells related to a certain tasks.
 *
 * There a few numbering schemes to be aware of
 *  - Jupyter's cell numbering: indexed at 0 and incremented for every cell
 *
 *  - Cell id numbering: indexed at 1 and incremented for every cell. Can be
 *    found in the id field of every cell's enclosing div element. Ex: cell1,
 *    cell2, etc.
 *
 *  - Cell task numbering: indexed at 0 and set based on cell metadata. Can be
 *    found as a class of every cell's enclosing div element. Ex: task0, task1,
 *    etc.
 *
 */

// ---------
// Constants
// ---------

const action_types = {
    "start": "b",
    "run": "r",
    "skip": "s",
    "next": "n",
    "finished": "f"
}

// -----------------
// Utility functions
// -----------------

function getTaskCountInNotebook(){
    return %taskCount%;
}

function setCurrentTaskNumber(task){
    document.cookie = "taskNumber="+task
}

function getCurrentTaskNumber(){
    var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)taskNumber\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    if(cookieValue){
        return parseInt(cookieValue);
    }else{
        return 0;
    }
}

function heartbeatQuery() {
    var userId = document.cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    var token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    $.ajax(
        {
            type: "GET",
            url: "/heartbeat.php?userId="+userId+"&ec2instance="+window.location.hostname+"&token="+token,
            contentType: 'text/plain',
            crossDomain: true,
            dataType: 'jsonp',
            success: function() {
                setTimeout(heartbeatQuery, 60000);
            },
            error: function() {
                setTimeout(heartbeatQuery, 60000);
            }
        }
    );
}


function scrollToCurrentTask(){
    let tasknum = getCurrentTaskNumber();

    // Scroll
    let elm = $(`.task${tasknum}`);
    if (elm.offset() != undefined) {
        elm[0].scrollIntoView();
    }
}

function submitCode(user_id, code, stat, token) {
    let parts = Jupyter.notebook.config.base_url.split("/");
     $.ajax({
        url: `/${parts[1]}/${parts[2]}/submit`,
        type: "POST",
        data: JSON.stringify({"type": "code", "user_id": user_id, "code": code, "time": {"focusTime": diffTimeFocus, "execTime":JSON.stringify(timeStampArray)}, "status": stat, "token": token}),
        contentType: "application/json; charset=utf-8",
        success: function() {
            if(stat == 'f'){
                var userId = document.cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
                var token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
                window.location.replace(`/survey/${userId}/${token}`);
            }
        },
        error: function() {
            if(stat == 'f'){
                window.location.replace("/survey");
            }
        }
    });
}

function submitPastedCode(user_id, code, tasknum, cellid, token) {
    $.ajax({
        url: "/submit",
        type: "POST",
        data: JSON.stringify({'type': 'pasted', 'user_id': user_id, 'code': code, 'tasknum': tasknum, 'cellid':cellid, "token": token}),
        contentType: "application/json; charset=utf-8",
    });

}

function hideTasks(){
    currentTask = getCurrentTaskNumber();
    if(currentTask == 0){
        $(".btn-task").hide();
        $(".btn-start").show();
    }else{
        $(".btn-task").show();
        $(".btn-start").hide();
    }

    $("#task_progress").html(`Current task progress: ${currentTask} out of ${getTaskCountInNotebook()}`)

    for (i = 0; i <= getTaskCountInNotebook(); i++) {
        if (i < currentTask) {
            $(".task"+i).show();
            $(`.task${i} button`).show();
        } else if (i == currentTask) {
            $(".task"+i).show();
            $(`.task${i} button`).show();
        } else {
            $(".task"+i).hide();
        }
    }

    if (currentTask == getTaskCountInNotebook()){
        $(".btn-task").hide();
        $("#next_btn").show();
        $("#next_btn").text("Exit study");
    }
}

// ----------------
// Time Measurement
// ----------------

var lastCopy = "";

//time measurement
var timeStampArray = {};
function timeExecMeasure(tasknum) {
    var task = tasknum.toString();
    if (typeof timeStampArray[task] == 'undefined')
        timeStampArray[task] = new Array();
    timeStampArray[task].push((new Date()).toUTCString());
}

// focus time measurement
var windowFocus = true;
$(window).focus(function() {
    windowFocus = true;
}).blur(function() {
    windowFocus = false;
});

var diffTimeFocus = 0;
var focusTime = setInterval(function() {
    if (windowFocus == true) {
        diffTimeFocus += 0.5;
    }
}, 500);


var warningMsg = 'Are you sure you want to leave this page? '+
                    'Choosing "OK" will take you to the exit interview, '+
                    'and you will not be able to continue editing your code. '+
                    'To continue editing your code, please select "Cancel."';

$([IPython.events]).on("edit_mode.Cell", function () {
    if (IPython.notebook.get_selected_cell().cell_type == "markdown") {
        IPython.notebook.execute_selected_cells();
    }
});

// -----------------------
// Main initilization code
// -----------------------

define([
    'base/js/namespace',
    'base/js/promises'
], function(Jupyter, promises) {
    promises.notebook_loaded.then(function() {
        // ---------
        // App setup
        // ---------

        // Add heartbeat callback
        setTimeout(heartbeatQuery, 1000);

        // Remove interface elements
        $('div#tab_content').hide();
        $('div#menubar-container').hide();
        // Remove link to notebook tree
        $("div#ipython_notebook a").remove();


        // Setup variables
        var userId = document.cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        var token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");

        // Task Progress
        let taskProgress = $('<span/>').attr('class', 'task_progress').attr('id', 'task_progress')
            .attr('style', 'color: red');

        $("#save_widget").append(taskProgress);

        // ------------------------
        // Custom interface buttons
        // ------------------------

        function nextTask(action_type, save_timeout=0) {
            setCurrentTaskNumber(getCurrentTaskNumber()+1);
            console.info(`Advancing to task ${getCurrentTaskNumber()}`);
            hideTasks();
            scrollToCurrentTask();
            // Focus code or other cell
            let task_num = getCurrentTaskNumber();
            let code_cell_id = $(`.task${task_num}.code_cell`).attr("id");
            if (typeof code_cell_id == "undefined") {
                code_cell_id = $(`.task${task_num}.cell`).attr("id");
            }

            if (typeof code_cell_id != "undefined") {
                let jupyter_cell_id = parseInt(code_cell_id.replace("cell", "")) - 1;
                IPython.notebook.get_cell(jupyter_cell_id).focus_cell();
            }

            if (save_timeout != 0) {
                IPython.notebook.save_notebook();
                var saved = setInterval(function() {
                    if (!IPython.notebook.dirty) {
                        clearInterval(saved);
                        submitCode(userId, IPython.notebook.toJSON(), action_type, token);
                    }
                }, 500);
            } else {
                submitCode(userId, IPython.notebook.toJSON(), action_type, token);
            }

        }

        // Ok, got it button, shown on the first cell of the task file for insructions
        var startBtn = $('<button/>').text("Start").click(function() { nextTask(action_types.start) });
        startBtn.attr('id', 'start_btn').attr('class', 'btn btn-primary btn-start');
        startBtn.attr('style', 'float: right; margin-top:10px');
        $('div#notebook-container').append(startBtn);

        // Next button, for users to continue the study after solving a task
        var nextBtn = $('<button/>').text('Next Task').click(function() {
            if (getCurrentTaskNumber() < getTaskCountInNotebook()){
                // Advance to next task
                nextTask(action_types.next, 500);
            } else {
                // The user clicked on "Exit study"
                // TODO: Change this to a modal?
                if (confirm(warningMsg)) nextTask(action_types.finished, 500);
            }
        });
        nextBtn.attr('id', 'next_btn').attr('class', 'btn btn-primary btn-task');
        nextBtn.attr('style', 'float: right; margin-top: 10px;');
        $('div#notebook-container').append(nextBtn);

        // Skip button. Acts as a skip task button.
        var skipBtn = $('<button/>').text('Skip Task').click(function() {
            nextTask(action_types.skip, 500);
        });
        skipBtn.attr('id', 'not_solved_next_btn').attr('class', 'btn btn-primary btn-task');
        skipBtn.attr('style','float: right; margin: 10px 10px 0 0');
        $('div#notebook-container').append(skipBtn);

        // Code buttons, these are attached directly to the code cell
        var codeBtns = $('<div/>').attr("class", "code-btns");

        // Run button. Runs the user's code
        var execBtn = $('<button/>').text('Run').click(function(e){
            var tasknum = getCurrentTaskNumber();
            let target = $(e.target);
            console.debug(`Running task ${tasknum}`);

            // Measure time
            timeExecMeasure(tasknum);
            // Make sure the current task's code cell is focused
            let code_cell_id = target.parents(".code_cell").attr("id");
            let jupyter_cell_id = parseInt(code_cell_id.replace("cell", "")) - 1;
            IPython.notebook.get_cell(jupyter_cell_id).focus_cell();
            // Execute the current cell
            IPython.notebook.execute_selected_cells();

            // Uncomment to record everytime the user runs code
            //submitCode(userId, IPython.notebook.toJSON(), action_types.run, token);
        });

        execBtn.attr("title", "Runs the currently active code cell");
        execBtn.attr('class', 'btn btn-success btn-task execBtn btn-code');
        codeBtns.append(execBtn);

        // Stop button. Will stop the current running cell.
        var stopBtn = $("<button/>").text("Stop").click(function() {
            IPython.notebook.kernel.interrupt();
        });
        stopBtn.attr("title", "Stops the currently running cell. Helpful for infinite loops.");
        stopBtn.attr("class", "btn btn-danger btn-task btn-code").attr("id", "stop_btn");
        codeBtns.append(stopBtn);

        // Reset button. Resets the IPython kernel.
        var resetBtn = $('<button/>').text('Reset').click(function(){
            //Resets the kernel
            if(confirm("Do you want to restart the kernel? This will reset all variables.")){
                IPython.notebook.kernel.restart();
            }
        });
        resetBtn.attr('title', 'Use this in case that your program got stuck. This will reset all variables.');
        resetBtn.attr('class', 'btn btn-warning btn-task btn-code').attr('id', 'reset_btn');
        codeBtns.append(resetBtn);

        $('div.code_cell').append(codeBtns);


        // --------------------------
        // Notebook cell modification
        // --------------------------

        // Number every cell with cell1...celln
        $('.cell').attr('id', function(i) {
            return 'cell'+(i+1);
        });

        // Using cell metadata, label each cell with task numbers
        $('.cell').attr('id', function(i) {
            let cell = Jupyter.notebook.get_cell(i);
            if ("metadata" in cell && "tasknum" in cell.metadata) {
                $(`#cell${i+1}`).addClass(`task${cell.metadata.tasknum}`);
            }
        });

        // Hide and scroll to current task
        hideTasks();
        // Delay needed to let DOM finish loading properly
        setTimeout(scrollToCurrentTask(), 500);
        console.info("Developer Observatory loaded");
    });
});

// leave at least 2 line with only a star on it below, or doc generation fails
/**
 *
 * @module IPython
 * @namespace IPython
 * @class customjs
 * @static
 */
