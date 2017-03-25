'use strict';
(function () {
  const $tpl = $('.template-logs')

  const addMessage = function (msg) {
    const $log = $tpl.find('.boilerplate.log').clone()
    $log.addClass('type-' + msg.type)
    $log.find('.time').text(new Date(msg.time).toLocaleString())
    $log.find('.server').text(msg.server)
    $log.find('.message').html(gl.t(msg.message, msg.params, true))
    $log.removeClass('boilerplate')
    $tpl.append($log)
    $tpl.parent()[0].scrollTop = 9999999
  }

  gl.socket.send('getLogs', null, function (logs) {
    for (let i = 0; i < logs.length; i++) {
      addMessage(logs[i])
    }
    gl.socket.bind(function (message) {
      if (message.action === 'log') {
        addMessage(message.message)
      }
    })
  })
})()
