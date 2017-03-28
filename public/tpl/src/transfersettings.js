'use strict';
(function () {
  const $tpl = $('.template-transfersettings')

  const form = {
    'mode': {
      'type': 'select',
      'label': 'transfer.mode',
      'values': {
        'never': 'transfer.mode.never',
        'replace-always': 'transfer.mode.replace-always',
        'replace-newer': 'transfer.mode.replace-newer',
        'replace-sizediff': 'transfer.mode.replace-sizediff',
        'replace-newer-or-sizediff': 'transfer.mode.replace-newer-or-sizediff',
        'rename': 'transfer.mode.rename'
      }
    }
  }

  const loadForm = function () {
    gl.socket.send('getTransferSettings', null, function (settings) {
      const $form = $tpl.find('.form')
      $form.html('')
      gl.form.create($form, 'transfersettings', form, function (formData) {
        gl.socket.send('saveTransferSettings', formData, function () {
          gl.note(gl.t('saved'), 'success')
        })
      }, function () {
        loadForm()
      }, settings)
    })
  }
  loadForm()
})()
