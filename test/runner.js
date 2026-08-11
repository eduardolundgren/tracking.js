'use strict';

/**
 * Minimal nodeunit-compatible test runner on top of node:test.
 *
 * Each test file exports an object of `function(test) {...}` cases plus
 * optional setUp/tearDown hooks, in the classic nodeunit style. This runner
 * adapts that shape to node's built-in test runner so the suite runs on any
 * modern Node without external dependencies.
 *
 * Usage: node test/runner.js [files...]
 */

var assert = require('node:assert');
var path = require('node:path');
var test = require('node:test');

var DEFAULT_FILES = [
  'Brief.js',
  'ColorTracker.js',
  'Fast.js',
  'ObjectTracker.js'
];

var files = process.argv.slice(2);
if (files.length === 0) {
  files = DEFAULT_FILES;
}

function createTestObject(resolve, reject) {
  return {
    ok: assert.ok,
    equal: assert.equal,
    equals: assert.equal,
    notEqual: assert.notEqual,
    strictEqual: assert.strictEqual,
    deepEqual: assert.deepEqual,
    throws: assert.throws,
    doesNotThrow: assert.doesNotThrow,
    ifError: assert.ifError,
    expect: function() {},
    done: resolve,
    fail: function(message) {
      reject(new assert.AssertionError({ message: message }));
    }
  };
}

function runHook(hook) {
  return new Promise(function(resolve) {
    if (hook) {
      hook(resolve);
    } else {
      resolve();
    }
  });
}

files.forEach(function(file) {
  var suite = require(path.resolve(__dirname, file));
  var name = path.basename(file, '.js');

  Object.keys(suite).forEach(function(key) {
    if (key === 'setUp' || key === 'tearDown') {
      return;
    }

    test(name + ': ' + key, function() {
      return runHook(suite.setUp).then(function() {
        return new Promise(function(resolve, reject) {
          try {
            suite[key](createTestObject(resolve, reject));
          } catch (err) {
            reject(err);
          }
        });
      }).then(function() {
        return runHook(suite.tearDown);
      });
    });
  });
});
