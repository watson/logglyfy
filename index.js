'use strict';

var util   = require('util');
var loggly = require('loggly');

var levels = ['debug', 'info', 'warn', 'error'];
var level = levels.indexOf(process.env.LOG_LEVEL);
if (level === -1)
  level = 1;

var config = {
  token: process.env.LOGGLY_TOKEN,
  subdomain: process.env.LOGGLY_SUBDOMAIN,
  json: true
};

if (process.env.LOGGLY_USERNAME)
  config.auth = {
    username: process.env.LOGGLY_USERNAME,
    password: process.env.LOGGLY_PASSWORD
  };

if (process.env.LOGGLY_TAGS)
  config.tags = process.env.LOGGLY_TAGS.split(',')

var client = loggly.createClient(config);

var send = function (obj, tags, retryIn) {
  if (!retryIn) retryIn = 1000; // ms

  client.log(obj, tags, function (err, result) {
    if (!err) {
      if (result.response === 'ok') return;
      err = new Error('Unexpected Loggly API response: ' + result.response);
    }

    var shouldRetry = retryIn < 10*60*1000,
        action = shouldRetry ? 'retrying' : 'aborting';

    console.warn('Error communicating with Loggly (%s): %s', action, err.message);

    if (shouldRetry)
      setTimeout(send.bind(null, obj, tags, retryIn * 2), retryIn);
  });
};

// log('info', 'text message')
// log('info', 'text message', { foo: 1 })
// log('info', 'text message', { foo: 1 }, ['my_tag'])
// log('info', 'text message with %s', 'params')
// log('info', 'text message with %s', 'params', { foo: 1 })
// log('info', 'text message with %s', 'params', { foo: 1 }, ['my_tag'])
var log = function (level, msg) { // optinal arguments: vals..., json, tags
  if (levels.indexOf(level) < level) return;

  var args = Array.prototype.slice.call(arguments, 2),
      tags = args[args.length-1],
      json = args[args.length-2];

  if (Array.isArray(tags)) {
    args = args.slice(0, -1);
  } else {
    json = tags;
    tags = undefined;
  }

  if (typeof json === 'object')
    args = args.slice(0, -1);
  else
    json = undefined;

  console.log.apply(console, ['[%s] ' + msg, level].concat(args));

  if (json) {
    json.timestamp = new Date().toISOString();
    json.level = level.toUpperCase();
    send(json, tags);
  }
};

levels.forEach(function (level) {
  exports[level] = log.bind(null, level);
});
exports.log = log.bind(null, 'info'); // alias

// expose the regular loggly client
exports.loggly    = client;

// short aliases to avoid going through exports.loggly
exports.search    = client.search.bind(client);
exports.logglyUrl = client.logglyUrl.bind(client);
exports.customer  = client.customer.bind(client);
exports.tagFilter = client.tagFilter.bind(client);
