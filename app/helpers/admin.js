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
                },
                last_week: {
                    map: [
                        'function (doc, meta) {',
                            'if (meta.id.substring(0, 7) == "audit::") {',
                                'emit([doc.site], {date: doc.date, site: doc.site, score: doc.ruleGroups.SPEED.score});',
                            '}',
                        '}'
                        ].join('\n'),
                    reduce: [
                        'function(key, values, rereduce) {',
                            'var timeLimit = new Date().getTime() - 604800000;',
                            'var latest_update = {date: 0};',
                            'for (i in values) {',
                                'var update = values[i];',
                                'if (update.date > latest_update.date && update.date < timeLimit) {',
                                     'latest_update = update;',
                                '}',
                            '}',
                            'return latest_update;',
                        '}'
                        ].join('\n')
                },
                max_score: {
                    map: [
                        'function (doc, meta) {',
                            'if (meta.id.substring(0, 7) == "audit::") {',
                                'emit([doc.site], {date: doc.date, site: doc.site, score: doc.ruleGroups.SPEED.score});',
                            '}',
                        '}'
                        ].join('\n'),
                    reduce: [
                        'function(key, values, rereduce) {',
                            'var max_score = {date:9999999999999, score: 0};',
                            'for (i in values) {',
                                'var update = values[i];',
                                'if (update.score >= max_score.score && update.date < max_score.date) {',
                                     'max_score = update;',
                                '}',
                            '}',
                            'return max_score;',
                        '}'
                        ].join('\n')
                },
                min_score: {
                    map: [
                        'function (doc, meta) {',
                            'if (meta.id.substring(0, 7) == "audit::") {',
                                'emit([doc.site], {date: doc.date, site: doc.site, score: doc.ruleGroups.SPEED.score});',
                            '}',
                        '}'
                        ].join('\n'),
                    reduce: [
                        'function(key, values, rereduce) {',
                            'var min_score = {date:9999999999999, score: 100};',
                            'for (i in values) {',
                                'var update = values[i];',
                                'if (update.score <= min_score.score && update.date < min_score.date) {',
                                     'min_score = update;',
                                '}',
                            '}',
                            'return min_score;',
                        '}'
                        ].join('\n')
                }
            }
        },
    }

    // Insert or update design documents
    var manager = db.manager();

    async.retry({times: 10, interval: function(retryCount) {return 1000 * Math.pow(1.5, retryCount);}},
        function(callback) {
            console.log('Attempting to setup Couchbase...');
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
                        callback(error);
                        return;
                    }
                    callback();
                }
            );
        },
        function(error, result) {
            if (error) {
                console.error(error.message);
                console.error('Failed to setup Couchbase');
                process.exit(1);
            }
            else {
                callback(null, 'Couchbase setup successful');
            }
        }
    );
}

exports.syncSiteList = function(callback) {
    // Get latest site audits
    async.retry({times: 10, interval: function(retryCount) {return 1000 * Math.pow(1.5, retryCount);}},
        function(callback) {
            console.log('Attempting to sync site list...');
            audits.getLatestAudits(function (error, result) {
                if (error) {
                    callback(error);
                }
                else {
                    callback(null, result);
                }
            });
        },
        function(error, result) {
            if (error) {
                callback('Failed to sync site list');
            }
            else {
                console.log('Site list retrieved');

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

                callback();
            }
        }
    );
}
