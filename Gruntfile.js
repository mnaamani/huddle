module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    nodemon: {
      dev: {
        script: 'server.js'
      }
    },

    shell: {
      prodServer: {
      }
    },

    gitpush: {
      production: {
        options: {
          remote: 'origin',
          branch: 'master'
        }
      }

    }

  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-git');

  grunt.registerTask('server-dev', function (target) {
    // Running nodejs in a different process and displaying output on the main console
    var nodemon = grunt.util.spawn({
         cmd: 'grunt',
         grunt: true,
         args: 'nodemon'
    });
    nodemon.stdout.pipe(process.stdout);
    nodemon.stderr.pipe(process.stderr);

  });


  grunt.registerTask('build', [

  ]);

  grunt.registerTask('upload', function(n) {
    if(grunt.option('prod')) {
      // push master branch to origin  (web hooks will deploy to azure)
      grunt.task.run([ 'gitpush:production' ]);

    } else {
      grunt.task.run([ 'server-dev' ]);
    }
  });

  grunt.registerTask('deploy', [
    // add your deploy tasks here
    'upload'
  ]);


};
