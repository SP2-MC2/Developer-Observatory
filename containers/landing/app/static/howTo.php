<!DOCTYPE html>
<html lang="en">

<?php $title="Study - How To"; include('template/head.php'); ?>

<?php include('template/body.html') ?>

<hr class="featurette-divider">
<div class="row">
    <div class="col-lg-6" style="text-align: justify;">
        <p><h2>About the online editor</h2>
For this study, you will be writing your code using a Python online editor. The editor is based on Jupyter notebook, an interactive, web-based platform that allows you to write and execute Python code directly in your browser. Please note that we use Python version 2.7.12 for this study.<br />

We have included any third party libraries you will need to complete all programming tasks. A list of pre-installed libraries is available in the editor.</p>

<p><h2>Write your code</h2>
Before writing any code, please read the task description carefully. Type your code in shaded input cells. We have provided some skeleton code or comments for each task to help you get started. We have also provided testing code in each task. You are recommended to use the documentation linked at the top of the task. If you use any other resources, please note the location in a comment in your code.</p>

<p><h2>Test your code</h2>
Push the green button labeled “Run” to run your code. Output will be displayed below your code. If your code hangs or has an infinite loop, you can use the red button labeled “Stop” to interrupt the running code.</p>

<p><h2>Finishing a task</h2>
When you are satisfied with your solution, push the blue button labeled “Next Task.” The next task will appear below the task you have just finished. When you have completed the final task, the blue button will read “Exit Study.” Clicking this button will redirect you to our exit survey, which should take less than 15 minutes to complete. Once you choose Exit Study, you cannot return to edit your code any further.</p>

<p><h2>If you get stuck</h2>
If you find that for any reason you are unable to complete a particular task, please click the blue button labeled “Skip Task." We appreciate your effort!<br />

If for any reason you need to clear the variables in your notebook's current running kernel, click the yellow “Restart” button.</p>

<p><h2>Leaving the study</h2>
You can stop and return to the study at any point, your progress is automatically saved. To return to the study, click on the original link given to you by the study administrators. We use cookies to track your progress, so please ensure they are enabled for our site.</p>

<p>Please wait while we start your editor, this will only take a couple of seconds. You can start as soon as the button shows “Start Study.”</p>
        </div>
        <div class="col-lg-6">
            <img src="static/img/example_interface.png" style="width:100%;border:1px solid black" alt="Screenshot of study interface" />
            <p>Interface screenshot</p>
        </div>
    </div>
    <button class="btn btn-lg btn-warning" id="loadingButton">
        <span class="glyphicon glyphicon-refresh spinning"></span> Preparing your notebook...    
    </button>
    <hr class="featurette-divider">

    <script>
    function executeQuery() {
      $.post("getAssignedInstance.php",
        {
            userid: "<?php echo $uniqid; ?>",
            token2: "<?php echo $token2; ?>"
        },
        function(data, status){
            if(data != 'error'){
                if(data.length > 5){
                    $('#loadingButton').html("Start study");
                    $('#loadingButton').removeClass("btn-warning");
                    $('#loadingButton').addClass("btn-success");
                    $('#loadingButton').click(function() {
                       window.location = data;
                    });
                    //window.location = data;
                } else {
                    setTimeout(executeQuery, 5000);
                }
            } else {
                    $('#loadingButton').html("An error occured, please try again later.");
                    $('#loadingButton').removeClass("btn-warning");
                    $('#loadingButton').addClass("btn-danger");
            }
        });
    }

    // run the first time; all subsequent calls will take care of themselves
    setTimeout(executeQuery, 1000);
    </script>


<?php include('template/bodyend.html') ?>

</html>
