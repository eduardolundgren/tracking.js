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
        new tracking.ObjectTracker();
      }
    );

    test.done();
  },

  testConstructorClassifier: function(test) {
    test.doesNotThrow(
      function() {
        new tracking.ObjectTracker(tracking.ViolaJones.classifiers.face);
      }
    );

    test.done();
  },

  testConstructorString: function(test) {
    test.doesNotThrow(
      function() {
        new tracking.ObjectTracker('face');
      }
    );

    test.throws(
      function() {
        new tracking.ObjectTracker('notvalid');
      }
    );

    test.done();
  },

  testConstructorArray: function(test) {
    test.doesNotThrow(
      function() {
        new tracking.ObjectTracker([]);
      }
    );

    test.doesNotThrow(
      function() {
        new tracking.ObjectTracker([tracking.ViolaJones.classifiers.face]);
      }
    );

    test.doesNotThrow(
      function() {
        new tracking.ObjectTracker(['face', 'mouth', 'eye']);
      }
    );

    test.throws(
      function() {
        new tracking.ObjectTracker(['face', null, 'eye']);
      }
    );

    test.done();
  }
};
