var async = require('async');
var db = require('../app.js').bucket;
var config = require('../config');

exports.setup = function(callback) {
    // Design documents
    var design_docs = {
        audits: {
            views: {
                latest: {
                    map: [
                        'function (doc, meta) {',
                            'if (meta.id.substring(0, 7) == "audit::") {',
                                'emit([doc.site], {date: doc.date, site: doc.site, url: doc.id, title: doc.title, score: doc.ruleGroups.SPEED.score, screenshot: doc.screenshot.data});',
                            '}',
                        '}'
                        ].join('\n'),
                    reduce: [
                        'function(key, values, rereduce) {',
                            'var latest_update = {date: 0};',
                            'for (i in values) {',
                                'var update = values[i];',
                                'if (update.date > latest_update.date) {',
                                     'latest_update = update;',
                                '}',
                            '}',
                            'return latest_update;',
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