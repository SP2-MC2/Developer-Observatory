<?php
//! Copyright (C) 2017 Christian Stransky
//!
//! This software may be modified and distributed under the terms
//! of the MIT license.  See the LICENSE file for details.

define('__DIR__', dirname(__FILE__));
require_once(__DIR__."/../webpageConf/config.php");
require_once("util.php");

if(studyLimitReached()) {
    $webpageMessageHeader = "Study is over";
    $webpageMessage = "Thank you for your interest! We have already received the maximum number of participants for this study.";
    $webpageRedirect = False;
    include(__DIR__."/static/error.php");
    die();
}

// Generate a new token and token2 for this user
$token = generateAlphanumeric(12);
$token2 = generateAlphanumeric(12);

// Get origin parameter
$originParam = htmlspecialchars($_GET["origin"]);
// If its empty set it to 0 for unknown
if ($originParam == "") {
    $originParam = "0";
}


require("static/consent.php");
?>
