'use strict';

var tracking = require('./utils/sandbox.js');

module.exports = {
  setUp: function(done) {
    done();
  },

  tearDown: function(done) {
    done();
  },

  testBlurOutputFeedsGrayscale: function(test) {
    var width = 8;
    var height = 8;

    // A uniform gray RGBA image; blurring it must not change it.
    var pixels = new Uint8ClampedArray(width * height * 4);
    for (var i = 0; i < pixels.length; i += 4) {
      pixels[i] = 100;
      pixels[i + 1] = 100;
      pixels[i + 2] = 100;
      pixels[i + 3] = 255;
    }

    var blurred = tracking.Image.blur(pixels, width, height, 3);

    test.equal(pixels.length, blurred.length, 'Blur should preserve the RGBA layout');

    // grayscale() reinterprets its input buffer as 8-bit RGBA, so blur must
    // return byte data, not raw convolution floats.
    var gray = tracking.Image.grayscale(blurred, width, height);
    for (var j = 0; j < gray.length; j++) {
      if (gray[j] !== 100) {
        test.equal(100, gray[j], 'Grayscale of a blurred uniform image should stay uniform');
        break;
      }
    }

    test.done();
  }
};
