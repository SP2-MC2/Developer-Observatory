<!DOCTYPE html>
<html lang="en">

<?php $title="Error"; include('template/head.php'); ?>

<body>
    <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
    </nav>
    <div class="container">

        <hr class="featurette-divider">
        <div class="row">
            <div class="col-lg-6"  style="text-align: justify;">
                <p><h2><?php echo $webpageMessageHeader;?></h2></p>
                <p><?php echo $webpageMessage;?></p>
            </div>
        </div>
        <hr class="featurette-divider">

    </div>
    
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>

    <!-- Bootstrap Core JavaScript -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
    
</body>

</html>
