'use strict'

/**
 * The global object
 * @type {object}
 */
gl.splitbox = {}

/**
 * Add a tab
 * @param {string} tpl
 * @param {*?} params
 * @return jQuery
 */
gl.splitbox.tabAdd = function (tpl, params) {
  var $li = $('<li role="presentation"><a href="#"><span class="text"></span></a></li>').data('params', params)
  $li.attr('data-template', tpl)
  $li.find('a').append(' <span class="glyphicon glyphicon-remove"></span>')
  $('.splitbox-tabs .nav-tabs').append($li)
  gl.splitbox.tabSave()
  return $li
}

/**
 * Tab delete
 * @param {jQuery} $tab
 */
gl.splitbox.tabDelete = function ($tab) {
  if ($tab.hasClass('active')) {
    $('.splitbox').children().html('')
  }
  $tab.remove()
  gl.splitbox.tabSave()
}

/**
 * On tab click
 * @param {jQuery} $tab
 */
gl.splitbox.tabClick = function ($tab) {
  var tabs = $tab.parent().children()
  tabs.removeClass('active')
  $tab.addClass('active')
  gl.tpl.loadInto($tab.attr('data-template') + '-left', '.splitbox .left')
  gl.tpl.loadInto($tab.attr('data-template') + '-right', '.splitbox .right')
  gl.splitbox.tabSave()
}

/**
 * Save current tabs to storage
 */
gl.splitbox.tabSave = function () {
  var tabs = []
  $('.splitbox-tabs li').each(function () {
    tabs.push({
      'template': $(this).attr('data-template'),
      'params': $(this).data('params'),
      'text': $(this).find('.text').text(),
      'active': $(this).hasClass('active')
    })
  })
  gl.storage.set('tabs', tabs)
}

/**
 * Restore tabs from latest save
 */
gl.splitbox.tabRestore = function () {
  var tabs = gl.storage.get('tabs')
  if (tabs) {
    var $ul = $('.splitbox-tabs ul')
    for (var i = 0; i < tabs.length; i++) {
      var row = tabs[i]
      var $li = gl.splitbox.tabAdd(row.template, row.params)
      $li.find('.text').text(row.text).toggleClass('active', row.active)
      if (row.active) {
        $li.trigger('click')
      }
    }
  }
}