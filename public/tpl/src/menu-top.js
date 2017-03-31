'use strict';
(function () {
  const $tpl = $('.template-menu-top')
  let systemStatus = null

  // interval to check for new version
  const getSystemStatus = function () {
    gl.socket.send('getSystemStatus', null, function (data) {
      if (data.latestVersion) {
        systemStatus = data
        $tpl.find('.version').text('v' + data.currentVersion)
        if (data.latestVersion !== data.currentVersion) {
          $tpl.find('.update-available').removeClass('hidden')
        }
      }
    })
  }
  getSystemStatus()
  setInterval(getSystemStatus, 10 * 1000)

  $tpl.on('click', '.update-available', function () {
    const $body = $('<div>').append(gl.t('update.available.modal', systemStatus, true))
    $body.append('<h3>Changelog</h3>').append($('<div style="white-space: pre-line">').text(systemStatus.latestVersionChangelog))
    gl.modalConfirm($body, function (result) {
      if (result === true) {
        gl.note('coreupdate.started')
        gl.socket.send('doCoreUpdate', null, function (result) {
          if (result === true) {

          } else {
            gl.note('coreupdate.error')
          }
        })
      }
    })
  })
})()
