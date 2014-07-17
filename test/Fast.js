'use strict';

var tracking = require('./utils/sandbox.js');

module.exports = {
  setUp: function(done) {
    done();
  },

  tearDown: function(done) {
    done();
  },

  testCornerDetection: function(test) {
    test.ok(
      tracking.Fast.isCorner(
        150,
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255],
        10
      ),
      'A corner should have been detected'
    );

    test.equal(
      false,
      tracking.Fast.isCorner(
        150,
        [0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255],
        10
      ),
      'No corners should have been detected'
    );

    test.done();
  },

  testFindCorners: function(test) {
    var corners,
      pixels = [];

    for (var i = 0; i < 64; i++) {
      if (i === 27 || i === 28) {
        pixels.push(0);
      }
      else {
        pixels.push(255);
      }
    }

    corners = tracking.Fast.findCorners(pixels, 8, 8);
    test.equal(
      2,
      corners.length,
      'Should have found 2 corners'
    );
    test.equal(
      3,
      corners[0],
      'Corner should at x = 3'
    );
    test.equal(
      3,
      corners[1],
      'Corner should be at y = 3'
    );

    test.done();
  }
};
