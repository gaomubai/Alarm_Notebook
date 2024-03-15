(function(){
    "use strict";

    window.addEventListener('load', function () {
        var status = api.status();
        document.querySelector("#login_window_btn").style.display = (status) ? 'none' : 'block';
        document.querySelector("#sign_up_window_btn").style.display = (status) ? 'none' : 'block';
        document.querySelector("#signout_btn").style.display = (status) ? 'block' : 'none';
        document.querySelector("#main_btn").style.display = (status) ? 'block' : 'none';
    });

    document.querySelector("#login_window_btn").onclick = function() {
        document.querySelector("#login_window").showModal();
    };

    document.querySelector("#sign_up_window_btn").onclick = function() {
        document.querySelector("#sign_up_window").showModal();
    };

    document.querySelector("#email_send_btn").onclick = function () {
        var email = document.querySelector("#sign_up_form [name=e_mail]").value;
        api['email_send'](email, function(err){
            if (err) return onError(err);
            window.location.href = '/';
        });
    }

    document.querySelector("#sign_up_btn").onclick = function () {
        var email = document.querySelector("#sign_up_form [name=e_mail]").value;
        var code = document.querySelector("#sign_up_form [name=verify_code]").value;
        var password = document.querySelector("#sign_up_form [name=password]").value;
        api['signup'](email, code, password, function(err){
            if (err) {
                alert("Error, double check your input");
                return onError(err);
            }
            window.location.href = '/';
        });
    }

    document.querySelector("#login_btn").onclick = function () {
        var email = document.querySelector("#login_form [name=e_mail]").value;
        var password = document.querySelector("#login_form [name=password]").value;
        api['login'](email, password, function (err) {
            if (err) return onError(err);
            window.location.href = '/';
        });
    }

    document.querySelector('form').addEventListener('submit', function(e){
        e.preventDefault();
    });
}())