'use strict';
(function () {
  const $tpl = $('.template-transfer')
  const $footer = $tpl.find('.footer')
  const $contextmenu = $tpl.find('.contextmenu')

  const addEntry = function (entry, updateTable) {
    const $table = $tpl.find('.tab-container.status-' + entry.status).find('table')
    const $tbody = $table.find('tbody')
    let $tr = $('#transfer-entry-' + entry.id)
    if (!$tr.length) {
      $tr = $table.find('tbody tr.boilerplate').clone()
      $tr.attr('id', 'transfer-entry-' + entry.id)
      $tr.removeClass('boilerplate')
      $tbody.append($tr)
    }
    $tr.data('entry', entry)
    $tr.attr('data-id', entry.id)
    $tr.find('.id').text(entry.id)
    $tr.find('.server').text(entry.serverName)
    $tr.find('.mode').text(gl.t('mode.' + entry.mode))
    $tr.find('.server-path').text(entry.serverPath)
    $tr.find('.local-path').text(entry.localPath)
    $tr.find('.size').text(gl.humanFilesize(entry.size))
    if (updateTable) {
      $table.trigger('update')
      updateEntryCounter()
    }
  }

  const updateEntryCounter = function () {
    $tpl.find('table').each(function () {
      let $tabContainer = $(this).closest('.tab-container')
      let $tab = $tpl.find('.tab').filter('[data-id=\'' + $tabContainer.attr('data-id') + '\']')
      const $trs = $(this).find('tbody').children().not('.boilerplate')
      $tab.find('.counter').text('(' + $trs.length + ')')
      if ($(this).closest('.tab-container').attr('data-id') === 'transfer.queue') {
        let size = 0
        $tpl.find('.tab-container').filter('.status-queue, .status-transfering').find('tbody tr').not('.boilerplate').each(function () {
          size += $(this).data('entry').size
        })
        $footer.find('.total-size .number').text(gl.humanFilesize(size))
      }
    })
    updateTransferSpeed()
  }

  const loadTransfers = function (callback) {
    gl.socket.send('getTransfers', null, function (entries) {
      const $tableBoiler = $tpl.find('.boilerplate.table-files').clone()
      $tableBoiler.removeClass('boilerplate')
      $tpl.find('.tab-container.transfers').html($tableBoiler)
      let entryKeys = Object.keys(entries)
      const createEntriesHtml = function () {
        for (let i = 0; i < 30; i++) {
          if (!entryKeys.length) break
          let k = entryKeys.shift()
          addEntry(entries[k])
        }
        if (entryKeys.length) {
          setTimeout(createEntriesHtml, 50)
        }
        updateEntryCounter()
      }
      createEntriesHtml()
      $tpl.find('.tab-container').find('table').tablesorter({
        textExtraction: function (node) {
          let n = $(node)
          return (n.attr('data-sortvalue') || n.text()).toLowerCase()
        }
      }).on('sortEnd', function () {
        let $table = $(this).closest('table')
        if ($table.hasClass('status-queue')) {

        }
      })
      if (callback) callback()
    })
  }

  $contextmenu.on('click', '.start', function () {
    gl.socket.send('startTransfer')
  })

  $contextmenu.on('click', '.stop', function () {
    gl.socket.send('stopTransfer', null, function () {
      loadTransfers()
    })
  })

  $contextmenu.on('click', '.remove, .move', function () {
    const $selectedEntries = $tpl.find('tr.active')
    let entries = []
    $selectedEntries.each(function () {
      entries.push($(this).attr('data-id'))
    })
    updateEntryCounter()
    gl.socket.send($(this).attr('data-action'), {'entries': entries})
  })

  const updateTransferSpeed = function () {
    const $trs = $tpl.find('.tab-container.status-transfering').find('tbody tr').not('.boilerplate')
    let currentTransferSpeed = 0
    $trs.each(function () {
      currentTransferSpeed += $(this).data('speed') || 0
    })
    $tpl.find('.transfer-speed .number').text(gl.humanFilesize(currentTransferSpeed) + '/s')
  }

  loadTransfers(function () {
    gl.socket.bind(function (message) {
      if (message.action === 'transfer-add-bulk') {
        if (message.message.messages) {
          for (let i = 0; i < message.message.messages.length; i++) {
            for (let j = 0; j < message.message.messages[i].length; j++) {
              addEntry(message.message.messages[i][j])
            }
          }
          updateEntryCounter()
        }
      }
      if (message.action === 'transfer-status-update') {
        for (let i = 0; i < message.message.messages.length; i++) {
          const $entry = $('#transfer-entry-' + message.message.messages[i].id)
          $tpl.find('.tab-container.status-' + message.message.messages[i].status).find('tbody').append($entry)
        }
        $('.table-files').trigger('update', [true])
        updateEntryCounter()
      }
      if (message.action === 'transfer-removed') {
        const entries = message.message.messages
        if (entries) {
          for (let i = 0; i < entries.length; i++) {
            for (let j = 0; j < entries[i].length; j++) {
              $('#transfer-entry-' + entries[i][j]).remove()
            }
          }
        }
        updateEntryCounter()
      }
      if (message.action === 'transfer-progress') {
        const files = message.message.messages
        if (files) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const entry = $('#transfer-entry-' + file.id)
            const percent = 100 / file.filesize * file.transfered
            entry.data('speed', file.speedAverage)
            entry.data('transfered', file.transfered)
            entry.attr('data-sortvalue', percent)
            entry.find('.text').text(parseInt(percent) + '%')
            entry.find('.progress-bar-info').css('width', percent + '%')
          }
        }
        updateTransferSpeed()
      }
    })
  })
  updateTransferSpeed()
})()
