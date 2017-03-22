"use strict";
/**
 * Express routes, url handling
 */
const express = require('express');
const path = require('path');
const app = express();
const config = require(__dirname + "/config");
const fs = require("fs");

const routes = {
    "file": null
};

// output the required ws port number
app.get("/wsport", function (req, res) {
    res.send((config.port + 1).toString());
});

app.use(express.static(__dirname + "/../public"));

app.get(/^\/view\/([a-z0-9\-\_\.]+)/, function (req, res, next) {
    let filepath = path.resolve(__dirname + "/../views/" + res.req.params[0]);
    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
        return;
    }
    res.send("No file given");
});

app.get(/^\/download-file\/.*/, function (req, res, next) {
    if (routes.file && fs.existsSync(routes.file)) {
        res.sendFile(routes.file);
        return;
    }
    res.send("No file given");
});

app.listen(config.port, config.host, function () {

});

module.exports = routes;