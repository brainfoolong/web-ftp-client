'use strict'
/**
 * Express routes, url handling
 */
const express = require('express')
const app = express()
const config = require(__dirname + '/config')

const routes = {
  'file': null
}

// output the required ws port number
app.get('/wsport', function (req, res) {
  res.send((config.port + 1).toString())
})

// whole public folder
app.use(express.static(__dirname + '/../public'))

// create the server
app.listen(config.port, config.host, function () {

})

module.exports = routes
