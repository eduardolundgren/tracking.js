'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var FILES = [
  'build/tracking.js',
  'build/data/eye.js',
  'build/data/face.js',
  'build/data/mouth.js'
];

var sandbox = {
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  Int16Array: Int16Array,
  Int32Array: Int32Array,
  Int8Array: Int8Array,
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Uint16Array: Uint16Array,
  Uint32Array: Uint32Array,
  navigator: {},
  tracking: {}
};

// The library attaches itself to `window`, and the training data files expect
// a `tracking` global, so `window` must be the sandbox global object itself.
sandbox.window = sandbox;

vm.createContext(sandbox);

FILES.forEach(function(file) {
  var filename = path.join(__dirname, '../..', file);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), sandbox, {
    filename: filename
  });
});

module.exports = sandbox.tracking;
