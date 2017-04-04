'use strict'

/**
 * Translations
 * @type {object}
 */
gl.lang = {}

/**
 * The translation values
 * @type {object.<string, object<string, string>>}
 */
gl.lang.values = {}

/**
 * The current language, default to en
 * @type {string}
 */
gl.lang.language = gl.storage.get('language') || null

/**
 * Alias for gl.lang.get
 * @param {string} key
 * @param {object=} params
 * @param {boolean=} wrapParamsWithSpans
 * @return {string}
 */
gl.t = function (key, params, wrapParamsWithSpans) {
  return gl.lang.get(key, params, wrapParamsWithSpans)
}

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @param {boolean=} wrapParamsWithSpans
 * @return {string}
 */
gl.lang.get = function (key, params, wrapParamsWithSpans) {
  let v = key
  let l = gl.lang.language
  if (l === null) {
    l = gl.lang.language
  }
  if (typeof gl.lang.values[l] !== 'undefined' && typeof gl.lang.values[l][key] !== 'undefined' && gl.lang.values[l][key] !== null) {
    v = gl.lang.values[l][key]
  } else if (typeof gl.lang.values['en'] !== 'undefined' && typeof gl.lang.values['en'][key] !== 'undefined') {
    v = gl.lang.values['en'][key]
  }
  if (typeof params !== 'undefined') {
    for (let i in params) {
      if (params.hasOwnProperty(i)) {
        v = v.replace(new RegExp('{' + i + '}', 'ig'), wrapParamsWithSpans ? '<span class="param param-' + i + '">' + params[i] + '</span>' : params[i])
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
    let s = $(this).attr('data-translate-property').split(',')
    while (s.length >= 2) {
      $(this).attr(s.shift(), get(s.shift()))
    }
  })
  elements.removeAttr('data-translate-property')
}

/**
 * Set language by navigation language, also return the most appropriate language
 * @returns {string|null}
 */
gl.lang.setLanguageByNavigator = function () {
  if (navigator.languages) {
    for (let i = 0; i < navigator.languages.length; i++) {
      const l = navigator.languages[i]
      if (typeof gl.lang.values[l] !== 'undefined') {
        gl.lang.language = l
        return l
      }
    }
  }
  return null
}
