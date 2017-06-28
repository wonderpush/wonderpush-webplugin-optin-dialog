"use strict";
// vim: ts=4 sts=4 sw=4 et
let fs = require('fs');
let pkg = require('./package.json');
let gulp = require('gulp');
let lazypipe = require('lazypipe');
let sourcemaps = require('gulp-sourcemaps');
let uglify = require('gulp-uglify');
let jshint = require('gulp-jshint');
let stylelint = require('gulp-stylelint');
let less = require('gulp-less');
let sass = require('gulp-sass');
let cleanCSS = require('gulp-clean-css');
let del = require('del');
let header = require('gulp-header');

const DIST_DIR = './dist';
const JS_GLOB   = ['./src/*.js'];
const CSS_GLOB  = ['./src/*.css'];
const LESS_GLOB = ['./src/*.less'];
const SASS_GLOB = ['./src/*.scss', './src/*.sass'];
const RES_GLOB  = ['./src/**/*'].concat(Array.prototype.concat.call(JS_GLOB, CSS_GLOB, LESS_GLOB, SASS_GLOB).map(pattern => '!'+pattern));

let getHeader = function () {
    return fs.readFileSync('HEADER');
};
let addHeader = lazypipe()
    .pipe(header, getHeader(), {year: new Date().getFullYear(), pkg: pkg});

let lintCSS = lazypipe()
    .pipe(stylelint, {
        config: {
            rules: {}, // empty rules, only check CSS syntax (clean-css does not!)
        },
        failAfterError: true,
        reporters: [{formatter: 'string', console: true}],
    });
let lintLESS = lintCSS;
let lintSASS = lintCSS;
let processCSS = lazypipe()
    .pipe(cleanCSS)
    .pipe(addHeader);

gulp.task('default', ['clean', 'build'], function() {
});

gulp.task('build', ['minify-js', 'minify-css', 'minify-less', 'minify-sass', 'copy-res'], function() {
});

gulp.task('watch', ['watch-js', 'watch-css', 'watch-less', 'watch-sass'], function() {
});

gulp.task('clean', function(cb) {
    return del([DIST_DIR]);
});

gulp.task('copy-res', function() {
    return gulp.src(RES_GLOB)
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('minify-js', function() {
    return gulp.src(JS_GLOB)
        .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(jshint.reporter('fail'))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(addHeader())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('watch-js', function() {
    return gulp.watch(JS_GLOB, ['minify-js']);
});

gulp.task('minify-css', function() {
    return gulp.src(CSS_GLOB)
        .pipe(lintCSS())
        .pipe(sourcemaps.init())
        .pipe(processCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('watch-css', function() {
    return gulp.watch(CSS_GLOB, ['minify-css']);
});

gulp.task('minify-less', function() {
    return gulp.src(LESS_GLOB)
        .pipe(lintLESS())
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(processCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('watch-less', function() {
    return gulp.watch(LESS_GLOB, ['minify-less']);
});

gulp.task('minify-sass', function() {
    return gulp.src(SASS_GLOB)
        .pipe(lintSASS())
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(processCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('watch-sass', function() {
    return gulp.watch(SASS_GLOB, ['minify-sass']);
});
