var boom = require('boom');
var joi = require('joi');
var es = require('../../../configs/es');

function controller(request, reply) {
    controller.validate(request)
        .then(function(result) {
            console.log('[#validate] Done with promise');
            return controller.find(result);
        })
        .then(function(result) {
            console.log('[#find] Done with promise');
            return reply(result);
        })
        .catch(reply);
}

controller.validate = function(request) {
    return new Promise(function(resolve, reject) {
        var params = {
            owner: request.params.owner,
            repo: request.params.repo
        };

        var schema = {
            owner: joi.string(),
            repo: joi.string()
        };

        joi.validate(params, schema, function (err, result) {
            if (err) {
                reject(boom.badRequest(err));
            }

            resolve(result);
        });
    });
};

controller.find = function(params) {
    return new Promise(function(resolve, reject) {
        var options = {
            index: 'customelements',
            type: 'repo',
            body: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [
                                    { term: { 'owner.login': params.owner }},
                                    { term: { 'name.original': params.repo }}
                                ]
                            }
                        }
                    }
                }
            }
        };

        es.search(options).then(function(body) {
            resolve(body.hits.hits[0]._source);
        }, function (error) {
            reject(boom.create(error.status, error.message));
        });
    });
};

module.exports = controller;
