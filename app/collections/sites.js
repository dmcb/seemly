var async = require('async');
var audits = require('../collections/audits');
var couchbase = require('couchbase');
var db = require('../app.js').bucket;
var request = require('request');
var uuid = require('uuid');

exports.auditSites = function(sites, callback) {
    async.eachLimit(
        sites,
        1,
        function(site, callback) {
            request({
                uri: 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?screenshot=true&url=' + site,
                method: 'GET'
            },
            function(error, response, body) {
                console.log('Auditing ' + site);
                if (error) {
                    console.error('Audit failed with ' + error.code + ' - ' + error.message);
                    callback();
                }
                else {
                    var id = uuid.v4();
                    var doc = JSON.parse(body);
                    if (doc.error) {
                        console.error('Audit error: ' + doc.error.message);
                        callback();
                    }
                    else {
                        doc.date = new Date().getTime();
                        doc.site = site;
                        db.insert('audit::' + id, doc, function(error, result) {
                            if (error) {
                                console.error('Failed to save audit');
                                callback();
                            }
                            else {
                                console.log('Audit successful');
                                callback();
                            }
                        });
                    }
                }
            });
        },
        function(error) {
            callback(null, 'Audits complete');
        }
    );
}
