'use strict';
(function () {
  const $tpl = $('.template-serverbrowser')
  const tabParams = gl.splitbox.tabActive.data("params")
  gl.socket.send("getFtpFilelist", {"server" : tabParams.id, "directory": "/"}, function (list) {
    console.log(list)
  })
})()
