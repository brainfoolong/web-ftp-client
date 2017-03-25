'use strict';
(function () {
  const $tpl = $('.template-serverbrowser')
  const tabParams = gl.splitbox.tabActive.data('params')
  const $contextmenu = $tpl.find('.contextmenu')
  const $local = $tpl.children('.local')
  const $localDirectoryInput = $local.find(".input-directory input")
  const $server = $tpl.children('.server')
  const $serverDirectoryInput = $server.find(".input-directory input")

  /**
   * Build the files into the given container
   * @param {string} type
   * @param {jQuery} $container
   * @param {[]} files
   */
  const buildFilelist = function (type, $container, files) {
    $container.html('')
    const $table = $tpl.find('.boilerplate.table-files').clone()
    const $tbody = $table.find('tbody')
    $table.removeClass('boilerplate')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const mtime = new Date(file.attrs.mtime)
      const $tr = $table.find('tbody .boilerplate').clone()
      $tr.removeClass('boilerplate')
      $tr.attr('data-path', file.path)
      let icon = (file.directory ? 'directory' : 'file')
      $tr.find('.name').attr('data-sortValue', (file.directory ? 'a' : 'b') + file.filename)
      $tr.find('.name .icon').addClass('icon-' + icon)
      $tr.find('.name .text').text(file.filename)
      $tr.find('.size').text((file.attrs.size / 1024).toPrecision(2) + 'kB')
      $tr.find('.mtime').text(mtime.toLocaleString()).attr('data-sortValue', mtime.getTime())
      $tbody.append($tr)
    }
    $container.append($table)
    $table.find('table').tablesorter({
      textExtraction: function (node) {
        let n = $(node)
        return (n.attr('data-sortValue') || n.text()).toLowerCase()
      },
      'sortList': [[0, 0]]
    })
    $table.on('click', 'tbody tr', function (ev) {
      ev.stopPropagation()
      let selection = [this, this]
      if (ev.shiftKey) {
        selection[1] = $table.find('tbody tr.active').first()[0]
      }
      let $trs = $table.find('tbody tr')
      $trs.removeClass('active')
      let $selection = $trs.filter(selection)
      if ($selection.length === 1) {
        $selection.addClass('active')
      } else {
        $selection.first().nextUntil($selection.last()).addBack().add($selection.last()).addClass('active')
      }
    }).on('dblclick', 'tbody tr', function (ev) {
      ev.stopPropagation()
      if (type === 'local') {
        loadLocalDirectory($(this).attr('data-path'))
      }
      if (type === 'server') {
        loadServerDirectory($(this).attr('data-path'))
      }
    }).on('contextmenu', 'tbody tr', function (ev) {
      $(this).addClass('active')
      ev.stopPropagation()
      ev.preventDefault()
      $contextmenu.filter('.' + type).addClass('show').offset({
        left: ev.pageX,
        top: ev.pageY
      })
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
    gl.socket.send('getLocalFilelist', {'server': tabParams.id, 'directory': directory}, function (data) {
      if (!data) {
        return
      }
      $localDirectoryInput.val(data.currentDirectory)
      buildFilelist('local', $local.find('.files'), data.files)
    })
  }

  /**
   * Load server directory
   * @param {string} directory
   */
  const loadServerDirectory = function (directory) {
    gl.socket.send('getFtpFilelist', {'server': tabParams.id, 'directory': directory}, function (data) {
      if (!data) {
        return
      }
      $serverDirectoryInput.val(data.currentDirectory)
      buildFilelist('server', $server.find('.files'), data.files)
    })
  }

  $tpl.on('click', function () {
    $tpl.find('tr.active').removeClass('active')
    $tpl.find('.contextmenu').removeClass('show')
  })

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

  $contextmenu.on('click', '.download', function (ev) {
    ev.stopPropagation()

  })

  loadServerDirectory(tabParams.serverDirectory || '/')
  loadLocalDirectory(tabParams.localDirectory || '.')

})()
