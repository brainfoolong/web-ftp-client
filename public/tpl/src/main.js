'use strict';
(function () {
  gl.tpl.loadInto('menu-top', '.menu-top')
  gl.tpl.loadInto('logs', '.logs')
  gl.tpl.loadInto('transfer', '.transfer')

  // initialize tabs
  gl.splitbox.tabRestore()
})()
