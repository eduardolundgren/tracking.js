var buildDir = require('path').resolve(__dirname, './build/');
var nodeunit = require('nodeunit');

var context = nodeunit.utils.sandbox([
    buildDir + '/tracking.js',
    buildDir + '/data/eye.js',
    buildDir + '/data/face.js',
    buildDir + '/data/mouth.js'], {
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
