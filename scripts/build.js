'use strict';

/**
 * Build script for tracking.js.
 *
 * Concatenates the source files into build/tracking.js, minifies it into
 * build/tracking-min.js and copies/minifies the haar training data into
 * build/data. Replaces the old gulp pipeline with no build framework.
 */

var fs = require('fs');
var path = require('path');
var terser = require('terser');
var pkg = require('../package.json');

var ROOT = path.join(__dirname, '..');
var BUILD_DIR = path.join(ROOT, 'build');
var DATA_DIR = path.join(BUILD_DIR, 'data');

var FILES = [
  'src/tracking.js',
  'src/utils/EventEmitter.js',
  'src/utils/Canvas.js',
  'src/utils/DisjointSet.js',
  'src/utils/Image.js',
  'src/detection/ViolaJones.js',
  'src/features/Brief.js',
  'src/features/Fast.js',
  'src/math/Math.js',
  'src/math/Matrix.js',
  'src/pose/EPnP.js',
  'src/trackers/Tracker.js',
  'src/trackers/TrackerTask.js',
  'src/trackers/ColorTracker.js',
  'src/trackers/ObjectTracker.js',
  'src/trackers/LandmarksTracker.js',
  'src/alignment/Regressor.js',
  'src/alignment/LBF.js'
];

var BANNER = [
  '/**',
  ' * ' + pkg.name + ' - ' + pkg.description,
  ' * @author ' + pkg.author.name + ' <' + pkg.author.email + '>',
  ' * @version v' + pkg.version,
  ' * @link ' + pkg.homepage,
  ' * @license ' + pkg.license,
  ' */',
  ''
].join('\n');

function minify(source, filename) {
  return terser.minify(source, { ecma: 5 }).then(function(result) {
    if (result.error) {
      throw result.error;
    }
    fs.writeFileSync(filename, BANNER + result.code + '\n');
  });
}

function buildLibrary() {
  var source = FILES.map(function(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
  }).join('\n');

  fs.writeFileSync(path.join(BUILD_DIR, 'tracking.js'), BANNER + source);
  return minify(source, path.join(BUILD_DIR, 'tracking-min.js'));
}

function buildData() {
  var haarDir = path.join(ROOT, 'src/detection/training/haar');
  return Promise.all(fs.readdirSync(haarDir).filter(function(file) {
    return /\.js$/.test(file);
  }).map(function(file) {
    var source = fs.readFileSync(path.join(haarDir, file), 'utf8');
    var name = path.basename(file, '.js');

    fs.writeFileSync(path.join(DATA_DIR, name + '.js'), BANNER + source);
    return minify(source, path.join(DATA_DIR, name + '-min.js'));
  }));
}

fs.rmSync(BUILD_DIR, { recursive: true, force: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

Promise.all([buildLibrary(), buildData()]).then(function() {
  console.log('Build complete.');
}).catch(function(err) {
  console.error(err);
  process.exit(1);
});
