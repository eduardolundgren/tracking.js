var fs = require('fs');
var Canvas = require('canvas');
var Image = Canvas.Image;
var path = require('path');
var tracking = require('../index');
var img, canvas, ctx;


module.exports = {
  trackingFromCanvas: {
    setUp: function (done) {
      img = new Image();
      img.src = fs.readFileSync(path.resolve(__dirname, './assets/faces.png'));
      canvas = new Canvas(img.width, img.height);
      ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      done();
    },

    findFaces: function(test) {
      test.expect(1);
      var tracker = new tracking.ObjectTracker(['face']);

      tracker.on('track', function (ev) {
        test.equal(ev.data.length, 3);
        test.done();
      });
      tracking.trackCanvas_(canvas, tracker);
    }
  }
};
