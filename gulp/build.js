'use strict';

const gulp = require('gulp');
const browserify = require('gulp-browserify');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const inlineSource = require('gulp-inline-source');
const gulpif = require('gulp-if');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');
const sass = require('gulp-sass');
const log = require('fancy-log');

gulp.task('build', ['clean', 'lint', 'setup'], () => {
    return Promise.all([
        new Promise((resolve, reject) => {
            log('Building javascript');
            gulp
                .src('src/index.js')
                .pipe(browserify())
                .pipe(uglify())
                .pipe(concat('bundle.js'))
                .pipe(gulp.dest('dist'))
                .on('end', resolve);
        }),
        new Promise((resolve, reject) => {
            log('Copying .htaccess, sitemap.xml, robots.txt');
            gulp
                .src([
                    'src/.htaccess',
                    'src/*.xml',
                    'src/*.txt'])
                .pipe(gulp.dest('dist'))
                .on('end', resolve);
        }),
        new Promise((resolve, reject) => {
            log('Copying images');
            gulp
                .src('src/**/*.{png,jpg}')
                .pipe(gulp.dest('dist'))
                .on('end', resolve);
        }),
        new Promise((resolve, reject) => {
            log('Minifying html');
            gulp
                .src('src/**/*.html')
                .pipe(htmlmin({collapseWhitespace: true}))
                .pipe(gulp.dest('dist'))
                .on('end', resolve);
        }),
        new Promise((resolve, reject) => {
            log('Processing sass');
            gulp
                .src('src/**/*.scss')
                .pipe(sass({outputStyle: 'expanded', indentWidth: 4}))
                .pipe(cleanCSS({compatibility: 'ie8'}))
                .pipe(concat('bundle.css'))
                .pipe(gulp.dest('dist/shared/styles'))
                .on('end', resolve);
        })
    ]).then(() => {
        return new Promise((resolve, reject) => {
            log('Inlining js/css/images into the html');
            gulp
                .src('dist/*.html')
                .pipe(inlineSource())
                .pipe(gulp.dest('dist'))
                .on('end', () => {
                    log('Versioning filenames for cache busting');
                    gulp
                        .src([
                            'dist/**/*.html',
                            'dist/**/*.css',
                            'dist/**/*.js',
                            'dist/**/*.{jpg,png,jpeg,gif,svg}'])
                        .pipe(gulpif('!index.html', rev())) // Rename files except for index.html
                        .pipe(revReplace()) // Replace within each file any references to files that got renamed
                        .pipe(gulp.dest('dist'))
                        .on('end', resolve);
                });
        });
    });
});
