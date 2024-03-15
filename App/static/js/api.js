let api = (function () {
    "use strict";
    
    function send(method, url, data, callback) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    let module = {};

    module.status = function () {
        return document.cookie.replace(/(?:(?:^|.*;\s*)_id\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    };

    module.email_send = function (email, callback) {
        send("POST", "/users/send_verify_code/", { email }, callback);
    };

    module.signup = function (email, code, password, callback) {
        send("POST", "/users/signup/", { email, code, password }, callback);
    };

    module.login = function (email, password, callback) {
        send("POST", "/users/login/", { email, password }, callback);
    };

    module.add_new_reminder = function (text, repeat, datetime, callback) {
        send("POST", "/main/reminder/", { text, repeat, datetime }, callback);
    };

    module.get_reminder = function (callback) {
        send("GET", "/main/reminder/", {}, callback);
    };

    module.delete_reminder = function (id, callback) {
        send("DELETE", "/main/reminder/" + id + "/", null, callback);
    };

    return module;
}());