<?php
//! Copyright (C) 2017 Christian Stransky
//!
//! This software may be modified and distributed under the terms
//! of the MIT license.  See the LICENSE file for details.


define('__DIR__', dirname(__FILE__));
require_once(__DIR__."/../webpageConf/config.php");
require_once('util.php');

if(studyLimitReached()){
    $webpageMessageHeader = "Study is over";
    $webpageMessage = "Thank you for your interest! We have already received the maximum number of participants for this study.";
    $webpageRedirect = False;
    include(__DIR__."/static/error.php");
    die();
}

$useragent=$_SERVER['HTTP_USER_AGENT'];
if (checkMobile($useragent)) {
    $webpageMessageHeader = "Mobile devices not supported";
    $webpageMessage = "Thank you for your interest in our study! Sadly this webpage doesn't work with mobile browsers, please return with a desktop PC.";
    $webpageRedirect = False;
    include(__DIR__."/static/error.php");
    die();
}

if (isset($_COOKIE["token"]) && isset($_COOKIE["userId"])) {
    $userId = $_COOKIE["userId"];
    $token = $_COOKIE["token"];

    // Connect to database
    $connect = new PDO("pgsql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass);
    $connect->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Check if user's instance is still in the database
    $sth = $connect->prepare('SELECT instanceid as instanceid FROM "createdInstances" WHERE userid = :userid AND NOT "instanceTerminated" AND NOT finished;');
    $sth->bindParam(':userid', $userId);
    $sth->execute();
    $results = $sth->fetch(PDO::FETCH_BOTH);
    $instance = $results["instanceid"];

    if(strlen($instance) > 0) {
        // Redirect to active study instance
        header("Location: /proxy/$instance/?userId=$userId&token=$token");
        die();
    }
}

include("static/intro.php");
?>
