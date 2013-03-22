module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*\n' +
        ' *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n' +
        ' *  <%= pkg.description %>\n' +
        ' *  <%= pkg.homepage %>\n\n' +
        ' *  Copyright (c) <%= grunt.template.today("yyyy") %>\n' +
        ' *  BSD License\n' +
        ' */'
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          'dist/tracking.min.js': ['src/tracking.js'],
          'dist/tracker/color/color.min.js': ['src/tracker/color/color.js'],
          'dist/tracker/human/human.min.js': ['src/tracker/human/human.js'],
          'dist/tracker/human/data/eye.min.js': ['src/tracker/human/data/eye.js'],
          'dist/tracker/human/data/frontal_face.min.js': ['src/tracker/human/data/frontal_face.js'],
          'dist/tracker/human/data/mouth.min.js': ['src/tracker/human/data/mouth.js'],
          'dist/tracker/human/data/upper_body.min.js': ['src/tracker/human/data/upper_body.js']
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 9001,
          keepalive: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('min', ['uglify']);
  grunt.registerTask('server', ['connect']);

};