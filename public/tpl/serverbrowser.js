'use strict';
(function () {
  const $tpl = $('.template-serverbrowser')
  const tabParams = gl.splitbox.tabActive.data('params')

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
      $tr.find(".size").text((file.attrs.size / 1024).toPrecision(2)+"kB")
      $tr.find(".mtime").text(mtime.toLocaleString()).attr("data-sortValue", mtime.getTime())
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
    $tpl.find('.right').on('click', function () {
      $table.find('.active').removeClass('active')
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
    }).on('dblclick', '.directory-parent', function (ev) {
      ev.stopPropagation()
      if (type === 'local') {
        let v = $tpl.find('.left .input-directory input').val()
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
        let v = $tpl.find('.right .input-directory input').val()
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
      $tpl.find('.left .input-directory input').val(data.currentDirectory)
      buildFilelist('local', $tpl.find('.left .files'), data.files)
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
      $tpl.find('.right .input-directory input').val(data.currentDirectory)
      buildFilelist('server', $tpl.find('.right .files'), data.files)
    })
  }

  $tpl.find('.left .input-directory input').on('keyup', function (ev) {
    if (ev.keyCode === 13) {
      loadLocalDirectory(this.value)
    }
  })

  $tpl.find('.right .input-directory input').on('keyup', function (ev) {
    if (ev.keyCode === 13) {
      loadServerDirectory(this.value)
    }
  })

  loadServerDirectory(tabParams.serverDirectory || '/')
  loadLocalDirectory(tabParams.localDirectory || '.')

})()
