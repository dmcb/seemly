#!/usr/bin/env node

// Dependencies
var express = require('express');
var morgan = require('morgan');
var couchbase = require('couchbase');
var program = require('commander');
var config = require('./config');

var app = express();

// Morgan configuration
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms', {skip: function (req, res) { return req.method == 'OPTIONS' }}));
morgan.token('remote-user', function(req, res){ 
    if (req.user) { return req.user.id; }
})

// Global declaration of Couchbase
module.exports.bucket = (new couchbase.Cluster(config.couchbase.server)).openBucket(config.couchbase.bucket, config.couchbase.password);

// Allow command line input
if (process.argv[2]) {
    var admin = require('./admin.js');
    var program = require('commander');

    program
        .command('setup')
        .description('Initialize the database with current configuration')
        .action(function () {
            admin.setup(function(error, result) {
                if (error) {
                    console.log(error);
                    process.exit(1);
                } else {
                    console.log(result);
                    process.exit(0);
                }
            });
        });

    program.parse(process.argv);
    if (typeof cmdValue === 'undefined') {
        console.error('No valid command given');
        process.exit(1);
    }
}
// If no command line input, run the app
else {
    // Grab port from config or supply a default
    var port = config.port || 3001;
    app.listen(port, function () {
        console.log('App listening on port ' + port);
    });
}

module.exports = app;