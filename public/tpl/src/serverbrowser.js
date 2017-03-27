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
      const mtime = new Date(file.attrs.mtime)
      const $tr = $table.find('tbody .boilerplate').clone()
      $tr.removeClass('boilerplate')
      let icon = (file.directory ? 'directory' : 'file')
      $tr.find('.name').attr('data-sortValue', (file.directory ? 'a' : 'b') + file.filename)
      $tr.find('.name .icon').addClass('icon-' + icon)
      $tr.find('.name .text').text(file.filename)
      $tr.find('.size').text(gl.humanFilesize(file.attrs.size))
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

  // expose those function to be used from another tpl
  $tpl.on('reloadServerDirectory', function (ev, data) {
    loadServerDirectory($serverDirectoryInput.val())
  })
  $tpl.on('reloadLocalDirectory', function (ev, data) {
    // only reload if current directory is the same as the passed one
    if (data && data.localDirectory === $localDirectoryInput.val()) {
      loadLocalDirectory($localDirectoryInput.val())
    }
  })

  $contextmenu.on('click', '.download, .download-queue, .upload, .upload-queue', function (ev) {
    const $selectedFiles = $server.find('tr.active')
    let files = []
    $selectedFiles.each(function () {
      files.push($(this).data('file'))
    })
    gl.socket.send('addToTransferQueue', {
      'localPath': $localDirectoryInput.val(),
      'serverPath': $serverDirectoryInput.val(),
      'files': files,
      'mode': $(this).attr("data-mode"),
      'server': tabParams.server,
      'recursive': true,
      'forceTransfer': $(this).hasClass('download')
    })
  })

  loadServerDirectory(tabParams.serverDirectory || '/')
  loadLocalDirectory(tabParams.localDirectory || '.')
})()
