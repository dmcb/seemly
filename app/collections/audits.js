var async = require('async');
var couchbase = require('couchbase');
var db = require('../app.js').bucket;

exports.deleteAudits = function(sites, callback) {
    async.each(
        sites,
        function(site, callback) {
            query = couchbase.ViewQuery.from('audits', 'latest')
                .reduce(false)
                .key([site])
                .stale(1);
            db.query(query, function(error, result) {
                if (error) {
                    return callback(error);
                }
                async.each(result,
                    function(audit, callback) {
                        db.remove(audit.id, function(error, result) {
                            if (error) {
                                return callback(error);
                            }
                            callback(null, result);
                        });
                    },
                    function(error) {
                        if (error) {
                            return callback(error);
                        }
                        console.log('Deleted audits for ' + site);
                        callback();
                    }
                );
            });
        },
        function(error) {
            callback(null, 'Audits deleted');
        }
    );
}

exports.getLatestAudits = function(callback) {
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

exports.getPreviousAudits = function(callback) {
    query = couchbase.ViewQuery.from('audits', 'previous')
        .group(true)
        .stale(1);
    db.query(query, function(error, result) {
        if (error) {
            return callback(error);
        }
        callback(null, result);
    });
}
