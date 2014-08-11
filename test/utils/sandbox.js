'use strict';

var nodeunit = require('nodeunit');

var context = nodeunit.utils.sandbox([
    'build/tracking.js',
    'build/data/haarcascade_eye.min.js',
    'build/data/haarcascade_face.min.js',
    'build/data/haarcascade_mouth.min.js'], {
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  Int16Array: Int16Array,
  Int32Array: Int32Array,
  Int8Array: Int8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Uint32Array: Uint32Array,
  navigator: {},
  tracking: {},
  window: {}
});

module.exports = context.tracking;
