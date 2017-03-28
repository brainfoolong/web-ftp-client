'use strict';
(function () {
  const $tpl = $('.template-settings')

  const form = {
    'transfer_mode': {
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
    },
    'transfer_max': {
      'type': 'number',
      'label': 'transfer.max',
      'description': 'transfer.max.description',
      'defaultValue': 3
    }
  }

  const loadForm = function () {
    gl.socket.send('getSettings', null, function (settings) {
      const $form = $tpl.find('.form')
      $form.html('')
      gl.form.create($form, 'settings', form, function (formData) {
        gl.socket.send('saveSettings', formData, function () {
          gl.note(gl.t('saved'), 'success')
        })
      }, function () {
        loadForm()
      }, settings)
    })
  }
  loadForm()
})()
