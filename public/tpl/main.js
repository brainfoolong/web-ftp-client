'use strict';
(function () {
  gl.tpl.loadInto('menu-top', '.menu-top')
  gl.tpl.loadInto('menu-icons', '.menu-icons')
  gl.tpl.loadInto('logs', '.logs')
  gl.tpl.loadInto('transfer', '.transfer')

  // make center draggable
  $('.template-main').find('.splitbox').find('.center').draggable({
    'axis': 'x',
    'stop': function (ev, ui) {
      const $tab = $('.splitbox-tabs').find('.active')
      const left = 100 / $(window).width() * $(this).offset().left
      let params = $tab.data('params')
      params.widthLeft = left
      gl.splitbox.tabSave()
      gl.splitbox.tabReload()
      $(this).removeAttr("style")
    }
  })

  // initialize tabs
  gl.splitbox.tabRestore()
})()
