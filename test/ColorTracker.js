'use strict';

var tracking = require('./utils/sandbox.js');

module.exports = {
  setUp: function(done) {
    done();
  },

  tearDown: function(done) {
    done();
  },

  testConstructorEmpty: function(test) {
    test.doesNotThrow(
      function() {
        new tracking.ColorTracker();
      }
    );

    test.done();
  },

  testConstructorString: function(test) {
    test.doesNotThrow(
      function() {
        new tracking.ColorTracker('yellow');
      }
    );

    test.throws(
      function() {
        new tracking.ColorTracker('notvalid');
      }
    );

    test.done();
  },

  testConstructorArray: function(test) {
    test.doesNotThrow(
      function() {
        new tracking.ColorTracker([]);
      }
    );

    test.doesNotThrow(
      function() {
        new tracking.ColorTracker(['magenta', 'cyan', 'yellow']);
      }
    );

    test.throws(
      function() {
        new tracking.ColorTracker(['magenta', null, 'yellow']);
      }
    );

    test.done();
  }
};
