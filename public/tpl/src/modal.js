'use strict';
(function () {
  const $tpl = $('.template-modal')
  $tpl.on('click', function (ev) {
    ev.stopPropagation()
  }).find('.modal-own-close').on('click', function (ev) {
    $tpl.trigger('close')
  })
})()
