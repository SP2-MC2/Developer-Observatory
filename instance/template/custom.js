//! Copyright (C) 2017 Christian Stransky
//!
//! This software may be modified and distributed under the terms
//! of the MIT license.  See the LICENSE file for details.

// ---------
// Constants
// ---------

const action_types = {
    "got_it": "b",
    "run": "r",
    "skip": "n",
    "next": "s",
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
    id = 1 + (getCurrentTaskNumber() * 2);
    // Scroll
    let elm = $("#cell"+id);
    if (elm.offset() != undefined) {
        window.scrollTo(0, $("#cell"+id).offset().top);
    }
}

function submitCode(user_id, code, stat, token) {
    let parts = Jupyter.notebook.config.base_url.split("/");
     $.ajax({
        url: `/${parts[1]}/${parts[2]}/submit`,
        type: "POST",
        data: JSON.stringify({"type": "code", "user_id": user_id, "code": code, "time": {"focusTime": diffTimeFocus, "execTime":JSON.stringify(timeStampArray)}, "status": stat, "token": token}),
        contentType: "application/json; charset=utf-8",
        success: function(result) {
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
        success: function(result) {
        }
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

    $("#task_progress2").html(currentTask);

    for (i = 0; i <= getTaskCountInNotebook(); i++) {
        if(currentTask < i){
            $(".task"+i).hide();
        } else {
            $(".task"+i).show();
        }
    }

    if (currentTask == getTaskCountInNotebook()){
        $(".btn-task").hide();
        $("#next_btn").show();
        $("#next_btn").text("I am done!");
        $("#reset_btn").show();
        $(".execBtn").show();
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
    promises.app_initialized.then(function(appname) {
        if (appname === 'NotebookApp') {
            // ---------
            // App setup
            // ---------

            // Add heartbeat callback
            setTimeout(heartbeatQuery, 1000);

            // Remove interface elements
            $('div#tab_content').hide();
            $('div#menubar-container').hide();


            // Setup variables
            var userId = document.cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            var token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");

            // Task Progress
            var taskProgress1 = $('<span/>').attr('class', 'task_progress').attr('id', 'task_progress1')
                                            .attr('style', 'color: red; font-weight: bold').html(' Current Task Progress: ');
            var taskProgress2 = $('<span/>').attr('class', 'task_progress').attr('id', 'task_progress2')
                                            .attr('style', 'color: red; font-weight: bold').html(getCurrentTaskNumber());
            var taskProgress3 = $('<span/>').attr('class', 'task_progress').attr('id', 'task_progress3')
                                            .attr('style', 'color: red; font-weight: bold').html(' out of ' + getTaskCountInNotebook());

            $('#save_widget').append(taskProgress1);
            $('#save_widget').append(taskProgress2);
            $('#save_widget').append(taskProgress3);

            // ------------------------
            // Custom interface buttons
            // ------------------------

            function nextTask(action_type, save_timeout=0) {
                setCurrentTaskNumber(getCurrentTaskNumber()+1);
                console.info(`Advancing to task ${getCurrentTaskNumber()}`);
                scrollToCurrentTask();
                hideTasks();
                taskProgress2.html(getCurrentTaskNumber());
                if (save_timeout != 0) {
                    IPython.notebook.save_notebook();
                    var saved = setInterval(function() {
                        if (!IPython.notebook.dirty) {
                            clearinterval(saved);
                            submitcode(userid, ipython.notebook.tojson(), action_type, token);
                        }
                    }, 500);
                } else {
                    submitCode(userId, IPython.notebook.toJSON(), action_type, token);
                }

            }

            // Ok, got it button, shown on the first cell of the task file for insructions
            var startBtn = $('<button/>').text('Ok, got it!').click(function() { nextTask(action_types.got_it) });
            startBtn.attr('id', 'start_btn').attr('class', 'btn btn-primary btn-start');
            startBtn.attr('style', 'float: right;');
            $('div#notebook-container').append(startBtn);

            // Solved, next task button, for users to continue the study after solving a task
            var nextBtn = $('<button/>').text('Solved, Next Task').click(function() {
                if (getCurrentTaskNumber() < getTaskCountInNotebook()){
                    // Advance to next task
                    nextTask(action_types.next, 500);
                } else {
                    // The user clicked on "I am done"
                    // TODO: Change this to a modal?
                    if (confirm(warningMsg)) nextTask(action_types.finished, 500);
                }
            });
            nextBtn.attr('id', 'next_btn').attr('class', 'btn btn-primary btn-task');
            nextBtn.attr('style', 'float: right;');
            $('div#notebook-container').append(nextBtn);

            // NOT Solved, next task button. Acts as a skip task button.
            var nsNextBtn = $('<button/>').text('NOT solved, Next Task').click(function() {
                nextTask(action_types.skip, 500);
            });
            nsNextBtn.attr('id', 'not_solved_next_btn').attr('class', 'btn btn-danger btn-task');
            nsNextBtn.attr('style','float: right;margin-right:10px;');
            $('div#notebook-container').append(nsNextBtn);

            // Run and Test button. Runs the users code (but does no testing?)
            var execBtn = $('<button/>').text('Run and Test').click(function(){
                var tasknum = getCurrentTaskNumber();
                console.debug(`Running task ${tasknum}`);

                // Measure time
                timeExecMeasure(tasknum);
                // Execute the current cell
                IPython.notebook.execute_selected_cells();

                // Uncomment to record everytime the user runs code
                //submitCode(userId, IPython.notebook.toJSON(), action_types.run, token);

                // Record current date in a hidden element?
                var currentdate = new Date();
                $("#"+id).find(".timing_area").text("Last execution started: "+currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds())
            });
            execBtn.attr('class', 'btn btn-success btn-task execBtn');
            execBtn.attr('style', 'align-self:flex-end; width: 120px;');
            $('div.code_cell').append(execBtn);

            // Reset button. Resets the IPython kernel.
            var resetBtn = $('<button/>').text('Restart kernel').attr('title', 'Use this in case that your program got stuck. This will reset all variables.').click(function(){
                //Resets the kernel
                if(confirm("Do you want to restart the kernel? This will reset all variables.")){
                    IPython.notebook.kernel.restart();
                }
            });
            resetBtn.attr('class', 'btn btn-warning btn-task').attr('id', 'reset_btn');
            resetBtn.attr('style', 'float: right;width: 110px;margin-right:10px;');
            $('div#notebook-container').append(resetBtn);



            $('.cell').attr('id', function(i) {
                return 'cell'+(i+1);
            });

            var popoverText = "It looks like you pasted code into the editor. This is perfectly fine, but please let us know where you found it.";
            var id = 1;
            $('#cell'+id).addClass("task0");

            for (i = 1; i <= getTaskCountInNotebook(); i++) {
                id += 1;
                $('#cell'+id).addClass("task"+i);
                $('#cell'+id+' button').addClass("task"+i);
                $('#cell'+id).append("<a name='task"+i+"'></a>");

                id += 1;
                $('#cell'+id).addClass("task"+i);
                $('#cell'+id+' > .input > .inner_cell').popover({content: popoverText, trigger: 'manual', delay: {show: 100, hide: 300}, animation: true, placement: 'auto'});
                $('#cell'+id+' button').addClass("task"+i);
            }

            var ia = $('.input_area');
            timing_area = $('<div/>')
                .attr("style", "padding: 0 5px; border: none; border-top: 1px solid #CFCFCF; font-size: 80%;")
                .attr("class", "timing_area")
                .appendTo(ia);

            hideTasks();
        }
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
