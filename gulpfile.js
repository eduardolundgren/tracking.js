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

gulp.task('all', ['clean'], function() {
  return runSequence(['build', 'build-data']);
});

gulp.task('clean', function() {
  return gulp.src('build').pipe(rimraf());
});

gulp.task('build', function() {
  var files = [
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

  return gulp.src(files)
    .pipe(concat('tracking.js'))
    .pipe(banner())
    .pipe(gulp.dest('build'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '-min'
    }))
    .pipe(banner())
    .pipe(gulp.dest('build'));
});

gulp.task('build-data', function() {
  return gulp.src('src/detection/training/haar/**.js')
    .pipe(banner())
    .pipe(gulp.dest('build/data'))
    .pipe(rename({
      suffix: '-min'
    }))
    .pipe(uglify())
    .pipe(banner())
    .pipe(gulp.dest('build/data'));
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
