#!/usr/bin/env node

// Dependencies
var express = require('express');
var async = require('async');
var couchbase = require('couchbase');
var morgan = require('morgan');
var mustacheExpress = require('mustache-express');
var program = require('commander');
var config = require('./config');

var app = express();
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// Morgan configuration
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms', {skip: function (req, res) { return req.method == 'OPTIONS' }}));
morgan.token('remote-user', function(req, res){ 
    if (req.user) { return req.user.id; }
})

// Connect to Couchbase
async.retry({times: 10, interval: function(retryCount) {return 1000 * Math.pow(1.5, retryCount);}},
    function(callback) {
        console.log('Attempting to connect to Couchbase...');
        var bucket = (new couchbase.Cluster(config.couchbase.server)).openBucket(config.couchbase.bucket, config.couchbase.bucketPassword, function(error) {
            if (error) {
                callback(error);
            }
            else {
                callback(null, bucket);
            }
        });
    },
    function(error, result) {
        if (error) {
            console.error(error);
            console.error('Failed to connect to Couchbase');
            process.exit(1);
        }
        else {
            // Couchbase is connected
            console.log('Couchbase connected');
            module.exports.bucket = result;
            var admin = require('./admin.js');

            // Allow command line input
            if (process.argv[2]) {
                var program = require('commander');

                program
                    .command('audit-sites')
                    .description('Get site data into Seemly')
                    .action(function () {
                        cmdValue = true;
                        admin.auditSites(function(error, result) {
                            if (error) {
                                console.error(error);
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
                // Ensure design docs are in place
                admin.setup(function(error, result) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(result);

                        // Grab port from config or supply a default
                        var port = config.port || 3001;
                        app.listen(port, function () {
                            console.log('App listening on port ' + port);
                        });

                        app.get('/', function (req, res) {
                            res.render('index', { title: 'Hey', message: 'Hello there!' });
                        })
                    }
                });
            }
        }
    }
);

module.exports = app;