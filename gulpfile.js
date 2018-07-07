'use strict';

const gulp = require('gulp');
const minify = require('gulp-minify');

const DIST = 'dist/';

const paths = {
    js: 'lib/**/*.js',
    raw : ['lib/**/*.proto', 'lib/**/*.steamd', 'lib/**/*.json'],
};
const jsOpt = {
    ext: {min: '.js'},
    noSource: true,
};
gulp.task('minify', () => gulp.src(paths.js)
    .pipe(minify(jsOpt))
    .pipe(gulp.dest(DIST)));
gulp.task('copy', () => gulp.src(paths.raw).pipe(gulp.dest(DIST)));

// The default task (called when you run `gulp` from cli)
gulp.task('default', gulp.parallel('minify', 'copy'));
