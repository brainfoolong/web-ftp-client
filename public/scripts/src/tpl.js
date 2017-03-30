'use strict'

/**
 * Templates
 * @type {object}
 */
gl.tpl = {}

/**
 * Reload a template for the given name
 * @param {string} name
 * @param {function=} callback
 * @return jQuery
 */
gl.tpl.reload = function (name, callback) {
  gl.tpl.reloadContainer($('.template').filter('[data-name=\'' + name + '\']'), callback)
}

/**
 * Reload a template for the given container
 * @param {jQuery} container
 * @param {function=} callback
 * @return jQuery
 */
gl.tpl.reloadContainer = function (container, callback) {
  gl.tpl.loadInto(container.attr('data-name'), container, callback)
}

/**
 * Load the given tpl into given container and pass the jquery element to the callback
 * @param {string} name
 * @param {string|jQuery} container
 * @param {function=} callback
 * @return jQuery
 */
gl.tpl.loadInto = function (name, container, callback) {
  gl.tpl.load(name, function ($tpl) {
    if (!gl.userData || !gl.userData.admin) {
      $tpl.find('.require-admin').remove()
    }
    $(container).html($tpl)
    if (callback) callback($tpl)
  })
}

/**
 * Load the given view and pass the jquery element to the callback
 * @param {string} name
 * @param {function=} callback
 * @return jQuery
 */
gl.tpl.load = function (name, callback) {
  const $tpl = $('<div class="template">')
  $tpl.attr('data-name', name)
  $tpl.addClass('template-' + name)
  const cb = function (htmlData) {
    $tpl.append(htmlData)
    gl.lang.replaceInHtml($tpl)
    if (callback) callback($tpl)
    // load the script to that
    $.getScript('/tpl/dist/' + name + '.js')
  }
  $.get('/tpl/' + name + '.html', function (htmlData) {
    cb(htmlData)
  })
}
