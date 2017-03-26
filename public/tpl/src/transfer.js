'use strict';
(function () {
  const $tpl = $('.template-transfer').parent()
  const $contextmenu = $tpl.find('.contextmenu')

  const addEntry = function (entry) {
    const $table = $tpl.find('.tab-container.status-' + entry.status).find('table')
    const $tbody = $table.find('tbody')
    let $tr = $('#transfer-entry-' + entry.id)
    if (!$tr.length) {
      $tr = $table.find('tbody tr.boilerplate').clone()
      $tr.attr('id', 'transfer-entry-' + entry.id)
      $tr.removeClass('boilerplate')
      $tbody.append($tr)
    }
    $tr.attr('data-id', entry.id)
    $tr.find('.id').text(entry.id)
    $tr.find('.server').text(entry.server)
    $tr.find('.server-path').text(entry.serverPath)
    $tr.find('.local-path').text(entry.localPath)
    $tr.find('.local-path').text(entry.localPath)
    $tr.find('.size').text(gl.humanFilesize(entry.size))
    $table.trigger('update')
    updateEntryCounter()
  }

  const updateEntryCounter = function () {
    $tpl.find('table').each(function () {
      let $tabContainer = $(this).closest('.tab-container')
      let $tab = $tpl.find('.tab').filter('[data-id=\'' + $tabContainer.attr('data-id') + '\']')
      $tab.find('.counter').text('(' + ($(this).find('tbody tr').length - 1) + ')')
    })
  }

  const loadTransfers = function (callback) {
    gl.socket.send('getTransfers', null, function (entries) {
      const $tableBoiler = $tpl.find('.boilerplate.table-files').clone()
      $tableBoiler.removeClass('boilerplate')
      $tpl.find('.tab-container').html($tableBoiler)
      $tpl.find('.tab-container').find('table').tablesorter({
        'sortList': [[0, 0]],
        'sortForce': [[5, 1]]
      }).on('sortEnd', function () {
        let $table = $(this).closest('table')
        if ($table.hasClass('status-queue')) {

        }
      })
      for (let i in entries) {
        addEntry(entries[i])
      }
      if (callback) callback()
    })
  }

  $tpl.on('contextmenu', 'tbody tr', function (ev) {
    ev.stopPropagation()
    ev.preventDefault()
    $(this).addClass('active')
    gl.showContextmenu($contextmenu, ev)
  }).on('click', function () {
    gl.hideContextmenu()
  })

  $contextmenu.on('click', '.start', function () {
    gl.socket.send('startTransfer')
  })

  $contextmenu.on('click', '.stop', function () {
    gl.socket.send('stopTransfer', null, function () {
      loadTransfers()
    })
  })

  $contextmenu.on('click', '.remove', function () {
    const $selectedEntries = $tpl.find('tr.active')
    let entries = []
    $selectedEntries.each(function () {
      $(this).remove()
      entries.push($(this).attr('data-id'))
    })
    updateEntryCounter()
    gl.socket.send('removeFromTransfer', {'entries': entries})
  })

  loadTransfers(function () {
    gl.socket.bind(function (message) {
      if (message.action === 'transfer') {
        addEntry(message.message)
      }
      if (message.action === 'transfer-move') {
        let $entry = $('#transfer-entry-' + message.message.id)
        if ($entry.length) {
          $tpl.find('.tab-container.status-' + message.message.to).find('tbody').append($entry).trigger('update')
          updateEntryCounter()
        }
      }
      if (message.action === 'transfer-progress') {
        let $entry = $('#transfer-entry-' + message.message.id)
        if ($entry.length) {
          const percent = 100 / message.message.filesize * message.message.transfered
          $entry.find('.transfered').find('.text').text(parseInt(percent) + '%')
          $entry.find('.transfered').find('.progress-bar-info').css('width', percent + '%')
        }
      }
      if (message.action === 'transfer-stopped') {
        let $entry = $('#transfer-entry-' + message.message.id)
        if ($entry.length) {
          $entry.find('.transfered').find('.text').text('')
          $entry.find('.transfered').find('.progress-bar-info').css('width', 0)
        }
      }
    })
  })
})()
