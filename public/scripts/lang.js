"use strict";
/**
 * Translations
 */

var lang = {};

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
lang.get = function (key, params) {
    var v = key;
    if (typeof lang.values[lang.language] != "undefined" && typeof lang.values[lang.language][key] != "undefined") {
        v = lang.values[lang.language][key];
    } else if (typeof lang.values["en"] != "undefined" && typeof lang.values["en"][key] != "undefined") {
        v = lang.values["en"][key];
    }
    if (typeof params != "undefined") {
        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                v = v.replace(new RegExp("{" + i + "}", "ig"), params[i]);
            }
        }
    }
    return v;
};

/**
 * Replace all placeholders in html with proper translation values
 * @param {JQuery} el The element to replace values in
 */
lang.replaceInHtml = function (el) {
    var get = lang.get;
    var elements = el.find("[data-translate]");
    elements.each(function () {
        $(this).html(get($(this).attr("data-translate")));
    });
    elements.removeAttr("data-translate");
    elements = el.find("[data-translate-property]");
    elements.each(function () {
        var s = $(this).attr("data-translate-property").split(",");
        $(this).attr(s[0], get(s[1]));
    });
    elements.removeAttr("data-translate-property");
};

/**
 * The translation values
 * @type {object.<string, object<string, string>>}
 */
lang.values = {"en": {}, "de": {}};

// en values
lang.values.en = {

};

// de values
lang.values.de = {};

/**
 * The current language, default to en
 * @type {string}
 */
lang.language = "en";

// check for a other supported language depending on the users defined languages
if (navigator.languages) {
    (function () {
        for (var i = 0; i < navigator.languages.length; i++) {
            var l = navigator.languages[i];
            if (typeof lang.values[l] != "undefined") {
                lang.language = l;
                break;
            }
        }
    })();
}