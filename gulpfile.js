// vim: ts=4 sts=4 sw=4 et
let fs = require('fs');
let path = require('path');
let pkg = require('./package.json');
let gulp = require('gulp');
let Q = require('q');
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
let jsdoc = require('gulp-jsdoc3');
let git = require('gulp-git');
let copy = require('gulp-copy');

const PLUGIN_NAME = pkg.main.replace(/^.*\/([^\.]*)\..*$/, '$1');

const DIST_DIR = './dist';
const DOC_DIR = './doc';
const DOC_PUBLISH_DIR = './.gh-pages.git';
const MAIN_PLUGIN_CLASS = PLUGIN_NAME.replace(/\w[^\s-]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace('-', ''); // foo-bar becomes FooBar

const JS_GLOB   = ['./src/*.js'];
const CSS_GLOB  = ['./src/*.css'];
const LESS_GLOB = ['./src/*.less'];
const SASS_GLOB = ['./src/*.scss', './src/*.sass'];
const RES_GLOB  = ['./src/**/*'].concat(Array.prototype.concat.call(JS_GLOB, CSS_GLOB, LESS_GLOB, SASS_GLOB).map(pattern => '!'+pattern));

let getHeader = function () {
    return fs.readFileSync('HEADER');
};
let addHeader = lazypipe()
    .pipe(header, getHeader(), {
        pkg: pkg,
        plugin: PLUGIN_NAME,
    });

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

gulp.task('default', ['clean', 'build', 'doc'], function() {
});

gulp.task('build', ['minify-js', 'minify-css', 'minify-less', 'minify-sass', 'copy-res'], function() {
});

gulp.task('watch', ['watch-js', 'watch-css', 'watch-less', 'watch-sass'], function() {
});

gulp.task('doc', function(cb) {
    gulp.src(['index.md'].concat(JS_GLOB), {read: false})
        .pipe(jsdoc({
            plugins: ['plugins/markdown'],
            opts: {
                destination: path.resolve(DOC_DIR), // use path.resolve to avoid https://github.com/docstrap/docstrap/issues/307
                package: 'package.json',
                readme: 'index.md',
                access: ['public', 'undefined'],
            },
            templates: {
                theme: 'cerulean',
                copyright: '©' + new Date().getFullYear() + ' ' + pkg.author + '. All rights reserved.',
                systemName: PLUGIN_NAME,
                dateFormat: 'ddd MMM Do YYYY',
                default: {
                    staticFiles: {
                        include: [
                          'screenshot.png',
                        ].map(function(p){
                          return path.resolve(p); // use path.resolve to avoid https://github.com/docstrap/docstrap/issues/307
                        }),
                    },
                },
            },
        }, cb));
});

gulp.task('clean', function() {
    return del([DIST_DIR, DOC_DIR]);
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

gulp.task('doc-prepare-publish-repo', function() {
    try { fs.mkdirSync(DOC_PUBLISH_DIR); } catch (e) {}
    var noop = function(){};
    return Q.nfcall(git.init, {cwd: DOC_PUBLISH_DIR})
        .then(function() {
            return Q.nfcall(git.addRemote, 'origin', pkg.repository.url, {cwd: DOC_PUBLISH_DIR});
        }).catch(noop) // (ignore error, remote may already exist)
        .then(function() {
            return Q.nfcall(git.fetch, 'origin', 'gh-pages', {cwd: DOC_PUBLISH_DIR});
        }).catch(noop) // (ignore error, gh-pages may not already exist)
        .then(function() {
            return Q.nfcall(git.checkout, 'gh-pages', {args: '-b', cwd: DOC_PUBLISH_DIR});
        }).catch(noop) // (ignore error, gh-pages may already exist)
        .then(function() {
            return Q.nfcall(git.merge, 'origin/gh-pages', {args: '--ff-only', cwd: DOC_PUBLISH_DIR});
        }).catch(noop); // (ignore error, gh-pages may not already exist)
});

gulp.task('doc-prepare-publish', ['clean', 'doc', 'doc-prepare-publish-repo'], function() {
    return new Promise(function(resolve, reject) {
        var cb = function(err) {
            if (err) reject(err);
            else resolve();
        };
        gulp.src(path.join(DOC_DIR, pkg.name, pkg.version, '**', '*'))
            .pipe(copy(DOC_PUBLISH_DIR, {prefix: 2}))
            .on('data', function() {}) // copy is not a writable stream, we still have to make the data flow
            .on('error', cb)
            .on('end', function() {
                fs.writeFileSync(path.join(DOC_PUBLISH_DIR, '.nojekyll'), '');
                fs.writeFileSync(path.join(DOC_PUBLISH_DIR, 'index.html'), '<html><head><meta http-equiv="refresh" content="0;url=latest/index.html" /></head><body></body></html>');
                fs.writeFileSync(path.join(DOC_PUBLISH_DIR, 'api.html'), '<html><head><meta http-equiv="refresh" content="0;url=latest/api.html" /></head><body></body></html>');
                try { fs.unlinkSync(path.join(DOC_PUBLISH_DIR, 'latest')); } catch (e) {}
                fs.symlinkSync(pkg.version, path.join(DOC_PUBLISH_DIR, 'latest'), 'dir');
                fs.writeFileSync(path.join(DOC_PUBLISH_DIR, pkg.version, 'api.html'), '<html><head><meta http-equiv="refresh" content="0;url=' + MAIN_PLUGIN_CLASS + '.html" /></head><body></body></html>');
                gulp.src([
                        path.join(pkg.version, '**', '*'),
                        '.nojekyll',
                        'index.html',
                        'api.html',
                        'latest',
                ], {
                    read: false,
                    cwd: DOC_PUBLISH_DIR,
                })
                .pipe(git.add({cwd: DOC_PUBLISH_DIR}))
                    .pipe(git.commit('Documentation site for ' + pkg.version, {cwd: DOC_PUBLISH_DIR}))
                    .on('error', cb)
                    .on('end', cb);
            });
    });
});

gulp.task('doc-publish', ['doc-prepare-publish'], function(cb) {
    git.push('origin', 'gh-pages', {cwd: DOC_PUBLISH_DIR}, cb);
});
