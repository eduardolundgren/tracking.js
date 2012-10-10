// requestAnimationFrame shim
(function() {
  var i = 0,
    lastTime = 0,
    vendors = ['ms', 'moz', 'webkit', 'o'];

  while (i < vendors.length && !window.requestAnimationFrame) {
    window.requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
    i++;
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime(),
        timeToCall = Math.max(0, 1000 / 60 - currTime + lastTime),
        id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);

      lastTime = currTime + timeToCall;
      return id;
    };
  }
}());

var App = {
  start: function(stream) {
    App.video.addEventListener('canplay', function() {
      App.video.removeEventListener('canplay');
      setTimeout(function() {
        App.video.play();
        App.canvas.style.display = 'inline';
        App.info.style.display = 'none';
        App.canvas.width = App.video.videoWidth;
        App.canvas.height = App.video.videoHeight;
        App.backCanvas.width = App.video.videoWidth / 4;
        App.backCanvas.height = App.video.videoHeight / 4;
        App.backContext = App.backCanvas.getContext('2d');

        var w = 300 / 4 * 0.8,
          h = 270 / 4 * 0.8;

        App.comp = [{
          x: (App.video.videoWidth / 4 - w) / 2,
          y: (App.video.videoHeight / 4 - h) / 2,
          width: w,
          height: h,
        }];

        App.drawToCanvas();
      }, 500);
    }, true);

    var domURL = window.URL || window.webkitURL;
    App.video.src = domURL ? domURL.createObjectURL(stream) : stream;
  },
  denied: function() {
    App.info.innerHTML = 'Camera access denied!<br>Please reload and try again.';
  },
  error: function(e) {
    if (e) {
      console.error(e);
    }
    App.info.innerHTML = 'Please go to about:flags in Google Chrome and enable the &quot;MediaStream&quot; flag.';
  },
  drawToCanvas: function() {
    requestAnimationFrame(App.drawToCanvas);

    var video = App.video,
      ctx = App.context,
      backCtx = App.backContext,
      m = 4,
      w = 4,
      i,
      comp;

    ctx.drawImage(video, 0, 0, App.canvas.width, App.canvas.height);

    backCtx.drawImage(video, 0, 0, App.backCanvas.width, App.backCanvas.height);

    comp = ccv.detect_objects(App.ccv = App.ccv || {
      canvas: App.backCanvas,
      cascade: cascade,
      interval: 4,
      min_neighbors: 1
    });

    if (comp.length) {
      App.comp = comp;
    }

    for (i = App.comp.length; i--; ) {
      ctx.drawImage(App.glasses, (App.comp[i].x - w / 2) * m, (App.comp[i].y - w / 2) * m, (App.comp[i].width + w) * m, (App.comp[i].height + w) * m);
    }
  }
};