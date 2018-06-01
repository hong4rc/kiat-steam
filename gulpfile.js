let gulp = require('gulp');
let minify = require('gulp-minify');


let paths = {
    js: 'lib/**/*.js'
};
let jsOpt = {
    ext: {min: '.js'},
    noSource: true
};
gulp.task('minify', function () {
    return gulp.src(paths.js)
        .pipe(minify(jsOpt))
        .pipe(gulp.dest('dist/'));

});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['minify'], () => {
    console.log('Done')
});
