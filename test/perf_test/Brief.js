var PNG = require('png-js');
var tracking = require('../utils/sandbox.js');

var corners1;
var corners2;
var image1Gray;
var image2Gray;
var imageHeight = 192;
var imageWidth = 256;

module.exports = {
  setUp: function(done) {
    PNG.decode('test/assets/box1.png', function(pixels1) {
      image1Gray = tracking.Image.grayscale(pixels1, imageWidth, imageHeight);
      corners1 = tracking.Fast.findCorners(image1Gray, imageWidth, imageHeight);

      PNG.decode('test/assets/box2.png', function(pixels2) {
        image2Gray = tracking.Image.grayscale(pixels2, imageWidth, imageHeight);
        corners2 = tracking.Fast.findCorners(image2Gray, imageWidth, imageHeight);

        done();
      });
    });
  },

  testGetDescriptors: function() {
    tracking.Brief.getDescriptors(image1Gray, imageWidth, corners1);
  },

  testFindMatchingCorners: function() {
    var descriptors1 = tracking.Brief.getDescriptors(image1Gray, imageWidth, corners1);
    var descriptors2 = tracking.Brief.getDescriptors(image2Gray, imageWidth, corners2);

    tracking.Brief.match(corners1, descriptors1, corners2, descriptors2);
  }
};
