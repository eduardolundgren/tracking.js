var PNG = require('png-js');
var tracking = require('../utils/sandbox.js');

var image;
var imageHeight = 600;
var imageWidth = 348;

module.exports = {
  setUp: function(done) {
    PNG.decode('test/assets/faces.png', function(pixels) {
      image = pixels;
      done();
    });
  },

  testFindFaces: function() {
    var tracker = new tracking.ObjectTracker(['face']);
    tracker.setStepSize(2);
    tracker.track(image, imageWidth, imageHeight);
  },

  testFindEyes: function() {
    var tracker = new tracking.ObjectTracker(['eye']);
    tracker.setStepSize(2);
    tracker.track(image, imageWidth, imageHeight);
  },

  testFindMouths: function() {
    var tracker = new tracking.ObjectTracker(['mouth']);
    tracker.setStepSize(2);
    tracker.track(image, imageWidth, imageHeight);
  }
};
