'use strict'

/**
 * Translations
 * @type {object}
 */
gl.lang = {}

/**
 * Alias for gl.lang.get
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
gl.t = function (key, params) {
  return gl.lang.get(key, params)
}

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
gl.lang.get = function (key, params) {
  let v = key
  if (typeof gl.lang.values[gl.lang.language] !== 'undefined' && typeof gl.lang.values[gl.lang.language][key] !== 'undefined') {
    v = gl.lang.values[gl.lang.language][key]
  } else if (typeof gl.lang.values['en'] !== 'undefined' && typeof gl.lang.values['en'][key] !== 'undefined') {
    v = gl.lang.values['en'][key]
  }
  if (typeof params !== 'undefined') {
    for (let i in params) {
      if (params.hasOwnProperty(i)) {
        v = v.replace(new RegExp('{' + i + '}', 'ig'), params[i])
      }
    }
  }
  return v
}

/**
 * Replace all placeholders in html with proper translation values
 * @param {jQuery} el The element to replace values in
 */
gl.lang.replaceInHtml = function (el) {
  const get = gl.lang.get
  let elements = el.find('[data-translate]')
  elements.each(function () {
    $(this).html(get($(this).attr('data-translate')))
  })
  elements.removeAttr('data-translate')
  elements = el.find('[data-translate-property]')
  elements.each(function () {
    const s = $(this).attr('data-translate-property').split(',')
    $(this).attr(s[0], get(s[1]))
  })
  elements.removeAttr('data-translate-property')
}

/**
 * The translation values
 * @type {object.<string, object<string, string>>}
 */
gl.lang.values = {}

/**
 * The current language, default to en
 * @type {string}
 */
gl.lang.language = 'en'

// check for a other supported language depending on the users defined languages
if (navigator.languages) {
  (function () {
    for (let i = 0; i < navigator.languages.length; i++) {
      const l = navigator.languages[i]
      if (typeof gl.lang.values[l] !== 'undefined') {
        gl.lang.language = l
        break
      }
    }
  })()
}
