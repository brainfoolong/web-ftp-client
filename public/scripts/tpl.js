"use strict";

/**
 * Templates
 */
var tpl = {};

/**
 * The template cache
 * @type {object<string, string>}
 * @private
 */
tpl._cache = {};

/**
 * Reload a template for the given name
 * @param {string} name
 * @param {function=} callback
 * @return jQuery
 */
tpl.reload = function (name, callback) {
    tpl.reloadContainer($(".template").filter("[data-name='" + name + "']"), callback);
};

/**
 * Reload a template for the given container
 * @param {jQuery} container
 * @param {function=} callback
 * @return jQuery
 */
tpl.reloadContainer = function (container, callback) {
    tpl.loadInto(container.attr("data-name"), container, callback);
};

/**
 * Load the given tpl into given container and pass the jquery element to the callback
 * @param {string} name
 * @param {string|jQuery} container
 * @param {function=} callback
 * @return jQuery
 */
tpl.loadInto = function (name, container, callback) {
    tpl.load(name, function ($tpl) {
        $(container).html($tpl);
        if (callback) callback($tpl);
    })
};

/**
 * Load the given view and pass the jquery element to the callback
 * @param {string} name
 * @param {function=} callback
 * @return jQuery
 */
tpl.load = function (name, callback) {
    var $tpl = $('<div class="template">');
    $tpl.attr("data-name", name);
    $tpl.addClass("template-" + name);
    var cb = function (htmlData) {
        $tpl.append(htmlData);
        lang.replaceInHtml($tpl);
        if (callback) callback($tpl);
        // load the script to that
        $.getScript("/tpl/" + name + ".js");
    };
    $.get("/tpl/" + name + ".html", function (htmlData) {
        cb(htmlData);
    });
};