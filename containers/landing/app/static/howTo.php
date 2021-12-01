<!DOCTYPE html>
<html lang="en">

<?php $title="Study - How To"; include('template/head.php'); ?>

<?php include('template/body.html') ?>

<hr class="featurette-divider">
<div class="row">
    <div class="col-lg-6" style="text-align: justify;">
        <p><h2>About the online editor</h2>
For this study, you will be writing your code using a Python online editor. The editor is based on Jupyter notebook, an interactive, web-based platform that allows you to write and execute Python code directly in your browser. Please note that we use Python version 2.7.12 for this study.<br />

We have included all third party libraries that we think you might require to complete all programming tasks. 
A list of pre-installed libraries is available in the editor.</p>

<p><h2>Write your code</h2>
Before writing any code, please read the task description carefully. Type your code in shaded input cells. We have provided some skeleton code or comments for each task to help you get started. You are welcome to create any unit test code you need as you work on the task. You are also welcome to use any resources you normally would to help you solve a programming task.</p>

<p><h2>Test your code</h2>
Push the green button labeled “Run and test your code” to run your code. Possible output will be displayed below your code.</p>

<p><h2>Finishing a task</h2>
When you are satisfied with your solution, push the blue button labeled “Solved, Next Task.” The next task will appear below the task you have just finished. When you have completed the final task, the blue button will read “I am done!” Pushing this button will redirect you to our exit survey, which should take less than 15 minutes to complete. Once you choose “I am done!”, you cannot return to edit your code any further.</p>

<p><h2>If you get stuck</h2>
If you find that for any reason you are unable to complete a particular task, please push the red button labeled “NOT solved, Next Task." We appreciate your effort!<br />

If for any reason you need to clear the variables in your notebook's current running kernel, click the yellow "Restart kernel" button.</p>

<p><h2>Leaving the study</h2>
You can stop and return to the study at any point, your progress is automatically saved. To return to the study, click on the original link given to you by the study administrators. We use cookies to track your progress, so please ensure they are enabled for a fully functional study interface.</p>


<p>Please wait while we start your editor, this will only take a couple of seconds. You can start as soon as the button shows “Let me start the study.”</p>
        </div>
        <div class="col-lg-6">
            <img src="static/img/instructions_w.png" width="90%" />
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
