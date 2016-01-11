'use strict';
var gulp = require('gulp');
var concat = require('gulp-concat');
var header = require('gulp-header');
var jsdoc = require('gulp-jsdoc');
var jshint = require('gulp-jshint');
var nodeunit = require('gulp-nodeunit');
var pkg = require('./package.json');
var rename = require('gulp-rename');
var rimraf = require('gulp-rimraf');
var stylish = require('jshint-stylish');
var uglify = require('gulp-uglify');
var esformatter = require('gulp-esformatter');
var runSequence = require('run-sequence');
var inject = require('gulp-inject');

const codeFiles = [
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
  'src/trackers/ObjectTracker.js'
];

const dataFiles = ['src/detection/training/haar/**.js'];

const allFiles = codeFiles.concat(dataFiles);

//Alias for build; keeping it in to preserve compatability
gulp.task('all', ['build'], function() {});

//Alias for test-unit
gulp.task('default', ['test-unit'], function() {});


gulp.task('clean', function() {
  return gulp.src('build').pipe(rimraf());
});

//This is a sort of low-budget browserify.  it puts all the independent files
//  inside a single function which exports (or not) the module definition.
//  This way, you can just require tracking as a module via browserify or
//  webpack or whatever. (This approach also minimizes the changes)
gulp.task('build', ['clean'], function() {

  var iOptions = {
    starttag:"'begin_injection';",
    endtag:"'end_injection';",
    transform: function (filePath, file) {
      return file.contents.toString('utf8');
    }
  };
  return gulp.src('src/nodeShim.js')
             .pipe(inject(gulp.src(allFiles),iOptions))
             .pipe(banner())
             .pipe(rename("tracking.js"))
             .pipe(gulp.dest('build'))
             .pipe(uglify())
             .pipe(rename({suffix: '-min'}))
             .pipe(banner())
             .pipe(gulp.dest('build'));
});

gulp.task('docs', function() {
  return gulp.src(['src/**/*.js', 'README.md'])
    .pipe(jsdoc('docs'));
});

gulp.task('format', function() {
  return gulp.src(['src/**/*.js', '!src/detection/training/**/*.js'])
    .pipe(esformatter())
    .pipe(gulp.dest('src'));
});

gulp.task('lint', function() {
  return gulp.src('src/**/**.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('test', function(cb) {
  gulp.src('test/*.js')
    .pipe(nodeunit())
    .on('end', cb);
});

//Excluding benchmark for quick cycling.
gulp.task('test-unit', ['build'], function() {
  return gulp.src(['test/*.js','!test/Benchmark.js'])
             .pipe(nodeunit());
});


gulp.task('test-watch', function() {
  return gulp.watch(['src/**/*.js', 'test/**/*.js'], ['test']);
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['build']);
  gulp.watch('src/data/*.js', ['build-data']);
});

// Private helpers
// ===============

function banner() {
  var stamp = [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @author <%= pkg.author.name %> <<%= pkg.author.email %>>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''
  ].join('\n');

  return header(stamp, { pkg: pkg });
}
