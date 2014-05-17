'use strict';

process.env.LOGGLY_SUBDOMAIN = 'test-subdomain';
process.env.LOGGLY_TOKEN = 'test-token';

var assert   = require('assert');
var sinon    = require('sinon');
var loggly   = require('loggly');
var logglyfy = require('./index');

describe('logglyfy object', function () {
  it('should expose loggly', function () {
    assert(logglyfy.loggly instanceof loggly.Loggly);
  });

  it('should have 4 log levels', function () {
    assert.equal(typeof logglyfy.debug, 'function');
    assert.equal(typeof logglyfy.info,  'function');
    assert.equal(typeof logglyfy.warn,  'function');
    assert.equal(typeof logglyfy.error, 'function');
  });

  it('should alias info with log', function () {
    assert.equal(typeof logglyfy.log, 'function');
  });

  it('should expose core Loggly functions', function () {
    assert.equal(typeof logglyfy.search,    'function');
    assert.equal(typeof logglyfy.logglyUrl, 'function');
    assert.equal(typeof logglyfy.customer,  'function');
    assert.equal(typeof logglyfy.tagFilter, 'function');
  });

  ['log', 'debug', 'info', 'warn', 'error'].forEach(function (fn) {
    var level = fn === 'log' ? 'info' : fn;

    describe('#' + level + '()', function () {
      var toISOStringFn;

      beforeEach(function () {
        sinon.stub(console, 'log');
        sinon.stub(logglyfy.loggly, 'log');
        toISOStringFn = Date.prototype.toISOString;
        Date.prototype.toISOString = function () { return 'iso'; };
      });

      afterEach(function () {
        console.log.restore();
        logglyfy.loggly.log.restore();
        Date.prototype.toISOString = toISOStringFn;
      });

      describe('a simple log message', function () {
        it('should output it to STDOUT', function () {
          logglyfy[fn].call(logglyfy, 'foo');
          sinon.assert.calledOnce(console.log);
          sinon.assert.calledWith(console.log, '[%s] foo', level);
          sinon.assert.notCalled(logglyfy.loggly.log);
        });

        describe('with an extra JSON object', function () {
          it('should output it to STDOUT and send the JSON object to Loggly', function () {
            logglyfy[fn].call(logglyfy, 'foo', { bar: 1 });
            sinon.assert.calledOnce(console.log);
            sinon.assert.calledWith(console.log, '[%s] foo', level);
            sinon.assert.calledOnce(logglyfy.loggly.log);
            sinon.assert.calledWith(logglyfy.loggly.log, { bar: 1, level: level.toUpperCase(), timestamp: 'iso' }, undefined);
          });

          describe('with tags', function () {
            it('should output it to STDOUT and send the JSON object to Loggly with tags', function () {
              logglyfy[fn].call(logglyfy, 'foo', { bar: 1 }, ['tag']);
              sinon.assert.calledOnce(console.log);
              sinon.assert.calledWith(console.log, '[%s] foo', level);
              sinon.assert.calledOnce(logglyfy.loggly.log);
              sinon.assert.calledWith(logglyfy.loggly.log, { bar: 1, level: level.toUpperCase(), timestamp: 'iso' }, ['tag']);
            });
          });
        });
      });

      describe('a printf-style log message with params', function () {
        it('should output it to STDOUT using all the params', function () {
          logglyfy[fn].call(logglyfy, 'foo%s!', 'bar');
          sinon.assert.calledOnce(console.log);
          sinon.assert.calledWith(console.log, '[%s] foo%s!', level, 'bar');
          sinon.assert.notCalled(logglyfy.loggly.log);
        });

        it('should not interpret a trailing JSON object as an object to send to Loggly, if there\'s a printf-param for it', function () {
          logglyfy[fn].call(logglyfy, 'foo%s! %s', 'bar', { foo: 'bar' });
          sinon.assert.calledOnce(console.log);
          sinon.assert.calledWith(console.log, '[%s] foo%s! %s', level, 'bar', { foo: 'bar' });
          sinon.assert.notCalled(logglyfy.loggly.log);
        });

        it('should not interpret a trailing JSON object and array as an object an tags to send to Loggly, if there\'s a printf-param for them', function () {
          logglyfy[fn].call(logglyfy, 'foo%s! %s %s', 'bar', { foo: 'bar' }, ['not a tag']);
          sinon.assert.calledOnce(console.log);
          sinon.assert.calledWith(console.log, '[%s] foo%s! %s %s', level, 'bar', { foo: 'bar' }, ['not a tag']);
          sinon.assert.notCalled(logglyfy.loggly.log);
        });

        describe('with an extra JSON object', function () {
          it('should output it to STDOUT using all the params and send the JSON object to Loggly', function () {
            logglyfy[fn].call(logglyfy, 'foo%s!', 'bar', { bar: 1 });
            sinon.assert.calledOnce(console.log);
            sinon.assert.calledWith(console.log, '[%s] foo%s!', level, 'bar');
            sinon.assert.calledOnce(logglyfy.loggly.log);
            sinon.assert.calledWith(logglyfy.loggly.log, { bar: 1, level: level.toUpperCase(), timestamp: 'iso' }, undefined);
          });

          describe('with tags', function () {
            it('should output it to STDOUT using all the params and send the JSON object to Loggly with tags', function () {
              logglyfy[fn].call(logglyfy, 'foo%s!', 'bar', { bar: 1 }, ['tag']);
              sinon.assert.calledOnce(console.log);
              sinon.assert.calledWith(console.log, '[%s] foo%s!', level, 'bar');
              sinon.assert.calledOnce(logglyfy.loggly.log);
              sinon.assert.calledWith(logglyfy.loggly.log, { bar: 1, level: level.toUpperCase(), timestamp: 'iso' }, ['tag']);
            });
          });
        });
      });
    });
  });
});
