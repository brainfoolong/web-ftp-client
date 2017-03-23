"use strict";

const db = require("./../db");
const hash = require("./../hash");

const action = {};

/**
 * Require user
 * @type {boolean}
 */
action.requireUser = false;

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
    var formData = message;
    if (formData.username && formData.password) {
        var pwHash = hash.saltedMd5(formData.password);
        var userData = db.get("users").find({
            "username": formData.username,
            "passwordHash": pwHash
        }).cloneDeep().value();
        if (userData) {
            callback({"id": userData.id, "loginHash": userData.loginHash});
            return;
        }
        // create user as admin if not yet exist
        if (!db.get("users").size().value()) {
            userData = {
                "id": hash.random(32),
                "username": formData.username,
                "passwordHash": pwHash,
                "loginHash": hash.random(32),
                "admin": true
            };
            db.get("users").set(userData.id, userData).value();
            callback({"id": userData.id, "loginHash": userData.loginHash});
        }
    }
    callback(false);
};

module.exports = action;