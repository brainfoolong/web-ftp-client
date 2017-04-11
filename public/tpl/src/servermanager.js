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
      'port': {'type': 'number', 'label': 'server.port', 'defaultValue': 21, 'required': true},
      'protocol': {
        'type': 'select',
        'label': 'server.protocol',
        'values': {'sftp': 'SFTP - SSH File Transfer Protocol', 'ftp': 'FTP - File Transfer Protocol'}
      },
      'encryption': {
        'type': 'select',
        'label': 'server.encryption',
        'showIf': function (fields) {
          return fields.protocol.val() === 'ftp'
        },
        'values': {
          'none': 'server.encryption.none',
          'both': 'server.encryption.both',
          'control': 'server.encryption.control',
          'implicit': 'server.encryption.implicit'
        }
      },
      'auth': {
        'type': 'select',
        'label': 'server.auth',
        'values': {'normal': 'server.auth.normal', 'keyfile': 'server.auth.keyfile'}
      },
      'username': {
        'type': 'text',
        'label': 'username',
        'required': true
      },
      'password': {
        'type': 'password',
        'label': 'password',
        'description': 'server.password.description',
        'showIf': function (fields) {
          return fields.auth.val() === 'normal'
        }
      },
      'keyfile': {
        'type': 'textarea',
        'label': 'server.auth.keyfile',
        'description': 'server.auth.keyfile.description',
        'showIf': function (fields) {
          return fields.auth.val() === 'keyfile'
        }
      },
      'keyfile_passphrase': {
        'type': 'password',
        'label': 'server.auth.keyfile.passphrase',
        'description': 'server.password.description',
        'showIf': function (fields) {
          return fields.auth.val() === 'keyfile'
        }
      },
      'root_local': {
        'type': 'text',
        'label': 'server.root.local'
      },
      'root_server': {
        'type': 'text',
        'label': 'server.root.server'
      }
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
    if (editId) {
      gl.splitbox.tabLoad(gl.splitbox.tabAdd('serverbrowser', {'server': editId}, servers[editId].name))
      gl.splitbox.tabSave()
    }
  }).on('click', '.tree .entry', function () {
    $tree.find('.entry').removeClass('active')
    $(this).addClass('active')
    editId = $(this).attr('data-id')
    loadForm(servers[$(this).attr('data-id')])
  }).on('click', '.tree .glyphicon-remove', function (ev) {
    ev.stopPropagation()
    const $e = $(this).closest('.entry')
    const serverId = $e.attr('data-id')
    gl.modalConfirm(gl.t('sure'), function (result) {
      if (result === true) {
        gl.socket.send('removeServer', {'serverId': serverId}, function () {
          $e.remove()
          $('.splitbox-tabs .tab').filter('[data-template=\'serverbrowser\']').each(function () {
            if ($(this).data('params').server === serverId) {
              gl.splitbox.tabDelete($(this))
            }
          })
        })
      }
    })
  })
  loadForm()
  loadServers()
})()
