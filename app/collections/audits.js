var async = require('async');
var couchbase = require('couchbase');
var db = require('../app.js').bucket;
var request = require('request');
var uuid = require('uuid');

exports.auditSites = function(sites, callback) {
    async.each(
        sites,
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
                    console.log('Audit successful');
                    var doc = JSON.parse(body);
                    doc.date = new Date().getTime();
                    doc.site = site;
                    db.insert('audit::' + id, doc, function(error, result) {
                        if (error) {
                            console.error('Failed to save audit');
                            callback();
                        }
                        else {
                            callback();
                        }
                    });
                }
            });
        },
        function(error) {
            callback(null, 'Audits complete');
        }
    );
}

exports.getLatest = function(callback) {
    query = couchbase.ViewQuery.from('audits', 'latest')
        .group(true)
        .stale(1);
    db.query(query, function(error, result) {
        if (error) {
            return callback(error);
        }
        callback(null, result);
    });
}
