"use strict";
(function () {
    var $box = $(".template-login .box");
    socket.send("getSystemStatus", null, function (data) {
        if (!data.installed) {
            $box.find(".well").toggleClass("hidden");
        }
    });
    var $form = Form.create($box.children(".form"), "login", {
        "username": {"type": "text", "label": "Username", "required": true},
        "password": {"type": "password", "label": "Password", "required": true},
        "remember": {"type": "switch", "label": "Remember"}
    }, function (formData) {
        socket.send("loginFormSubmit", formData, function (userData) {
            if (!userData) {
                note("Login failed", "danger");
            } else {
                storage.set("login.id", userData.id, !formData.remember);
                storage.set("login.hash", userData.loginHash, !formData.remember);
                note("Login successfull", "success");
                tpl.loadInto("main", "#wrapper");
            }
        });
    });
    $form.find(".submit-form").text("Login");
})();
