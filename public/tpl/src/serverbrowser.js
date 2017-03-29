'use strict';
(function () {
  const $tpl = $('.template-serverbrowser')
  const tabParams = gl.splitbox.tabActive.data('params')
  const $contextmenu = $tpl.find('.contextmenu')
  const $local = $tpl.children('.local')
  const $localDirectoryInput = $local.find('.input-directory input')
  const $server = $tpl.children('.server')
  const $serverDirectoryInput = $server.find('.input-directory input')

  /**
   * Build the files into the given container
   * @param {string} type
   * @param {jQuery} $container
   * @param {[]} files
   */
  const buildFilelist = function (type, $container, files) {
    $container.html('')
    const $table = $tpl.find('.boilerplate.table-files').clone()
    $table.attr('data-id', type)
    const $tbody = $table.find('tbody')
    $table.removeClass('boilerplate')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const mtime = new Date(file.mtime)
      const $tr = $table.find('tbody .boilerplate').clone()
      $tr.removeClass('boilerplate')
      let icon = (file.isDirectory ? 'directory' : 'file')
      $tr.find('.name').attr('data-sortValue', (file.isDirectory ? 'a' : 'b') + file.filename)
      $tr.find('.name .icon').addClass('icon-' + icon)
      $tr.find('.name .text').text(file.filename)
      $tr.find('.size').text(gl.humanFilesize(file.size))
      $tr.find('.mtime').text(mtime.toLocaleString()).attr('data-sortValue', mtime.getTime())
      $tbody.append($tr)
      $tr.data('file', file)
    }
    $container.append($table)
    $table.find('table').tablesorter({
      textExtraction: function (node) {
        let n = $(node)
        return (n.attr('data-sortValue') || n.text()).toLowerCase()
      },
      'sortList': [[0, 0]]
    })
    $table.on('dblclick', 'tbody tr', function (ev) {
      ev.stopPropagation()
      if (type === 'local') {
        loadLocalDirectory($(this).data('file').path)
      }
      if (type === 'server') {
        loadServerDirectory($(this).data('file').path)
      }
    }).on('dblclick', '.directory-parent', function (ev) {
      ev.stopPropagation()
      if (type === 'local') {
        let v = $localDirectoryInput.val()
        v = v.replace(/\\/g, '/')
        let spl = v.split('/')
        if (spl.length > 1) {
          spl.pop()
          v = spl.join('/')
          if (!v.match(/\//)) {
            v += '/'
          }
          loadLocalDirectory(v)
        }
      }
      if (type === 'server') {
        let v = $serverDirectoryInput.val()
        let spl = v.split('/')
        if (spl.length > 1) {
          spl.pop()
          v = spl.join('/')
          if (!v.length) {
            v = '/'
          }
          loadServerDirectory(v)
        }
      }
    })
  }

  /**
   * Load a local directory
   * @param {string} directory
   */
  const loadLocalDirectory = function (directory) {
    gl.socket.send('getLocalFilelist', {'server': tabParams.server, 'directory': directory}, function (data) {
      if (!data) {
        return
      }
      tabParams.localDirectory = data.currentDirectory
      gl.splitbox.tabSave()
      $localDirectoryInput.val(data.currentDirectory)
      buildFilelist('local', $local.find('.files'), data.files)
    })
  }

  /**
   * Load server directory
   * @param {string} directory
   */
  const loadServerDirectory = function (directory) {
    gl.socket.send('getFtpFilelist', {'server': tabParams.server, 'directory': directory}, function (data) {
      if (!data) {
        return
      }
      tabParams.serverDirectory = data.currentDirectory
      gl.splitbox.tabSave()
      $serverDirectoryInput.val(data.currentDirectory)
      buildFilelist('server', $server.find('.files'), data.files)
    })
  }

  $localDirectoryInput.on('keyup', function (ev) {
    if (ev.keyCode === 13) {
      loadLocalDirectory(this.value)
    }
  })

  $serverDirectoryInput.on('keyup', function (ev) {
    if (ev.keyCode === 13) {
      loadServerDirectory(this.value)
    }
  })

  // bind to listen for some events
  gl.socket.bind(function (message) {
    let func = null
    let currentDir = null
    let update = false
    if (message.action === 'server-directory-update') {
      func = loadServerDirectory
      currentDir = $serverDirectoryInput.val()
    }
    if (message.action === 'local-directory-update') {
      func = loadLocalDirectory
      currentDir = $localDirectoryInput.val()
    }
    if (func) {
      for (let i = 0; i < message.message.messages.length; i++) {
        if (message.message.messages[i].directory === currentDir) {
          update = true
          break
        }
      }
      if (update) func(currentDir)
    }
  })

  $contextmenu.on('click', '.download, .download-queue, .upload, .upload-queue', function (ev) {
    const $currentCm = $(this).closest('.contextmenu')
    const $selectedFiles = $tpl.find('.' + $currentCm.attr('data-id')).find('tr.active')
    let files = []
    $selectedFiles.each(function () {
      files.push($(this).data('file'))
    })
    let filter = null
    if ($currentCm.find('.filter .checkbox').prop('checked')) {
      filter = $currentCm.find('.filter input.filtermask').val().trim()
      if (!filter.length) {
        filter = null
      }
    }
    gl.socket.send('addToTransferQueue', {
      'localDirectory': $localDirectoryInput.val(),
      'serverDirectory': $serverDirectoryInput.val(),
      'files': files,
      'mode': $(this).attr('data-mode'),
      'server': tabParams.server,
      'recursive': true,
      'forceTransfer': $(this).attr('data-forceTransfer') === '1',
      'filter': filter,
      'flat': $currentCm.find('.flat .checkbox').prop('checked') ? '1' : null
    })
  }).on('click', '.remove', function (ev) {
    ev.stopPropagation()
    const $selectedFiles = $tpl.find('.' + $(this).closest('.contextmenu').attr('data-id')).find('tr.active')
    let files = []
    $selectedFiles.each(function () {
      files.push($(this).data('file'))
    })
    const sendObj = {
      'mode': $(this).closest('.contextmenu').attr('data-id'),
      'files': files,
      'server': tabParams.server
    }
    gl.modalConfirm(gl.t('confirm.delete.files'), function (result) {
      if (result === true) {
        gl.socket.send('removeFiles', sendObj, function () {
          if (sendObj.mode === 'local') {
            loadLocalDirectory($localDirectoryInput.val())
          }
          if (sendObj.mode === 'server') {
            loadServerDirectory($serverDirectoryInput.val())
          }
        })
      }
    })
  }).on('click', '.filter, .flat', function (ev) {
    ev.stopPropagation()
  })

  loadServerDirectory(tabParams.serverDirectory || '/')
  loadLocalDirectory(tabParams.localDirectory || '.')
})()
