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
      $tr.attr('#transfer-entry-' + entry.id)
      $tr.removeClass('boilerplate')
      $tbody.append($tr)
    }
    $tr.attr('data-id', entry.id)
    $tr.find('.id').text(entry.id)
    $tr.find('.server').text(entry.server)
    $tr.find('.server-path').text(entry.serverPath)
    $tr.find('.local-path').text(entry.localPath)
    $tr.find('.local-path').text(entry.localPath)
    $tr.find('.size').text(entry.size)
    $table.trigger('update')
  }

  $tpl.on('contextmenu', 'tbody tr', function (ev) {
    ev.stopPropagation()
    ev.preventDefault()
    $(this).addClass('active')
    gl.showContextmenu($contextmenu, ev)
  }).on('click', function () {
    $tpl.find('tr.active').removeClass('active')
    gl.hideContextmenu()
  })

  $contextmenu.on('click', '.start', function () {
    gl.socket.send('startTransfer')
  })

  $contextmenu.on('click', '.stop', function () {
    gl.socket.send('stopTransfer')
  })

  $contextmenu.on('click', '.remove', function () {
    const $selectedEntries = $tpl.find('tr.active')
    let entries = []
    $selectedEntries.each(function () {
      $(this).remove()
      entries.push($(this).attr('data-id'))
    })
    gl.socket.send('removeFromTransfer', {'entries': entries})
  })

  gl.socket.send('getTransfers', null, function (entries) {
    const $table = $tpl.find('.boilerplate.table-files').clone()
    $table.removeClass('boilerplate')
    $tpl.find('.tab-container').append($table)
    $tpl.find('.tab-container').find('table').tablesorter({
      'sortList': [[0, 0]]
    })
    for (let i in entries) {
      addEntry(entries[i])
    }
    gl.socket.bind(function (message) {
      if (message.action === 'transfer') {
        addEntry(message.message)
      }
    })
  })
})()
