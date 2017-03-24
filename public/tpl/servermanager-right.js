'use strict';
(function () {
  var $tpl = $('.template-servermanager-right')
  var forms = {
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
  var loadForm = function (values) {
    for (var i in forms) {
      gl.form.create($('.template-servermanager-right .form-' + i), 'server-' + i, forms[i], function () {
        var formData = {}
        $tpl.find('.form form').each(function () {
          $.extend(formData, $(this).serializeJSON())
        })
        gl.socket.send("")
        console.log(formData)
      }, values)
    }
  }
  $('.server-add').on('click', function () {
    loadForm()
  })
  loadForm()
})()
