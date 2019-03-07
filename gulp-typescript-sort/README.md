gulp-typescript-sort
========================

该项目是针对typescript进行依赖排序的gulp插件
项目的开发，是在进行Laya H5游戏开发的时候进行开发的，用于编译并合并TS代码，简化编译过程




## 使用方法
该插件并未发布到npm
1. 创建项目
2. 安装项目依赖
```shell
npm install --save-dev  gulp   typescript gulp-concat   gulp-typescript   gulp-filelist gulp gulp-shell glob silly-datetime   minimist tsify
``` 
3. 拷贝gulp-typescript-sort 文件夹 到项目node_modules目录下

4. 如下例子使用

## Example

```js

const gulp = require("gulp");
const ts = require("gulp-typescript");
const sorter = require("gulp-typescript-sort");
const concat = require('gulp-concat');
const tsProject = ts.createProject("tsconfile_gulp.json");

function compileTSFile() {
   return gulp.src(["src/**/*.ts"])
      .pipe(sorter(false)) // 排序  false 不显示日志
      .pipe(tsProject()) // 编译TS文件
      .pipe(concat('game.js')) // 合并编译后的js到一个文件
      // .pipe(filelist('filelist.json'))
      .pipe(gulp.dest("bin/js/"));
}

gulp.task('default', function (args, args2) {
   return compileTSFile();
});
```