'use strict'

/**
 * The global object
 * @type {object}
 */
const gl = {}

/**
 * The userdata of the current session
 * @type {object|null}
 */
gl.userData = null

/**
 * Show/Hide loading indicator
 * @param {boolean} flag
 */
gl.loading = function (flag) {
  $('.loader').toggleClass('hidden', !flag)
}

/**
 * Show a note message on top
 * @param {string} message
 * @param {string=} type
 * @param {number=} delay
 */
gl.note = function (message, type, delay) {
  if (delay === -1) delay = 99999999
  $.notify({
    'message': gl.t(message)
  }, {
    'type': typeof type === 'undefined' ? 'info' : type,
    placement: {
      from: 'top',
      align: 'center'
    },
    'delay': delay || 5000
  })
}

/**
 * Show modal window
 * @param {string|jQuery|null} header
 * @param {string|jQuery|null} body
 * @param {string|jQuery|null} footer
 * @param {function} closeCallback
 */
gl.modal = function (header, body, footer, closeCallback) {
  gl.modalClose()
  gl.tpl.load('modal', function ($tpl) {
    const $header = $tpl.find('.modal-own-header')
    const $body = $tpl.find('.modal-own-body')
    const $footer = $tpl.find('.modal-own-footer')
    if (header === null) {
      $header.remove()
    } else {
      $header.html(header)
    }
    if (body === null) {
      $body.remove()
    } else {
      $body.html(body)
    }
    if (footer === null) {
      $footer.remove()
    } else {
      $footer.html(footer)
    }
    gl.lang.replaceInHtml($tpl)
    $('body').append($tpl)
    $tpl.on('close', function () {
      if (closeCallback) closeCallback()
      $(this).remove()
    })
  })
}

/**
 * Display a modal that the user can confirm or decline
 * @param {string|jQuery} body
 * @param {function} callback
 */
gl.modalConfirm = function (body, callback) {
  const $footer = $('<div>')
  $footer
    .append('<span class="btn btn-info accept btn-accept" data-translate="modal.confirm.accept"></span>')
    .append('<span class="btn btn-primary cancel" data-translate="modal.confirm.cancel"></span>')
  $footer.find('.accept').on('click', function () {
    callback(true)
    gl.modalClose()
  })
  $footer.find('.cancel').on('click', function () {
    callback(false)
    gl.modalClose()
  })
  gl.modal(gl.t('modal.confirm.header'), body, $footer, function () {
    callback(false)
  })
}

/**
 * Close all modal windows
 */
gl.modalClose = function () {
  $('.modal-own-close').trigger('click')
}

/**
 * Get depth object value, write like foo[bar][etc]
 * @param {object} object
 * @param {string} key
 * @returns {*|undefined}
 */
gl.getObjectValue = function (object, key) {
  const spl = key.split('[')
  let o = object
  for (let i = 0; i < spl.length; i++) {
    const keySplit = spl[i].replace(/\]$/g, '')
    if (typeof o[keySplit] === 'undefined') return undefined
    o = o[keySplit]
  }
  return o
}

/**
 * Hide all contextmenus
 */
gl.hideContextmenu = function () {
  $('.contextmenu').removeClass('show')
}

/**
 * Show contextmenu at given position
 * @param {jQuery} $container
 * @param {event} ev
 */
gl.showContextmenu = function ($container, ev) {
  gl.hideContextmenu()
  $container.addClass('show')
  $container.offset({
    left: ev.pageX,
    top: ev.pageY
  })
  const ww = $(window).width()
  const wh = $(window).height()
  $container.removeClass('stick-right stick-bottom')
  if (ev.pageX + $container.outerWidth() > ww) {
    $container.addClass('stick-right')
  }
  if (ev.pageY + $container.outerHeight() > wh) {
    $container.addClass('stick-bottom')
  }
}

/**
 * Get a human filesize
 * @param {number} bytes
 * @returns {string}
 */
gl.humanFilesize = function (bytes) {
  let map = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (bytes > 1024) {
    bytes /= 1024
    i++
  }
  if (i === 0) {
    return bytes + map[i]
  }
  return bytes.toFixed(2) + map[i]
}

/**
 * Load the given theme
 * @param {string} mode light/dark
 */
gl.loadTheme = function (mode) {
  gl.storage.set('theme', mode)
  const file = mode !== 'dark' ? 'sandstone' : 'slate'
  $('#theme-bootswatch').remove()
  $('#theme-colors').remove()
  $('head')
    .append('<link id="theme-colors" rel="stylesheet" type="text/css" href="stylesheets/dist/colors-' + mode + '.css">')
    .append('<link id="theme-bootswatch" rel="stylesheet" type="text/css" href="stylesheets/lib/' + file + '/bootstrap.min.css">')
}

/**
 * Initialize all textarea autoheights
 * @param {JQuery} container
 */
gl.textareaAutoheight = function (container) {
  container.find('textarea.autoheight').each(function () {
    this.setAttribute('style', 'height:' + (Math.max(20, this.scrollHeight)) + 'px;overflow-y:hidden;')
  }).addClass('autoheight-activated').off('input.ah focus.ah').on('input.ah focus.ah', function () {
    this.style.height = 'auto'
    this.style.height = (Math.max(20, this.scrollHeight)) + 'px'
  }).triggerHandler('input')
}

// on document ready
$(function () {
  if (gl.lang.language === null) {
    gl.lang.setLanguageByNavigator()
  }

  if (typeof window.WebSocket === 'undefined') {
    gl.note('Your browser is not supported in this application (Outdated Browser). Please upgrade to the newest version')
    return
  }

  // add flag class for touch support
  const $body = $('body')
  const hasTouch = ('ontouchstart' in window || (typeof window.DocumentTouch !== 'undefined' && document instanceof window.DocumentTouch)) === true
  $body.addClass(hasTouch ? 'no-touch' : 'touch')

  // bind tooltips
  $(document).tooltip({
    'selector': '[data-tooltip]',
    'container': 'body',
    'placement': 'auto',
    'html': true,
    'title': function () {
      return gl.t($(this).attr('data-tooltip'))
    }
  }).on('inserted.bs.tooltip', function (ev) {
    // hide if we are on mobile touch device
    if (hasTouch) {
      setTimeout(function () {
        $(ev.target).trigger('mouseout')
      }, 1000)
    }
  })

  // replace language html placeholders
  gl.lang.replaceInHtml($body)

  // tab click handler
  $(document).on('click', '.tabs .tab[data-id]', function () {
    let $container = $('.tab-container').filter('[data-id=\'' + $(this).attr('data-id') + '\']')
    $(this).parent().children().removeClass('active')
    $(this).addClass('active')
    $container.parent().children('.tab-container.active').removeClass('active')
    $container.addClass('active')
  })

  // template load trigger
  $(document).on('click', '.template-load-trigger[data-template]', function () {
    gl.tpl.loadInto($(this).attr('data-template'), $(this).attr('data-container'))
  })

  // splitbox tab delete trigger
  $(document).on('click', '.splitbox-tabs .glyphicon-remove', function (ev) {
    ev.stopPropagation()
    gl.splitbox.tabDelete($(this).closest('.tab'))
  })

  // splitbox tab load trigger
  $(document).on('click', '.splitbox-tab-load-trigger[data-template]', function () {
    gl.splitbox.tabAdd($(this).attr('data-template'), {}, $(this).attr('data-translate-tab')).trigger('click')
    gl.splitbox.tabSave()
  })

  // splitbox tab click trigger
  $(document).on('click', '.splitbox-tabs .tab', function (ev) {
    ev.preventDefault()
    gl.splitbox.tabLoad($(this))
    gl.splitbox.tabSave()
  })

  // close contextmenu after click somewhere in the page
  // if you want to prevent this, use preventPropagation and to upper event
  $(document).on('click', function () {
    gl.hideContextmenu()
    gl.modalClose()
    $('tr.active').removeClass('active')
  })

  $(document).on('keydown', function (ev) {
    // table select all files with shortcut ctrl+a
    if (ev.ctrlKey && ev.keyCode === 65 && !$(ev.target).is(':input')) {
      $('.table-files').find('tr.active').closest('table').each(function () {
        $(this).find('tbody tr').not('.boilerplate').addClass('active')
      })
      ev.preventDefault()
    }
    // del key - trigger remove in the contextmenu
    if (ev.keyCode === 46) {
      $('.table-files').find('tr.active').closest('.table-files').each(function () {
        $('.contextmenu').filter('[data-id="' + $(this).attr('data-id') + '"]').find('.remove').trigger('click')
      })
    }
    // esc key - close and deselect everything
    if (ev.keyCode === 27) {
      $(document).trigger('click')
    }
  })

  // table of files selection
  $(document).on('click', '.table-files tbody tr', function (ev) {
    ev.stopPropagation()
    const $table = $(this).closest('table')
    let selection = [this, this]
    let $trs = $table.find('tbody tr')
    if (ev.shiftKey) {
      selection[1] = $trs.filter('.active').first()[0]
    }
    $('.table-files').find('tr.active').removeClass('active')
    let $selection = $trs.filter(selection)
    if ($selection.length === 1) {
      $selection.addClass('active')
    } else {
      $selection.first().nextUntil($selection.last()).addBack().add($selection.last()).addClass('active')
    }
  })

  // table of files contextmenu
  $(document).on('contextmenu', '.table-files tbody tr', function (ev) {
    ev.stopPropagation()
    if (!$(this).hasClass('active')) {
      $(this).parent().children('.active').removeClass('active')
    }
    $(this).addClass('active')
    ev.preventDefault()
    gl.showContextmenu($('.contextmenu').filter('[data-id=\'' + $(this).closest('.table-files').attr('data-id') + '\']'), ev)
  })

  // socket connection
  gl.socket.connect(function () {
    gl.socket.send('initializeFrontend', {
      'loginData': {
        'id': gl.storage.get('login.id'),
        'hash': gl.storage.get('login.hash')
      }
    }, function (data) {
      if (!data) {
        gl.tpl.loadInto('login', '#wrapper', function () {
          gl.loading(false)
        })
      } else {
        gl.userData = data
        gl.tpl.loadInto('main', '#wrapper', function () {
          gl.loading(false)
        })
      }
    })
  })
})
