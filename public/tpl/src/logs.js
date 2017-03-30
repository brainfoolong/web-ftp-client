'use strict';
(function () {
  const $tpl = $('.template-logs')
  const $boilerplate = $tpl.find('.boilerplate.log')
  const addMessage = function (msg) {
    // truncate old logs
    if ($tpl.children().length > 70) {
      $tpl.children(':lt(20)').remove()
    }
    const $log = $boilerplate.clone()
    $log.addClass('type-' + msg.type)
    $log.find('.time').text(new Date(msg.time).toLocaleString())
    if (msg.serverName) {
      $log.find('.server').removeClass('hidden').text(msg.serverName)
    }
    $log.find('.message').html(gl.t(msg.message, msg.params, true))
    $log.removeClass('boilerplate')
    $tpl.append($log)
    if (!$tpl.is(':focus')) {
      $tpl.parent()[0].scrollTop = 9999999
    }
  }

  gl.socket.send('getLogs', null, function (logs) {
    for (let i = 0; i < logs.length; i++) {
      addMessage(logs[i])
    }
    gl.socket.bind(function (message) {
      if (message.action === 'log') {
        if (message.message.messages) {
          for (let i = 0; i < message.message.messages.length; i++) {
            addMessage(message.message.messages[i])
          }
        }
      }
    })
  })
})()
