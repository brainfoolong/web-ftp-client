'use strict'

/**
 * The splitbox
 * @type {object}
 */
gl.splitbox = {}

/**
 * The current active tab
 * @type {null|jQuery}
 */
gl.splitbox.tabActive = null

/**
 * Add a tab
 * @param {string} tpl
 * @param {*?} params
 * @param {string} label
 * @return jQuery
 */
gl.splitbox.tabAdd = function (tpl, params, label) {
  // check if we already have opened such a tab
  let found = false
  $('.splitbox-tabs.tabs .tab').each(function () {
    if ($(this).attr('data-template') === tpl) {
      if (tpl === 'serverbrowser') {
        if ($(this).data('params').server === params.server) {
          found = $(this)
          return false
        }
      } else {
        found = $(this)
        return false
      }
    }
  })
  if (found) {
    gl.splitbox.tabLoad(found)
    return found
  }
  const $li = $('<div class="tab"><span class="text"></span></li>')
  $li.attr('data-template', tpl)
  $li.append(' <span class="glyphicon glyphicon-remove"></span>')
  $li.find('.text').text(gl.t(label))
  $('.splitbox-tabs.tabs').append($li)
  $li.data('params', params)
  return $li
}

/**
 * Tab delete
 * @param {jQuery} $tab
 */
gl.splitbox.tabDelete = function ($tab) {
  const disconnect = function () {
    gl.socket.send('disconnectFtpServer', {'server': $tab.data('params').server})
    gl.modalClose()
  }
  const remove = function () {
    if ($tab.hasClass('active')) {
      $('.splitbox').children().html('')
    }
    $tab.remove()
    gl.splitbox.tabSave()
    gl.modalClose()
  }
  if ($tab.attr('data-template') === 'serverbrowser') {
    const $footer = $('<div>')
    $footer.append('<div class="btn btn-info remove" data-translate="tab.close.remove"></div>')
    $footer.append('<div class="btn btn-info disconnect" data-translate="tab.close.disconnect"></div>')
    $footer.on('click', '.disconnect', function () {
      disconnect()
    }).on('click', '.remove', function () {
      disconnect()
      remove()
    })
    gl.modal(null, gl.t('tab.close.info'), $footer, function () {

    })
  } else {
    remove()
  }
}

/**
 * On tab click
 * @param {jQuery} $tab
 */
gl.splitbox.tabLoad = function ($tab) {
  if (gl.splitbox.tabActive) {
    gl.splitbox.tabActive.removeClass('active')
  }
  gl.splitbox.tabActive = $tab
  $tab.addClass('active')
  gl.tpl.loadInto($tab.attr('data-template'), '.splitbox', function ($tpl) {
    const $splitLeft = $tpl.find('.left').first()
    $splitLeft.css('flex', '0 0 ' + ($tab.data('params').widthLeft || 50) + '%')

    // make center draggable
    $tpl.find('.center').first().draggable({
      'axis': 'x',
      'stop': function (ev, ui) {
        const left = 100 / $(window).width() * $(this).offset().left
        let params = gl.splitbox.tabActive.data('params')
        params.widthLeft = left
        gl.splitbox.tabSave()
        gl.splitbox.tabReload()
        $(this).removeAttr('style')
      }
    })
  })
}

/**
 * Save current tabs to storage
 */
gl.splitbox.tabSave = function () {
  const tabs = []
  $('.splitbox-tabs .tab').each(function () {
    tabs.push({
      'template': $(this).attr('data-template'),
      'params': $(this).data('params'),
      'text': $(this).find('.text').text(),
      'active': $(this).hasClass('active')
    })
  })
  gl.socket.send('saveSplitboxTabs', tabs)
}

/**
 * Restore tabs from latest save
 */
gl.splitbox.tabRestore = function () {
  gl.socket.send('getSplitboxTabs', null, function (tabs) {
    if (tabs) {
      for (let i = 0; i < tabs.length; i++) {
        const row = tabs[i]
        const $li = gl.splitbox.tabAdd(row.template, row.params, row.text)
        $li.toggleClass('active', row.active)
        if (row.active) {
          gl.splitbox.tabLoad($li)
        }
      }
    }
  })
}

/**
 * Reload current active tab
 */
gl.splitbox.tabReload = function () {
  gl.splitbox.tabLoad($('.splitbox-tabs .active'))
}
