'use strict';
(function () {
  storage.set('login.id', null, false)
  storage.set('login.id', null, true)
  storage.set('login.hash', null, false)
  storage.set('login.hash', null, true)
  socket.con.close()
  global.note('Cya later buddy')
})()
