var PNG = require('png-js');
var tracking = require('../utils/sandbox.js');

var image;
var imageGray;
var imageHeight = 192;
var imageWidth = 256;

module.exports = {
  setUp: function(done) {
    PNG.decode('test/assets/box1.png', function(pixels) {
      image = pixels;
      imageGray = tracking.Image.grayscale(image, imageWidth, imageHeight);

      done();
    });
  },

  testFindCorners: function() {
    tracking.Fast.findCorners(imageGray, imageWidth, imageHeight);
  }
};
