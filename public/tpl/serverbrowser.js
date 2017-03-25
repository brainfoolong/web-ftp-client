'use strict';
(function () {
  const $tpl = $('.template-serverbrowser')
  const tabParams = gl.splitbox.tabActive.data('params')

  /**
   * Build the files into the given container
   * @param {jQuery} $container
   * @param {[]} files
   */
  const buildFilelist = function ($container, files) {
    $container.html('')
    const $table = $tpl.find('.boilerplate.table-files').clone()
    const $tbody = $table.find('tbody')
    $table.removeClass('boilerplate')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const $tr = $table.find('tbody .boilerplate').clone()
      $tr.removeClass('boilerplate')
      let icon = (file.directory ? 'directory' : 'file')
      $tr.find('.name').attr("data-sortValue", (file.directory ? 'b' : 'a') + file.filename)
      $tr.find('.name .icon').addClass('icon-' + icon)
      $tr.find('.name .text').text(file.filename)
      $tbody.append($tr)
    }
    $container.append($table)
    $table.find('table').tablesorter({
      textExtraction: function (node, table, cellIndex) {
        let n = $(node)
        return n.attr('data-sortValue') || n.text()
      }
    })
  }

  /**
   * Load a local directory
   * @param {string} directory
   */
  const loadLocalDirectory = function (directory) {
    $tpl.find('.left .input-directory input').val(directory)
    gl.socket.send('getLocalFilelist', {'directory': directory}, function (list) {
      buildFilelist($tpl.find('.left .files'), list)
      console.log(list)
    })
  }

  /**
   * Load server directory
   * @param {string} directory
   */
  const loadServerDirectory = function (directory) {
    $tpl.find('.right .input-directory input').val(directory)
    gl.socket.send('getFtpFilelist', {'server': tabParams.id, 'directory': directory}, function (list) {
      buildFilelist($tpl.find('.right .files'), list)
      console.log(list)
    })
  }

  loadServerDirectory(tabParams.serverDirectory || '/')
  loadLocalDirectory(tabParams.localDirectory || '.')

})()
