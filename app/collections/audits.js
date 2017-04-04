var couchbase = require('couchbase');
var db = require('../app.js').bucket;

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
