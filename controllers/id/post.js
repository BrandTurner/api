var boom = require('boom');
var joi = require('joi');
var es = require('../../configs/es');
var token = require('../../utils/token');

function controller(request, reply) {
    token.authorize(request)
        .then(function(result) {
            console.log('[#token.authorize] Done with promise');
            return controller.validate(result);
        })
        .then(function(result) {
            console.log('[#validate] Done with promise');
            return controller.createByID(result);
        })
        .then(function(result) {
            console.log('[#createByID] Done with promise');
            return reply(result);
        })
        .catch(reply);
}

controller.validate = function(request) {
    return new Promise(function(resolve, reject) {
        var payload = JSON.parse(request.payload);

        var params = {
            id: request.params.id,
            payload: JSON.parse(request.payload)
        };

        var schema = {
            id: joi.number(),
            payload: joi.object()
        };

        joi.validate(params, schema, function (err, result) {
            if (err) {
                reject(boom.badRequest(err));
            }

            resolve(result);
        });
    });
};

controller.createByID = function(params) {
    return new Promise(function(resolve, reject) {
        var options = {
            index: 'customelements',
            type: 'repo',
            id: params.id,
            body: params.payload
        };

        es.create(options).then(function(body) {
            resolve({ created: body.created });
        }, function (error) {
            reject(boom.create(error.status, error.message));
        });
    });
};

module.exports = controller;
