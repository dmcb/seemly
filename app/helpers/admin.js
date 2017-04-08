var async = require('async');
var audits = require('../collections/audits');
var db = require('../app.js').bucket;
var config = require('../config');
var sites = require('../collections/sites');

exports.setup = function(callback) {
    // Design documents
    var design_docs = {
        audits: {
            views: {
                latest: {
                    map: [
                        'function (doc, meta) {',
                            'if (meta.id.substring(0, 7) == "audit::") {',
                                'emit([doc.site], {date: doc.date, site: doc.site, url: doc.id, title: doc.title, score: doc.ruleGroups.SPEED.score, screenshot: doc.screenshot.data.replace(/_/g,"/").replace(/-/g,"+")});',
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

exports.syncSiteList = function() {
    // Get latest site audits
    audits.getLatestAudits(function (error, result) {
        if (error) {
            console.error(error);
        }
        else {
            // Find site additions and deletions
            var newSites = config.sites;
            var deletedSites = [];
            for (i in result) {
                var index = newSites.indexOf(result[i].value.site);
                if (index > -1) {
                    newSites.splice(index, 1);
                }
                else {
                    deletedSites.push(result[i].value.site);
                }
            }

            // Audit any new sites
            if (newSites.length) {
                console.log('Sites added to config: ' + newSites);
                sites.auditSites(newSites, function(error, result) {
                    if (error) {
                        console.error(error);
                    }
                });
            }
            // Remove audits of any deleted sites
            if (deletedSites.length) {
                console.log('Sites removed from config: ' + deletedSites);
                audits.deleteAudits(deletedSites, function(error, result) {
                    if (error) {
                        console.error(error);
                    }
                });
            }
        }
    });
}