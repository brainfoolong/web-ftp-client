'use strict';
(function () {
  gl.storage.set('login.id', null, false)
  gl.storage.set('login.id', null, true)
  gl.storage.set('login.hash', null, false)
  gl.storage.set('login.hash', null, true)
  gl.socket.con.close()
  gl.note(gl.t('goodbye'))
})()
