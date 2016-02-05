var Promise = require('bluebird');
var BPS = require('../lib/BufferedPromiseStream');
var assert = require('assert');

module.exports = {
    'Edge cases': {
        'empty args': () => {
            var bps = new BPS(a => Promise.resolve(a), [], 10);
            return bps.next()
            .catch(err => {
                if (err.name !== 'EndOfStream') {
                    throw new Error("Should throw EndOfStream");
                }
            });
        },
        'single arg': () => {
            var bps = new BPS(a => Promise.resolve(a), ['foo'], 10);
            return bps.next()
            .then(res => {
                assert.equal(res, 'foo');
                return bps.next();
            })
            .catch(err => {
                if (err.name !== 'EndOfStream') {
                    throw new Error("Should throw EndOfStream");
                }
            });
        },
    }
};
