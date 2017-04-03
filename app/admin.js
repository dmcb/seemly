var db = require('./app.js').bucket;
var async = require('async');
var config = require('./config');

exports.auditSites = function(callback) {
    for (var i in config.sites) {
        console.log(config.sites[i]);
    }
    callback('Audit complete');
}

exports.setup = function(callback) {
    // Design documents
    var design_docs = {
        sites: {
            views: {
                by_sid: {
                    map: [
                        'function (doc, meta) {',
                            'if (meta.id.substring(0, 6) == "site::") {',
                                'emit([doc.sid], doc.sid);',
                            '}',
                        '}'
                        ].join('\n')
                }
            }
        },
    }

    // Insert or update design documents
    var manager = db.manager();
    async.forEachOf(design_docs,
        function(design_doc, design_doc_name, callback) {
            try {
                manager.upsertDesignDocument(design_doc_name, design_doc, function(error, result) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    callback();
                });
            } catch (error) {
                callback(error);
            }
        },
        function (error) {
            if (error) {
                callback(error, null);
                return;
            }
            callback(null, 'Couchbase setup successful');
        }
    );
}