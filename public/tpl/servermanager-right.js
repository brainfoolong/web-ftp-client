'use strict';
(function () {
  const $tpl = $('.template-servermanager-right')
  const forms = {
    'general': {
      'name': {'type': 'text', 'label': 'server.name', 'required': true},
      'host': {'type': 'text', 'label': 'server.host', 'required': true},
      'port': {'type': 'number', 'label': 'server.port', 'default': 21, 'required': true},
      'protocol': {
        'type': 'select',
        'label': 'server.protocol',
        'values': {'ftp': 'FTP - File Transfer Protocol', 'sftp': 'SFTP - SSH File Transfer Protocol'}
      },
      'auth': {
        'type': 'select',
        'label': 'server.auth',
        'values': {'normal': 'server.auth.normal', 'anonym': 'server.auth.anonym', 'keyfile': 'server.auth.keyfile'}
      }
    }
  }
  const loadForm = function (values) {
    for (let i in forms) {
      const $form = $('.template-servermanager-right .form-' + i)
      $form.html('')
      gl.form.create($form, 'server-' + i, forms[i], function () {
        const formData = {}
        $tpl.find('.form form').each(function () {
          $.extend(formData, $(this).serializeJSON())
        })
        gl.socket.send('servermanagerFormSubmit', {'formData': formData, 'id': null}, function (result) {
          gl.note(gl.t('saved'), 'success')
          gl.splitbox.tabReload()
        })
      }, values)
    }
  }
  $('.server-add').on('click', function () {
    loadForm()
  })
  loadForm()
})()
