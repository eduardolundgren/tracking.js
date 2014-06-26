'use strict';
var gulp = require('gulp');
var concat = require('gulp-concat');
var header = require('gulp-header');
var jshint = require('gulp-jshint');
var nodeunit = require('gulp-nodeunit');
var pkg = require('./package.json');
var rename = require('gulp-rename');
var rimraf = require('gulp-rimraf');
var stylish = require('jshint-stylish');
var uglify = require('gulp-uglify');

gulp.task('all', ['clean', 'build', 'build-data']);

gulp.task('clean', function() {
  return gulp.src('build', {
    read: false
  })
  .pipe(rimraf());
});

gulp.task('build', function() {
  var files = [
    'src/tracking.js',
    'src/Brief.js',
    'src/Canvas.js',
    'src/EPnP.js',
    'src/Fast.js',
    'src/Math.js',
    'src/Matrix.js',
    'src/Tracker.js',
    'src/ColorTracker.js',
    'src/HumanTracker.js'
  ];

  return gulp.src(files)
    .pipe(concat('tracking.js'))
    .pipe(banner())
    .pipe(gulp.dest('build'))
    .pipe(uglify())
    .pipe(rename(function(filepath) {
      filepath.basename += '-min';
    }))
    .pipe(banner())
    .pipe(gulp.dest('build'));
});

gulp.task('build-data', function() {
  return gulp.src('src/data/**.js')
    .pipe(banner())
    .pipe(gulp.dest('build/data'))
    .pipe(rename(function(filepath) {
      filepath.basename += '-min';
    }))
    .pipe(uglify())
    .pipe(banner())
    .pipe(gulp.dest('build/data'));
});

gulp.task('lint', function() {
  return gulp.src('src/**.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('test', function() {
  return gulp.src('test/*.js').pipe(nodeunit());
});

gulp.task('test-watch', function() {
  return gulp.watch(['src/*.js', 'test/**/*.js'], ['test']);
});

gulp.task('watch', function() {
  gulp.watch('src/*.js', ['build']);
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
