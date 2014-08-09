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
    var colors;
    var tracker;

    test.doesNotThrow(function() {
      tracker = new tracking.ColorTracker();
    });

    colors = tracker.getColors();
    test.equal(1, colors.length, 'Colors array should have a single value');
    test.equal('magenta', colors[0], 'Default color is magenta');

    test.done();
  },

  testConstructorString: function(test) {
    var colors;
    var tracker;

    test.doesNotThrow(function() {
      tracker = new tracking.ColorTracker('yellow');
    });

    colors = tracker.getColors();
    test.equal(1, colors.length, 'Colors array should have a single value');
    test.equal('yellow', colors[0], 'The colors array should be set to value in the constructor');

    test.throws(function() {
      tracker = new tracking.ColorTracker('notvalid');
    });

    test.done();
  },

  testConstructorArray: function(test) {
    var colors;
    var tracker;

    test.doesNotThrow(function() {
      tracker = new tracking.ColorTracker([]);
    });

    colors = tracker.getColors();
    test.equal(0, colors.length, 'Colors array should be empty');

    test.doesNotThrow(function() {
      tracker = new tracking.ColorTracker(['magenta', 'cyan', 'yellow']);
    });

    colors = tracker.getColors();
    test.equal(3, colors.length, 'Colors array have 3 values');
    test.equal('magenta', colors[0], 'The colors array should be set to values in the constructor');
    test.equal('cyan', colors[1], 'The colors array should be set to values in the constructor');
    test.equal('yellow', colors[2], 'The colors array should be set to values in the constructor');

    test.throws(function() {
      tracker = new tracking.ColorTracker(['magenta', null, 'yellow']);
    });

    test.done();
  },

  testFindColor: function(test) {
    var colors;
    var pixels;
    var tracker;

    tracking.ColorTracker.registerColor('black', function(r, g, b) {
      return r === 0 && g === 0 && b === 0;
    });

    tracker = new tracking.ColorTracker('black');
    colors = tracker.getColors();

    test.equal(1, colors.length, 'Colors array have a single value');
    test.equal('black', colors[0], 'The colors array should be set to values in the constructor');

    tracker.setMinDimension(2);
    tracker.setMinGroupSize(6);

    pixels = [
      1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1,
      1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    ];

    tracker.on('track', function(event) {
      test.equal(1, event.data.length, 'There should only be one result rectangle');
      test.equal(1, event.data[0].x, 'The first rectangle should be at x = 1');
      test.equal(0, event.data[0].y, 'The first rectangle should be at y = 0');
      test.equal(2, event.data[0].width, 'The first rectangle\'s width should be 2');
      test.equal(3, event.data[0].height, 'The first rectangle\'s height should be 3');

      test.done();
    });

    tracker.track(pixels, 5, 4);
  },

  testMergedRectangles: function(test) {
    var pixels;
    var tracker;

    tracking.ColorTracker.registerColor('black', function(r, g, b) {
      return r === 0 && g === 0 && b === 0;
    });

    tracker = new tracking.ColorTracker('black');
    tracker.setMinDimension(1);
    tracker.setMinGroupSize(6);

    pixels = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0
    ];

    tracker.on('track', function(event) {
      test.equal(2, event.data.length, 'There should be 2 result rectangles');
      test.equal(0, event.data[0].x, 'The first rectangle should be at x = 0');
      test.equal(0, event.data[0].y, 'The first rectangle should be at y = 0');
      test.equal(5, event.data[0].width, 'The first rectangle\'s width should be 5');
      test.equal(6, event.data[0].height, 'The first rectangle\'s height should be 6');
      test.equal(2, event.data[1].x, 'The second rectangle should be at x = 2');
      test.equal(8, event.data[1].y, 'The second rectangle should be at y = 8');
      test.equal(1, event.data[1].width, 'The second rectangle\'s width should be 1');
      test.equal(2, event.data[1].height, 'The second rectangle\'s height should be 2');

      test.done();
    });

    tracker.track(pixels, 6, 11);
  },

  testDimensionConstraints: function(test) {
    var pixels;
    var tracker;

    tracking.ColorTracker.registerColor('black', function(r, g, b) {
      return r === 0 && g === 0 && b === 0;
    });

    tracker = new tracking.ColorTracker('black');
    tracker.setMinDimension(1);
    tracker.setMaxDimension(2);
    tracker.setMinGroupSize(6);

    pixels = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0
    ];

    tracker.on('track', function(event) {
      test.equal(1, event.data.length, 'There should be 1 result rectangle');
      test.equal(1, event.data[0].width, 'The rectangle\'s width should be 1');
      test.equal(2, event.data[0].height, 'The rectangle\'s height should be 2');

      test.done();
    });

    tracker.track(pixels, 6, 11);
  }
};
