'use strict';
(function () {
  const $tpl = $('.template-transfer').parent()
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
    $tr.attr('data-id', entry.id)
    $tr.find('.id').text(entry.id)
    $tr.find('.server').text(entry.server)
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
      $tab.find('.counter').text('(' + ($(this).find('tbody')[0].children.length - 1) + ')')
    })
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
        'sortForce': [[5, 1]],
        textExtraction: function (node) {
          let n = $(node)
          return (n.attr('data-sortValue') || n.text()).toLowerCase()
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

  $contextmenu.on('click', '.remove', function () {
    const $selectedEntries = $tpl.find('tr.active')
    let entries = []
    let progressEntries = []
    $selectedEntries.each(function () {
      $(this).remove()
      if ($(this).find('.progress').attr('data-sortValue') !== '0') {
        progressEntries.push($(this).attr('data-id'))
      }
      entries.push($(this).attr('data-id'))
    })
    updateEntryCounter()
    gl.socket.send('removeFromTransfer', {'entries': entries, 'progressEntries': progressEntries})
  })

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
      let $entry = null
      let $transfered = null
      if (message.message && typeof message.message.id !== 'undefined') {
        $entry = $('#transfer-entry-' + message.message.id)
        $transfered = $entry.find('.transfered')
      }
      if ($entry && $entry.length) {
        if (message.action === 'transfer-status-update') {
          $tpl.find('.tab-container.status-' + message.message.status).find('tbody').append($entry).trigger('update', [true])
          updateEntryCounter()
        }
        if (message.action === 'transfer-progress' || message.action === 'transfer-status-update') {
          let percent = -1
          if (message.action === 'transfer-progress') {
            percent = 100 / message.message.filesize * message.message.transfered
          }
          $transfered.attr('data-sortValue', percent)
          $transfered.find('.text').text(percent >= 0 ? parseInt(percent) + '%' : '')
          $transfered.find('.progress-bar-info').css('width', percent >= 0 ? percent + '%' : 0)
          if (message.action !== 'transfer-progress') {
            $entry.closest('table').trigger('update', [true])
          }
        }
      }
    })
  })
})()
