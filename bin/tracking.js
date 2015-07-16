#!/usr/bin/env node
'use strict';

const Canvas = require('canvas');
const Image = Canvas.Image;
const fs = require('fs');
const path = require('path')
const tracking = require('../index');
const argv = require('./cli');

var img = new Image();
var canvas = new Canvas(200, 200);
var ctx = canvas.getContext('2d');
var tracker = new tracking.ObjectTracker(['face']);

tracker.setStepSize(1.7);
tracker.on('track', function (evt) {
  evt.data.forEach(function (rect) {
    console.log(rect);
  });
});

argv.filenames.map(function (fname) {
  img.src = fs.readFileSync(fname);
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  tracking.trackCanvas_(canvas, tracker);
});

