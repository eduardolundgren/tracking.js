var PNG = require('png-js');
var tracking = require('../utils/sandbox.js');

var image;
var imageHeight = 550;
var imageWidth = 732;

module.exports = {
  setUp: function(done) {
    PNG.decode('test/assets/psmove.png', function(pixels) {
      image = pixels;
      done();
    });
  },

  testFindColors: function() {
    var tracker = new tracking.ColorTracker(['magenta', 'cyan', 'yellow']);
    tracker.track(image, imageWidth, imageHeight);
  }
};
