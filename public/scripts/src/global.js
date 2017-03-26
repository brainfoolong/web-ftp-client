'use strict'

/**
 * The global object
 * @type {object}
 */
const gl = {}

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

// on document ready
$(function () {
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
  $(document).on('click', function (ev) {
    gl.hideContextmenu()
  })

  $(document).on('keydown', function (ev) {
    // table select all files with shortcut ctrl+a
    if (ev.ctrlKey && ev.keyCode === 65) {
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
      gl.hideContextmenu()
      $('tr.active').removeClass('active')
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
        gl.tpl.loadInto('main', '#wrapper', function () {
          gl.loading(false)
        })
      }
    })
  })
})
