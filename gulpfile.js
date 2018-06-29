'use strict';

const gulp = require('gulp');
const minify = require('gulp-minify');

const paths = {
    js: 'lib/**/*.js'
};
const jsOpt = {
    ext: {min: '.js'},
    noSource: true
};
gulp.task('minify', () => gulp.src(paths.js)
    .pipe(minify(jsOpt))
    .pipe(gulp.dest('dist/')));
gulp.task('copy', () => gulp.src(['lib/**/*.proto', 'lib/**/*.steamd', 'lib/**/*.json']).pipe(gulp.dest('dist/')));

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['minify', 'copy'], () => {
    console.log('Done');
});
