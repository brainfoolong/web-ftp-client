'use strict';
(function () {
  const $tree = $(".template-servermanager-left").find(".tree")
  gl.socket.send('getServers', null, function (servers) {
    for (let serversIndex in servers) {
      if (servers.hasOwnProperty(serversIndex)) {
        let serversRow = servers[serversIndex]
        let $entry = $tree.find(".boilerplate").clone()
        $entry.removeClass("boilerplate")
        $entry.find(".name").text(serversRow.name)
        $tree.append($entry)
      }
    }
  })
})()
