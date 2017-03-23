'use strict';
(function () {
  var $box = $('.template-login .box')
  gl.socket.send('getSystemStatus', null, function (data) {
    if (!data.installed) {
      $box.find('.well').toggleClass('hidden')
    }
  })
  var $form = gl.form.create($box.children('.form'), 'login', {
    'username': {'type': 'text', 'label': 'Username', 'required': true},
    'password': {'type': 'password', 'label': 'Password', 'required': true},
    'remember': {'type': 'switch', 'label': 'Remember'}
  }, function (formData) {
    gl.socket.send('loginFormSubmit', formData, function (userData) {
      if (!userData) {
        gl.note('Login failed', 'danger')
      } else {
        gl.storage.set('login.id', userData.id, !formData.remember)
        gl.storage.set('login.hash', userData.loginHash, !formData.remember)
        gl.note('Login successfull', 'success')
        gl.tpl.loadInto('main', '#wrapper')
      }
    })
  })
  $form.find('.submit-form').text('Login')
})()
