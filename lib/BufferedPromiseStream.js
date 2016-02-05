'use strict';

var util = require('util');

function EndOfStream () {
    Error.call(this);
    this.name = 'EndOfStream';
}
util.inherits(EndOfStream, Error);

/**
 * BufferedPromiseStream constructor
 *
 * @param {function} fn, the function to apply to each argument.
 * @param {array} args, an array of arguments.
 * @param {number} bufSize, the target number of results to buffer. Default: 5.
 * @param {number} maxConcurrency, the maximum number of concurrent operations
 * to start. Default: bufSize.
 */
function BufferedPromiseStream (fn, args, bufSize, maxConcurrency) {
    if (!Array.isArray(args)) {
        throw new Error('Expected args to be an array.');
    }
    this._buf = [];
    this._fn = fn;
    this._i = 0;
    this._args = args;
    this._remaining = args.length;
    this._bufSize = bufSize || 5;
    this._concurrency = 0;
    this._maxConcurrency = maxConcurrency || bufSize;
    this._waiters = [];
}


/**
 * Read the next result from the promise stream.
 *
 * @return {Promise}
 */
BufferedPromiseStream.prototype.next = function() {
    var self = this;

    this._startRequests();
    if (this._buf.length) {
        return Promise.resolve(this._buf.shift());
    } else if (self._remaining > 0) {
        return new Promise(function(resolve, reject) {
            self._waiters.push({
                resolve: resolve,
                reject: reject
            });
        });
    } else {
        return Promise.reject(new EndOfStream());
    }
};

// Expose the EndOfStreamError constructor for ease of detection.
BufferedPromiseStream.prototype.EndOfStream = EndOfStream;

/**
 * Private implementation from here.
 */

BufferedPromiseStream.prototype._unprocessed = function() {
    return this._args.length - this._i
};

BufferedPromiseStream.prototype._startRequests = function() {
    while (this._unprocessed() > 0 && this._concurrency < this._maxConcurrency) {
        //console.log('start', self._concurrency);
        this._concurrency++;
        var arg = this._args[this._i];
        this._i++;
        this._fn(arg).then(this._handleResult.bind(this));
    }
};

BufferedPromiseStream.prototype._handleResult = function(res) {
    //console.log('end', self._concurrency);
    this._remaining--;
    this._concurrency--;
    if (this._waiters.length) {
        this._waiters.shift().resolve(res);
    } else {
        this._buf.push(res);
    }
    if (this._buf.length < this._bufSize) {
        this._startRequests();
    }
};


module.exports = BufferedPromiseStream;
