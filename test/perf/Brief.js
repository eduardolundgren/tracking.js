var PNG = require('png-js');
var tracking = require('../utils/sandbox.js');

var corners1;
var corners2;
var image1Gray;
var image2Gray;
var imageHeight = 192;
var imageWidth = 256;
var descriptors1;
var descriptors2;

module.exports = {
  setUp: function(done) {
    PNG.decode('test/assets/box1.png', function(pixels1) {
      image1Gray = tracking.Image.grayscale(pixels1, imageWidth, imageHeight);
      corners1 = tracking.Fast.findCorners(image1Gray, imageWidth, imageHeight);
      descriptors1 = tracking.Brief.getDescriptors(image1Gray, imageWidth, corners1);

      PNG.decode('test/assets/box2.png', function(pixels2) {
        image2Gray = tracking.Image.grayscale(pixels2, imageWidth, imageHeight);
        corners2 = tracking.Fast.findCorners(image2Gray, imageWidth, imageHeight);
        descriptors2 = tracking.Brief.getDescriptors(image2Gray, imageWidth, corners1);
        done();
      });
    });

  },

  testGetDescriptors: function() {
    tracking.Brief.getDescriptors(image1Gray, imageWidth, corners1);
  },

  testFindMatchingCorners: function() {
    tracking.Brief.match(corners1, descriptors1, corners2, descriptors2);
  }
};
