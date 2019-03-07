
// npm install  gulp   typescript gulp-concat   gulp-typescript gulp-typescript-filesort gulp-filelist gulp gulp-shell glob silly-datetime   minimist tsify

const gulp = require("gulp");
const ts = require("gulp-typescript");
const sorter = require("gulp-typescript-sort");
const concat = require('gulp-concat');
const tsProject = ts.createProject("tsconfile_gulp.json");

function compileTSFile() {
   return gulp.src([
      "libs/*.ts",
      "src/**/*.ts"
   ])
      .pipe(sorter(false)) // 排序  false 不显示日志
      .pipe(tsProject()) // 编译TS文件
      .pipe(concat('game.js')) // 合并编译后的js到一个文件
      // .pipe(filelist('filelist.json'))
      .pipe(gulp.dest("bin/js/"));
}

gulp.task('default', function (args, args2) {
   return compileTSFile();
});


