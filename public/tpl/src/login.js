'use strict';
(function () {
  const $box = $('.template-login .box')
  gl.socket.send('getSystemStatus', null, function (data) {
    if (!data.installed) {
      $box.find('.well').toggleClass('hidden')
    }
  })
  const $form = gl.form.create($box.children('.form'), 'login', {
    'username': {'type': 'text', 'label': 'username', 'required': true},
    'password': {'type': 'password', 'label': 'password', 'required': true},
    'remember': {'type': 'switch', 'label': 'login.remember'}
  }, function (formData) {
    gl.socket.send('loginFormSubmit', formData, function (userData) {
      if (!userData) {
        gl.note('login.failed', 'danger')
      } else {
        gl.userData = userData
        gl.storage.set('login.id', userData.id, !formData.remember)
        gl.storage.set('login.hash', userData.loginHash, !formData.remember)
        gl.note('login.success', 'success')
        gl.tpl.loadInto('main', '#wrapper')
      }
    })
  })
  $form.find('.submit-form').text(gl.t('login'))
})()
