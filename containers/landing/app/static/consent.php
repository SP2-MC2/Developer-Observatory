<!DOCTYPE html>
<html lang="en">

<?php $title="Study - Consent Form"; include('template/head.php'); ?>

<?php include('template/body.html') ?>

<div class="row">
    <div class="col-lg-10">
        <h1>Consent Form</h1>
    </div>
</div>
<hr class="featurette-divider" style="margin-top:0px;margin-bottom:10px;">
<div class="row">
    <div class="col-lg-2">
        <p><b>Project Title:</b></p>
    </div>
    <div class="col-lg-8">
        <p>Example study</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Purpose of the Study:</b></p>
    </div>
    <div class="col-lg-8">
        <p>This research is being conducted by .. at ... The purpose of this project is to give an example consent form.</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Procedures:</b></p>
    </div>
    <div class="col-lg-8">
        <p> 1) You will be asked to complete several short programming tasks.<br />
            2) Immediately after finishing the short programming tasks, you will be given an exit survey.<br />
<br />
            The entire process should take about 5 minutes.
        </p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Potential Risks and Discomforts:</b></p>
    </div>
    <div class="col-lg-8">
        <p>...</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Potential Benefits:</b></p>
    </div>
    <div class="col-lg-8">
        <p>...</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Confidentiality:</b></p>
    </div>
    <div class="col-lg-8">
        <p>...</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Compensation:</b></p>
    </div>
    <div class="col-lg-8">
        <p>You will not compensated for the study.</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Right to Withdraw:</b></p>
    </div>
    <div class="col-lg-8">
        <p>You may choose not to take part at all. If you decide to participate in this research, you may stop participating at any time.  If you decide not to participate in this study or if you stop participating at any time, you will not be penalized or lose any benefits to which you otherwise qualify.</p>
    </div>
</div>
<div class="row">
    <div class="col-lg-2">
        <p><b>Participant Rights:</b></p>
    </div>
    <div class="col-lg-8">
        <p>If you have questions about your rights as a research participant or wish to report a research-related injury, please contact: <br/>
        <br/><b>
        ...
        </b>
        <br/>
        A copy of this consent form (which you should print for your records) can be found <a href="static/ConsentForm.pdf" target="_blank">here</a>.</p>
    </div>
</div>

<form id="consent_form" name="form" role="form" method="post" action="howTo.php?token=<?php echo $token;?>&token2=<?php echo $token2; echo $originParam;?>">
  <hr>
  <div class="form-group">
    <div class="checkbox">
        <label><input type="checkbox" name="age_yes" id="age_yes"> <b>I am age 18 or older.</b></label>
    </div>
    <div class="checkbox">
        <label><input type="checkbox" name="lang_yes"> <b>I am comfortable using the English language to participate in this study.</b></label>
    </div>
    <div class="checkbox">
        <label><input type="checkbox" name="read_yes"> <b>I have read this consent form or had it read to me.</b></label>
    </div>
    <div class="checkbox">
        <label><input type="checkbox" name="cont_yes" id="cont_yes"> <b>I agree to participate in this research and I want to continue with the study.</b></label>
    </div>
  </div>
  <div id="recaptcha" class="g-recaptcha"
    data-sitekey="<?php echo $reCaptchaSiteKey; ?>"
    data-size="invisible"
    data-callback="onReCaptcha"
  ></div>
  <button
    type="submit"
    class="btn btn-default"
    id="submit-btn"
  >Submit</button>
</form>

<hr class="featurette-divider">

<?php include('template/bodyend.html') ?>

<script type="text/javascript">
  $("#consent_form").submit((e) => {
    grecaptcha.execute();
    e.preventDefault();
  });

  function onReCaptcha(resp) {
    console.log(`Got recptcha ${resp}`);
    $("#consent_form")[0].submit();
  }

  $("#form input:checkbox").change(() => {
    let age_yes = $('input:checkbox[name=age_yes]:checked').val();
    let read_yes = $('input:checkbox[name=read_yes]:checked').val();
    let lang_yes = $('input:checkbox[name=lang_yes]:checked').val();
    let cont_yes = $('input:checkbox[name=cont_yes]:checked').val();
    if(age_yes == "on" && read_yes == "on" && lang_yes == "on" && cont_yes == "on"){
      $('#submit-btn').prop('disabled', false);
    } else {
      $('#submit-btn').prop('disabled', true);
    }
  });
</script>
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
</html>
