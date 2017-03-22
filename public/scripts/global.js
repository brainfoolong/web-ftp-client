"use strict";

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
function t(key, params) {
    return lang.get(key, params)
}

/**
 * Show/Hide loading indicator
 * @param {boolean} flag
 */
function loading(flag) {
    $(".loader").toggleClass("hidden", !flag);
}

/**
 * Show a note message on top
 * @param {string} message
 * @param {string=} type
 * @param {number=} delay
 */
function note(message, type, delay) {
    if (delay === -1) delay = 99999999;
    $.notify({
        "message": t(message)
    }, {
        "type": typeof type == "undefined" ? "info" : type,
        placement: {
            from: "top",
            align: "center"
        },
        "delay": delay || 5000,
    });
}

/**
 * Get depth object value, write like foo[bar][etc]
 * @param {object} object
 * @param {string} key
 * @returns {*|undefined}
 */
function getObjectValue(object, key) {
    var spl = key.split("[");
    var o = object;
    for (var i = 0; i < spl.length; i++) {
        var keySplit = spl[i].replace(/\]$/g, "");
        if (typeof o[keySplit] == "undefined") return undefined;
        o = o[keySplit];
    }
    return o;
}

$(function () {
    if (typeof WebSocket == "undefined") {
        note("Your browser is not supported in this application (Outdated Browser). Please upgrade to the newest version");
        return;
    }
    var body = $("body");
    var hasTouch = true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    body.addClass(hasTouch ? "no-touch" : "touch");
    // bind tooltips
    $(document).tooltip({
        "selector": '[data-tooltip]',
        "container": "body",
        "html": true,
        "title": function () {
            return t($(this).attr("data-tooltip"));
        }
    }).on("inserted.bs.tooltip", function (ev) {
        // hide if we are on mobile touch device
        if (hasTouch) {
            setTimeout(function () {
                $(ev.target).trigger("mouseout");
            }, 1000);
        }
    });
    lang.replaceInHtml(body);
    socket.connect(function () {
        tpl.loadInto("main", "#wrapper", function () {
            loading(false);
        });
    });
});