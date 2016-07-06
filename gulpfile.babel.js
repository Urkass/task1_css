import gulp from 'gulp';
import del from 'del';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import minifyCss from 'gulp-minify-css';
import autoprefixer from 'gulp-autoprefixer';
import path from 'path';
import imagemin from 'gulp-imagemin';
import uglify from 'gulp-uglify';
import url from 'gulp-css-url-adjuster';
import handlebars from 'gulp-compile-handlebars';
import flatten from 'gulp-flatten';
import inlineImagePath from 'gulp-inline-image-path';
import merge from 'merge-stream';
import fs from 'fs';
import browserSync from 'browser-sync';
import libs from './levels/varibles/libs.json';
import babel from 'gulp-babel';

const reload = browserSync.reload;
const params = {
    out: 'dist/',
    htmlSrc: ['levels/pages/*.{handlebars,hbs,html}'],
    levels: ['levels/blocks'],
    fonts: ['fonts/'],
    css: 'dist/css/',
    js: 'dist/js/'
};
gulp.task('server', function() {
    browserSync.init({
        server: params.out,
        port: 9000
    });
    gulp.watch('levels/pages/**/*.{html,hbs,handlebars}', ['html']);
    gulp.watch(params.htmlSrc, ['html']);
    gulp.watch(params.levels.map(function(level) {
        var hbsGlob = level + '/**/*.hbs';
        return hbsGlob;
    }), ['html']);
    gulp.watch(params.levels.map(function(level) {
        var cssGlob = level + '/**/*.scss';
        return cssGlob;
    }), ['css']);
    gulp.watch(params.levels.map(function(level) {
        var jsGlob = level + '/**/*.js';
        return jsGlob;
    }), ['js']);
    gulp.watch(params.levels.map(function(level) {
        var imgGlob = level + '/**/*.{jpg,gif,jpeg,png,svg}';
        return imgGlob;
    }), ['images']);


});

gulp.task('html', function() {
    var templateData = {
        firstName: 'Peter'
    },
        options = {
            ignorePartials: false, //ignores the unknown footer2 partial in the handlebars template, defaults to false
            batch : [].concat.apply([], params.levels.map(function(dirName) {
                return fs.readdirSync(dirName).filter(function(file) {
                    //console.log(fs.statSync(path.join(dirName, file)).isDirectory());
                    return + fs.statSync(path.join(dirName, file)).isDirectory();
                }).map(function (item){
                    console.log(path.resolve(dirName) + '/' + item);
                    return path.resolve(dirName) + '/' + item;
                });
            })),
            helpers : {
                capitals : function(str){
                    return str.toUpperCase();
                }
            }
        };

    return gulp.src(params.htmlSrc)
        .pipe(handlebars(templateData, options))
        .pipe(rename({extname: ".html"}))
        //.pipe(inlineImagePath({path: params.out + "/images"}))
        .pipe(gulp.dest(params.out))
        .pipe(reload({ stream: true }));
});


gulp.task('css', function() {
    const autoprefixer_browsers = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ];
    var variblesStream = gulp.src('levels/varibles/vars.scss');
    var scssStream = gulp.src(params.levels.map(function(dirName) {
        var cssGlob = path.resolve(dirName) + '/**/*.{scss, css}';
        console.log(cssGlob);
        return cssGlob;

    }));
    var fontsStream = gulp.src('levels/varibles/fonts.css');
    var varandscssMerge = merge(variblesStream, scssStream)
        .pipe(autoprefixer(autoprefixer_browsers))
        .pipe(concat("style.scss"))
        .pipe(sass().on('error', sass.logError))
        .pipe(url({
            prepend: '/images/'
        }));

    return merge(fontsStream, varandscssMerge)
        .pipe(concat("style.css"))
        .pipe(gulp.dest(params.css))
        .pipe(reload({ stream: true }));
});

gulp.task('css-minify', function () {
    gulp.src(params.css + '*.css')
        .pipe(minifyCss())
        .pipe(gulp.dest(params.out))
});

gulp.task('images', function() {
    gulp.src(params.levels.map(function(dirName) {
            var imgGlob = path.resolve(dirName) + '/**/*.{jpg,gif,jpeg,png,svg}';
            console.log(imgGlob);
            return imgGlob;
        }))
        .pipe(flatten())
        .pipe(gulp.dest(params.out + 'images/'));
});
gulp.task('img-optim', function () {
    gulp.src(params.out + 'images/*')
        .pipe(imagemin())
        .pipe(gulp.dest(params.out + 'images'));
});
gulp.task('fonts', function() {
    gulp.src(params.fonts.map(function(dirName) {
            var fontsGlob = path.resolve(dirName) + '/**';
            console.log(fontsGlob);
            return fontsGlob;
        }))
        .pipe(gulp.dest(params.out + 'fonts/'));
});
gulp.task('js', function() {
    var jsStream = gulp.src(params.levels.map(function(dirName) {
        var jsGlob = path.resolve(dirName) + '/**/*.js';
        console.log(jsGlob);
        return jsGlob;

    }));
    //var libsStream = gulp.src(params.js_libs.map(function(dirName) {
    //    var libsGlob = path.resolve(dirName);
    //    console.log(libsGlob);
    //    return libsGlob;
    //}));
    return merge(jsStream)
        .pipe(concat('app.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(params.js))
        .pipe(reload({ stream: true }));
});
gulp.task('js-uglify', function () {
    gulp.src(params.js + '*.js')
        .pipe(uglify())
        .pipe(gulp.dest(params.out))
});

gulp.task('clean', function () {
    del([params.out]);
});

gulp.task('css-libs', function () {
    let libsStream = gulp.src(libs.css.map(function(library) {
        return path.resolve(library.src);
    }));
    return libsStream
        .pipe(concat("libs.css"))
        .pipe(gulp.dest(params.css))
});
gulp.task('js-libs', function () {
    let libsStream = gulp.src(libs.js.map(function(library) {
        return path.resolve(library.src);
    }));
    return libsStream
        .pipe(concat("libs.js"))
        .pipe(gulp.dest(params.js))
});

gulp.task('libs', ['js-libs', 'css-libs']);
gulp.task('default', ['build', 'server']);
gulp.task('build', ['html', 'css', 'images', 'js', 'fonts', 'libs']);
gulp.task('production', ['build', 'img-optim', 'js-uglify', 'css-minify']);
