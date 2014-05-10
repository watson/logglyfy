# logglyfy

This is an opinionated thin wrapper around the de-facto [Loggly module by Nodejitsu](https://github.com/nodejitsu/node-loggly). The purpose of this wrapper is give you an easy interface for logging JSON objects. This module was build to suit my own needs, and may not be equally useful for everybody ;)

Assumptions:

* You already use a syslog drain to send regular STDOUT log entries to Loggly

Benefits of this module:

* Integrate Loggly into your app with only one line of code
* Add support for log-levels (debug, info, warn, error)
* Allow you to log to STDOUT **and** to Loggly at the same time

This module uses [convention over configuration](http://en.wikipedia.org/wiki/Convention_over_configuration), so expect sensible defaults in place of tidies configuration.

## Installation

```
npm install logglyfy
```

Configure the module using environment variables. The only required pieces of information needed are:

* `LOGGLY_TOKEN`
* `LOGGLY_SUBDOMAIN`

## Basic usage

The most basic useage of the Logglyfy module is logging a plain text message to STDOUT:

```javascript
var log = require('logglyfy');

log.info('this is a simple log entry');
```

Note that this will not directly send the log entry to Loggly. Instead it's expected that you already have a way of sending syslog to Loggly.

Log text to STDOUT and send JSON to Loggly at the same time:

```javascript
log.info('a user just signed in', { action: 'signin', user_id: 123 });
```

Logglyfy of cause supports printf-styled params:

```javascript
var userId = 123;
log.info('user %d signed in', userId, { action: 'signin', user_id: userId });
```

You can also tag your JSON Loggly entries, in this case with the tag `user`:

```javascript
log.info('a user just signed in', { action: 'signin', user_id: 123 }, ['user']);
```

You can of cause mix and match:

```javascript
var userId = 123;
var role = 'moderator';
log.info('user %d signed in (role: %s)', userId, role,
         { action: 'signin', user_id: userId, role: role },
         ['user']);
```

## Log levels

Logglyfy supports the following log-levels: debug, info, warn, and error

```javascript
log.debug(...); // ignored by default, set LOG_LEVEL=debug to enable
log.info(...);
log.warn(...);
log.error(...);
```

The level will be outputted to STDOUT along with the log message, e.g.

```javascript
log.warn('this is a warning'); // Output: [warn] this is a warning
```

The level will be added to the JSON object sent to Loggly along with a timestamp. The following code will send `{"level":"warn","timestamp":"2014-05-20T17:19:12.251Z","foo":true}` to Loggly:

```javascript
log.warn('this is a warning', { foo: true });
```

## Advanced usage

Optional environment variables:

* `LOG_LEVEL` - Set to `debug`, `info`, `warn`, or `error`
* `LOGGLY_TAGS` - a comma seperated list of [Loggly tags](https://www.loggly.com/docs/tags/) to add by default to all log-entries
* `LOGGLY_USERNAME` and `LOGGLY_PASSWORD` - the Nodejitsu Loggly module allows you to retrieve the customer information from the Loggly API. To support this the module needs your Loggly username and password. If you don't need this feature, there is no need to supply this information
