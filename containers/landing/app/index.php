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
    $webpageMessageHeader = "";
    $webpageMessage = "Thank you for your interest in our study! Sadly this webpage doesn't work with mobile browsers, please return with a desktop PC.";
    $webpageRedirect = False;
    include(__DIR__."/static/error.php");
    die();
}

// TODO: Check to see if token is in cookies for redirection to study
include("static/intro.php");
?>
