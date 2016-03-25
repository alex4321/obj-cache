"use strict";

var mongoose = require("mongoose");

var CacheSchema = new mongoose.Schema({
    "category": String,
    "key": String,
    "data": String,
    "lastUsage": Number
});
CacheSchema.index({
    "category": 1,
    "key": 1
}, {
    unique: true
});
var CacheModel = mongoose.model("cache_entry", CacheSchema);

function nowUnixTime() {
    return Math.floor(Date.now() / 1000);
}

function Cache(dbConnection) {
    this.db = dbConnection;
}

Cache.prototype.find = function (category, key, callback) {
    CacheModel.find({
        category: category,
        key: JSON.stringify(key)
    }, function (err, data) {
        if (err !== null) {
            callback(err, null);
        } else if (data.length === 0) {
            callback(null, undefined);
        } else {
            callback(null, data[0]);
        }
    });
};

Cache.prototype.insert = function (category, key, value, callback) {
    var record = new CacheModel({
        category: category,
        key: JSON.stringify(key),
        data: JSON.stringify(value),
        lastUsage: nowUnixTime()
    });
    record.save(callback);
};

Cache.prototype.update = function (item, value, callback) {
    item.data = JSON.stringify(value);
    item.lastUsage = nowUnixTime();
    item.save(callback);
};

Cache.prototype.set = function (category, key, value, callback) {
    this.find(category, key, function (err, data) {
        if (err !== null) {
            callback(err);
        } else if (data === undefined) {
            this.insert(category, key, value, callback);
        } else {
            this.update(data, value, callback);
        }
    }.bind(this));
};

Cache.prototype.get = function (category, key, callback) {
    this.find(category, key, function (err, data) {
        if (err !== null) {
            callback(err, null);
        } else if (data === undefined) {
            callback(null, undefined);
        } else if (data.data === undefined) {
            callback(null, undefined);
        } else {
            var value = JSON.parse(data.data);
            data.last_usage = nowUnixTime();
            data.save(function (err) {
                if (err !== null) {
                    callback(err, null);
                } else {
                    callback(err, value);
                }
            });
        }
    });
};

module.exports.get = function (connectionString, callback) {
    mongoose.connect(connectionString, function (err) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, new Cache(mongoose.connection));
        }
    });
};
