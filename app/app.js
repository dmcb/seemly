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

// Morgan configuration
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms', {skip: function (req, res) { return req.method == 'OPTIONS' }}));
morgan.token('remote-user', function(req, res){
    if (req.user) { return req.user.id; }
})

// Connect to Couchbase
async.retry({times: 10, interval: function(retryCount) {return 1000 * Math.pow(1.5, retryCount);}, errorFilter: function(error) {if (error.code == 44) return true; return false;}},
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
            console.error(error.message);
            console.error('Failed to connect to Couchbase');
            process.exit(1);
        }
        else {
            // Couchbase is connected
            console.log('Couchbase connected');
            module.exports.bucket = result;
            var audits = require('./collections/audits');
            var sites = require('./collections/sites');

            // Allow command line input
            if (process.argv[2]) {
                var program = require('commander');

                program
                    .command('audit-sites')
                    .description('Get site data into Seemly')
                    .action(function () {
                        cmdValue = true;
                        sites.auditSites(config.sites, function(error, result) {
                            if (error) {
                                console.error(error);
                                process.exit(1);
                            }
                            console.log(result);
                            process.exit(0);
                        });
                    });

                program
                    .command('delete-sites')
                    .description('Delete all site data from Seemly')
                    .action(function () {
                        cmdValue = true;
                        audits.deleteAudits(config.sites, function(error, result) {
                            if (error) {
                                console.error(error);
                                process.exit(1);
                            }
                            console.log(result);
                            process.exit(0);
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
                var admin = require('./helpers/admin');
                admin.setup(function(error, result) {
                    if (error) {
                        console.error(error);
                        process.exit(0);
                    }
                    else {
                        console.log(result);

                        // Sync site list
                        admin.syncSiteList(function(error, result) {
                            if (error) {
                                console.error(error);
                                process.exit(0);
                            }
                            else {
                                // All initialized and ready to serve requests
                                // Grab port from config or supply a default
                                var port = config.port || 3001;
                                app.listen(port, function () {
                                    console.log('App listening on port ' + port);
                                });

                                // Set up templating and static files
                                app.engine('mustache', mustacheExpress());
                                app.set('view engine', 'mustache');
                                app.set('views', __dirname + '/views');
                                app.use(express.static('assets'));

                                app.get('/', function (req, res) {
                                    async.parallel({
                                        latest: function(callback) {
                                            audits.getAudits(function(error, result) {
                                                if (error) {
                                                    callback(error);
                                                }
                                                callback(null, result);
                                            });
                                        },
                                        previous: function(callback) {
                                            audits.getAudits(function(error, result) {
                                                if (error) {
                                                    callback(error);
                                                }
                                                callback(null, result);
                                            }, 'previous');
                                        },
                                        max_score: function(callback) {
                                            audits.getAudits(function(error, result) {
                                                if (error) {
                                                    callback(error);
                                                }
                                                callback(null, result);
                                            }, 'max_score');
                                        },
                                        min_score: function(callback) {
                                            audits.getAudits(function(error, result) {
                                                if (error) {
                                                    callback(error);
                                                }
                                                callback(null, result);
                                            }, 'min_score');
                                        }
                                    },
                                    function(error, results) {
                                        if (error) {
                                            return res.status(400).send(error);
                                        }
                                        else {
                                            // Merge data sets into an audits object
                                            var audits = {};
                                            var dataSets = ['latest', 'previous', 'max_score', 'min_score'];
                                            for (i in dataSets) {
                                                for (j in results[dataSets[i]]) {
                                                    var key = results[dataSets[i]][j].key;
                                                    if (dataSets[i] == 'latest') {
                                                        audits[key] = results[dataSets[i]][j].value;
                                                    }
                                                    else if (audits[key]) {
                                                        audits[key][dataSets[i]] = results[dataSets[i]][j].value.score;
                                                        audits[key][dataSets[i] + '_date'] = results[dataSets[i]][j].value.date;
                                                    }
                                                }
                                            }
                                            // Process audits object into array for Mustache
                                            var auditArray = [];
                                            for (var i in audits) {
                                                auditArray.push(audits[i]);
                                            }
                                            console.log(auditArray);
                                            res.render('index', { audits: auditArray });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }
        }
    }
);

module.exports = app;
