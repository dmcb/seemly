module.exports = function(grunt) {
  grunt.initConfig({
    bower_concat: {
      all: {
        dest: {
          'js': '.tmp/bower.js'
        },
        include: [
          'moment'
        ],
        mainFiles: {
          'moment': 'moment.js'
        },
        bowerOptions: {
          relative: false
        }
      }
    },

    concat: {
      development: {
        src: [
          '.tmp/bower.js',
          'src/js/scripts.js'
        ],
        dest: 'app/assets/js/scripts.js'
      },
      production: {
        src: [
          '.tmp/bower.js',
          'src/js/scripts.js'
        ],
        dest: '.tmp/scripts.js'
      }
    },

    uglify: {
      all: {
        options: {
          mangle: true,
          compress: true
        },
        files: [{
          expand: true,
          cwd: '.tmp',
          src: ['scripts.js'],
          dest: 'app/assets/js',
          ext: '.js'
        }]
      }
    },

    sass: {
      development: {
        options: {
          sourceMap: true
        },
        files: [{
          expand: true,
          cwd: 'src/scss',
          src: ['*.scss'],
          dest: 'app/assets/css',
          ext: '.css'
        }]
      },
      production: {
        options: {
          outputStyle: 'compressed',
        },
        files: [{
          expand: true,
          cwd: 'src/scss',
          src: ['*.scss'],
          dest: 'app/assets/css',
          ext: '.css'
        }]
      }
    },

    watch: {
      grunt: {
        files: ['Gruntfile.js']
      },

      scripts: {
        files: ['src/js/**/*.js'],
        tasks: ['concat:development']
      },

      sass: {
        files: 'src/scss/**/*.scss',
        tasks: ['sass:development'],
        options: {
          livereload: true,
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', ['bower_concat', 'concat:production', 'uglify', 'sass:production']);
  grunt.registerTask('develop', ['bower_concat', 'concat:development', 'sass:development', 'watch']);
  grunt.registerTask('default', ['build']);
}
