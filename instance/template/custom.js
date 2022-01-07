/*
 * Copyright (C) 2017 Christian Stransky
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

/*
 * Task numbering scheme:
 * This is a convoluted topic in this code that deserves some documentation.
 * This code assumes that every task has two cells, one markdown and one code.
 * Every notebook also has a standalone introduction  and conclusion markdown
 * cell that will not have any run or execute buttons. Every cell is assigned
 * an id sequentially in the format of cell{id} where id starts at 1 and is
 * incremented for every cell. After cell ids are assigned, every two cells
 * (except first and last) are given the same class in the format of task{id}
 * where id starts at 0. The task classes are what is used to show and hide
 * tasks as the user advances through the notebook.
 *
 * Lastly, there is one more numbering scheme to mention, which is the cell
 * indices used by Jupyter internally. These are indexed at 0 and are
 * incremented the same way as cell ids.
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
    let id = 1 + (getCurrentTaskNumber() * 2);
    // Scroll
    let elm = $("#cell"+id);
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
            $(`.task${i} button`).hide();
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
        startBtn.attr('style', 'float: right;');
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
        nextBtn.attr('style', 'float: right;');
        $('div#notebook-container').append(nextBtn);

        // Skip button. Acts as a skip task button.
        var skipBtn = $('<button/>').text('Skip Task').click(function() {
            nextTask(action_types.skip, 500);
        });
        skipBtn.attr('id', 'not_solved_next_btn').attr('class', 'btn btn-primary btn-task');
        skipBtn.attr('style','float: right;margin-right:10px;');
        $('div#notebook-container').append(skipBtn);

        // Code buttons, these are attached directly to the code cell
        var codeBtns = $('<div/>').attr("class", "code-btns");

        // Run button. Runs the user's code
        var execBtn = $('<button/>').text('Run').click(function(){
            var tasknum = getCurrentTaskNumber();
            console.debug(`Running task ${tasknum}`);

            // Measure time
            timeExecMeasure(tasknum);
            // Make sure the current task's code cell is focused
            IPython.notebook.get_cell(tasknum*2).focus_cell();
            // Execute the current cell
            IPython.notebook.execute_selected_cells();

            // Uncomment to record everytime the user runs code
            //submitCode(userId, IPython.notebook.toJSON(), action_types.run, token);

            // Record current date in a hidden element?
            var currentdate = new Date();
            $("#"+id).find(".timing_area").text("Last execution started: "+currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds())
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


        // Label cells in pairs with task0...taskn, except for the first cell
        // which is considered an introduction cell.
        let id = 1;
        $('#cell'+id).addClass("task0");

        for (i = 1; i <= getTaskCountInNotebook(); i++) {
            id += 1;
            $('#cell'+id).addClass("task"+i);
            $('#cell'+id+' button').addClass("task"+i);
            // $('#cell'+id).append("<a name='task"+i+"'></a>");

            id += 1;
            $('#cell'+id).addClass("task"+i);
            $('#cell'+id+' button').addClass("task"+i);
        }

        var ia = $('.input_area');
        timing_area = $('<div/>')
            .attr("style", "padding: 0 5px; border: none; border-top: 1px solid #CFCFCF; font-size: 80%;")
            .attr("class", "timing_area")
            .appendTo(ia);

        // Hide and scroll to current task
        hideTasks();
        scrollToCurrentTask();
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
