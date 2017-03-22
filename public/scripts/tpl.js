"use strict";

/**
 * Templates
 */
var tpl = {};

/**
 * Load the given view and pass the jquery element to the callback
 * @param {string} name
 * @param {function} callback
 * @return jQuery
 */
tpl.load = function (name, callback) {
    var $tpl = $('<div class="template">');
    $tpl.attr("data-name", name);
    $.get("/tpl/" + name + ".html", function (htmlData) {
        $tpl.append(htmlData);
        lang.replaceInHtml($tpl);
        if (typeof tpl.fn[name] == "function") {
            tpl.fn[name].apply(this, params);
        } else {
            $.getScript("/tpl/" + name + ".frontend.js", function () {

            }).fail(function () {
                callback($tpl);
            });
        }
    });
};

/**
 * All template functions
 * Will be override by the template itself
 * @type {object<string, function>}
 */
tpl.fn = {};