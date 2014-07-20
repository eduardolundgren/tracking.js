'use strict';

var tracking = require('./utils/sandbox.js');

module.exports = {
  setUp: function(done) {
    done();
  },

  tearDown: function(done) {
    done();
  },

  testGetDescriptors: function(test) {
    var descriptors;
    var grayScale = [
      0, 0, 1, 0, 0, 0,
      1, 9, 0, 9, 1, 0,
      0, 1, 1, 1, 0, 0
    ];
    var repeat = [-7, 7, -6, 6, -5, 5, -1, 1];
    var width = 6;

    // Write the offsets manually, as we can't verify results that are obtained randomly.
    tracking.Brief.randomOffsets_[width] = [];
    for (var i = 0; i < tracking.Brief.N; i++) {
      var position = i % 4;
      tracking.Brief.randomOffsets_[width].push(repeat[position * 2], repeat[position * 2 + 1]);
    }

    descriptors = tracking.Brief.getDescriptors(grayScale, width, [1, 1, 3, 1]);

    test.equal(8, descriptors.length, 'There should be 8 descriptor words');

    for (var i = 0; i < 4; i++) {
      test.equal(858993459, descriptors[i], 'Descriptor should be 858993459');
    }
    for (var i = 5; i < 8; i++) {
      test.equal(-286331154, descriptors[i], 'Descriptor should be -286331154');
    }

    test.done();
  },

  testGetMatchings: function(test) {
    var descriptors1;
    var descriptors2;
    var grayScale1 = [
      0, 0, 1, 0, 0, 0,
      1, 9, 0, 9, 1, 0,
      0, 1, 1, 1, 0, 0
    ];
    var grayScale2 = [
      0, 0, 0, 1, 0, 0,
      0, 1, 9, 0, 9, 1,
      0, 0, 1, 1, 1, 0
    ];
    var keypoints1 = [1, 1, 3, 1];
    var keypoints2 = [4, 1, 2, 1];
    var matchings;
    var width = 6;

    descriptors1 = tracking.Brief.getDescriptors(grayScale1, width, keypoints1);
    descriptors2 = tracking.Brief.getDescriptors(grayScale2, width, keypoints2);

    matchings = tracking.Brief.match(keypoints1, descriptors1, keypoints2, descriptors2);

    test.equal(2, matchings.length, 'There should be 2 matchings');
    test.equal(1, matchings[0], 'Keypoint 0 from 1st array should match keypoint 1 from the 2nd');
    test.equal(0, matchings[1], 'Keypoint 1 from 1st array should match keypoint 0 from the 2nd');

    test.done();
  }
};
