'use strict';
(function () {
  const $tpl = $('.template-servermanager')
  const $tree = $tpl.find('.tree')
  let servers = {}
  let editId = null

  const forms = {
    'general': {
      'name': {'type': 'text', 'label': 'server.name', 'required': true},
      'host': {'type': 'text', 'label': 'server.host', 'required': true},
      'port': {'type': 'number', 'label': 'server.port', 'default': 21, 'required': true},
      'encryption': {
        'type': 'select',
        'label': 'server.encryption',
        'values': {
          'none': 'server.encryption.none',
          'both': 'server.encryption.both',
          'control': 'server.encryption.control',
          'implicit': 'server.encryption.implicit'
        }
      },
      'protocol': {
        'type': 'select',
        'label': 'server.protocol',
        'values': {'ftp': 'FTP - File Transfer Protocol', 'sftp': 'SFTP - SSH File Transfer Protocol'}
      },
      'auth': {
        'type': 'select',
        'label': 'server.auth',
        'values': {'normal': 'server.auth.normal', 'keyfile': 'server.auth.keyfile'}
      },
      'username': {'type': 'text', 'label': 'username'},
      'password': {'type': 'password', 'label': 'password'}
    }
  }
  const loadForm = function (values) {
    for (let i in forms) {
      const $form = $('.template-servermanager .form-' + i)
      $form.html('')
      gl.form.create($form, 'server-' + i, forms[i], function () {
        const formData = {}
        $tpl.find('.form form').each(function () {
          $.extend(formData, $(this).serializeJSON())
        })
        gl.socket.send('servermanagerFormSubmit', {'formData': formData, 'id': editId}, function (result) {
          gl.note(gl.t('saved'), 'success')
          gl.splitbox.tabReload()
        })
      }, function () {
        gl.splitbox.tabReload()
      }, values)
    }
  }
  const loadServers = function () {
    gl.socket.send('getServers', null, function (serverlist) {
      servers = serverlist
      $tree.find('.entry').not('.boilerplate').remove()
      for (let serversIndex in servers) {
        if (servers.hasOwnProperty(serversIndex)) {
          let serversRow = servers[serversIndex]
          let $entry = $tree.find('.boilerplate').clone()
          $entry.removeClass('boilerplate')
          $entry.find('.name').text(serversRow.name)
          $entry.attr('data-id', serversRow.id)
          $tree.append($entry)
        }
      }
    })
  }

  $tpl.on('click', '.server-add', function () {
    editId = null
    loadForm()
  }).on('click', '.server-connect', function () {
    gl.splitbox.tabLoad(gl.splitbox.tabAdd('serverbrowser', {'server': editId}, servers[editId].name))
    gl.splitbox.tabSave()
  }).on('click', '.tree .entry', function () {
    $tree.find('.entry').removeClass('active')
    $(this).addClass('active')
    editId = $(this).attr('data-id')
    loadForm(servers[$(this).attr('data-id')])
  })
  loadForm()
  loadServers()
})()
