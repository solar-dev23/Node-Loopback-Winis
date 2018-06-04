$(document).ready(function() {
    $("#changepass_form").submit(function(event){
        event.preventDefault();
        $("#form_error").html('');
        $.post('/account/changepass', $("#changepass_form").serialize(), function(res) {
            if (res == '') {
                window.document.location = '/account/logout';
            } else {
                $("#form_error").html(res);
            }
        })
    });
});
