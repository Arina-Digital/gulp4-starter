const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const svgmin = require('gulp-svgmin');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const htmlReplace = require('gulp-html-replace');
const htmlmin = require('gulp-htmlmin');
const gulpif = require('gulp-if');

const paths = {
    src: {
        html: 'src/*.html',
        js: 'src/js/**/*.js',
        img: 'src/img/**/*',
        svg: 'src/svg/**/*',
        scss: 'src/scss/**/*.scss'
    },
    dist: {
        root: 'dist',
        html: 'dist/',
        js: 'dist/js',
        img: 'dist/img',
        svg: 'dist/svg',
        css: 'dist/css'
    }
};

let production = process.env.NODE_ENV === 'production';

function cleanDist() {
    return src(paths.dist.root, { read: false, allowEmpty: true })
        .pipe(clean());
}

function html() {
    return src(paths.src.html)
        .pipe(gulpif(production, htmlReplace({
            'css': './css/bundle.min.css',
            'js': './js/bundle.min.js'
        })))
        .pipe(gulpif(production, htmlmin({ collapseWhitespace: true })))
        .pipe(dest(paths.dist.html))
        .pipe(browserSync.stream());
}

function js() {
    return src(paths.src.js)
        .pipe(gulpif(!production, dest(paths.dist.js)))
        .pipe(browserSync.stream());
}

function img() {
    return src(paths.src.img)
        .pipe(dest(paths.dist.img))
        .pipe(browserSync.stream());
}

function svg() {
    return src(paths.src.svg)
        .pipe(svgmin())
        .pipe(dest(paths.dist.svg))
        .pipe(browserSync.stream());
}

function scss() {
    return src(paths.src.scss)
        .pipe(sourcemaps.init())
        .pipe(sass(production ? { outputStyle: 'compressed' } : {}).on('error', sass.logError))
        .pipe(gulpif(production, concat('bundle.min.css')))
        .pipe(sourcemaps.write())
        .pipe(dest(paths.dist.css))
        .pipe(browserSync.stream());
}

function serve() {
    browserSync.init({
        server: {
            baseDir: paths.dist.root
        }
    });

    watch(paths.src.html, html);
    watch(paths.src.js, js);
    watch(paths.src.img, img);
    watch(paths.src.svg, svg);
    watch(paths.src.scss, scss);
}

exports.default = series(parallel(html, js, img, svg, scss), serve);

function buildJs() {
    return src(paths.src.js)
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(dest(paths.dist.js));
}

function buildCss() {
    return src(paths.src.scss)
        .pipe(sourcemaps.init())
        .pipe(sass(production ? { outputStyle: 'compressed' } : {}).on('error', sass.logError))
        .pipe(concat('bundle.min.css'))
        .pipe(sourcemaps.write())
        .pipe(dest(paths.dist.css));
}

function cleanAndBuild(cb) {
    return series(cleanDist, parallel(html, img, svg), buildJs, buildCss)(cb);
}

exports.build = series(cleanAndBuild);
exports.cleanStart = series(cleanDist, exports.default);
