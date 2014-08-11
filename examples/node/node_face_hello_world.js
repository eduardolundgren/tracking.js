'use strict';

var Canvas = require('canvas')
  , nodeunit = require('nodeunit')
  , Image = Canvas.Image
  , fs = require('fs')
  , path = require('path')
  , assetsDir = path.resolve(__dirname, '../assets')
  , tracking = require('../../index');

/**
 * Plots a RECT centered in the faces.
 */
function plot (context, x, y, w, h) {
  context.beginPath();
  context.rect(x, y, w, h);
  context.lineWidth = 2;
  context.strokeStyle = '#a64ceb';
  context.stroke();

  return context;
}

// Creating an `image` element.
var img = new Image();
img.src = fs.readFileSync(assetsDir + '/faces.jpg');

// Creating the Canvas element
var canvas = new Canvas(img.width, img.height);
var ctx = canvas.getContext('2d');

// Drawing the image to the canvas
ctx.drawImage(img, 0, 0);

// Initialize trackingJS
var tracker = new tracking.ObjectTracker(['face']);
tracker.setStepSize(1.7);

tracker.on('track', function (event) {
  event.data.forEach(function (rect) {
    plot(ctx, rect.x, rect.y, rect.width, rect.height);
  });
});

tracking.trackCanvas_(canvas, tracker);

// Write the new image with rect around the faces.
var out = fs.createWriteStream(assetsDir + '/faces-found.png');
var stream = canvas.createPNGStream();

stream.on('data', function (chunk) {
  out.write(chunk);
});

stream.on('end', function () {
  console.log('Wrote to ' + assetsDir + '/faces-mod.png');
});
