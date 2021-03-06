var fs = require('fs');
var through = require("through");
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

/**
 * 查找文件是否以关键字module开头
 */
var seekModuleTop = /^module/;//查找文件是否以包关键子module开头
/**
 * //查找类中的所有可能的注释,变量,引用,{,},字符串,后跟变量的“=”,后跟变量的“:”,后跟变量的“,”。
 */
var seekCite = /([A-Za-z_][\w\.]*)|\{|\}|\(|\)|\,(?= *([A-Za-z_][\w\.]*))|=(?= *([A-Za-z_][\w\.]*))|:(?= *([A-Za-z_][\w\.]*))|\@(?= *([A-Za-z_][\w\.]*))|\"[^\"]*\"|\'[^\']*\'|\/\*\*([^\*\/]|\*(?!\/)|\[^\*](?=\/)\/)*\*\/|\/\/[^\r]*/g;

// var seekCite = /([A-Za-z_][\w\.]*)|\{|\}|\(|\)|\,(?= *([A-Za-z_][\w\.]*))|=(?= *([A-Za-z_][\w\.]*))|:(?= *([A-Za-z_][\w\.]*))|\"[^\"]*\"|\'[^\']*\'|\/\*\*([^\*\/]|\*(?!\/)|\[^\*](?=\/)\/)*\*\/|\/\/[^\r]*/g;
/**
 * js关键字
 */
var javaScriptKey = {
    "break": true, "do": true, "instanceof": true, "typeof": true, "case": true, "else": true, "new": true, "var": true, "catch": true, "finally": true, "return": true, "void": true, "continue": true, "for": true, "switch": true, "while": true, "debugger": true, "function": true, "this": true, "with": true, "default": true, "if": true, "throw": true, "delete": true, "in": true, "try": true, "abstract": true, "enum": true, "int": true, "short": true, "boolean": true, "export": true, "interface": true, "static": true, "byte": true, "extends": true, "long": true, "super": true, "char": true, "final": true, "native": true, "synchronized": true, "class": true, "float": true, "package": true, "throws": true, "const": true, "goto": true, "private": true, "transient": true, "debugger": true, "implements": true, "protected": true, "volatile": true, "double": true, "import": true, "public": true, "class": true, "enum": true, "extends": true, "super": true, "const": true, "export": true, "import": true, "implements": true, "package": true, "public": true, "interface": true, "private": true, "static": true, "let": true, "protected": true, "yield": true

    , "module": true, "get": true, "set": true, "any": true, "number": true, "string": true, "null": true, "true": true
};

/**
 * 当前处理的第个文件
 */
var atFileIndex;
/**
 * 被依赖元素组
 * {
 * //名字为被依赖元素路径
 * //内容为被依赖元素的所属文件路径
 * "path":{"依赖元素1":0,"依赖元素2":0...}
 * }
 */
var byRelyArray;
/**
 * 依赖元素组
 * {
 * //路径
 * "path":[
 * path:string,
 * ...
 * ]
 * }
 */
var relyArray;
/**
 * 文件的全局引用(变量)
 * {
 * //变量名
 * "names":{
 * //包名与对应的储存值
 * "包名":"值"
 * ...
 * }
 * ...
 * }
 */
var fileOfFullCite;
/**
 * 依赖表
 * [
 * {
 * //路径
 * path:string,
 * //依赖表
 * rely:[
 * path:string,
 * ...
 * ]
 * }
 * ]
 */
var relyList;
/**
 * .d.ts列表
 * [string,string...]
 */
var dTs;
/**
 * 时间戳缓存
 */
var now;
/**
 * effectScopeList
 */
var effectScopeArray;
/**
 * 指示是否输出日志
 */
var isLog = false;
/**
 * 初始化排序
 */
function initRankTheSorting() {
    //初始化被依赖元素组
    byRelyArray = {};
    //初始化依赖元素组
    relyArray = {};
    //初始化依赖表
    relyList = [];
    //初始化.d.ts列表
    dTs = [];
    //影响范围数组
    effectScopeArray = {};
}
/**
 * 指定类组，建立作用域
 */
function buildEffectScope(tsPath, thisCite) {
    var i,
        j,
        atHead,
        atTail,
        regionHead,
        regionTail,
        cite,
        atType,
        waitI,
        effectScopeList,
        atEffectScopeString,
        atEffectScope;

    atEffectScope = [];
    effectScopeList = [];
    atHead = 0;
    atTail = 0;
    regionHead = 0;
    regionTail = 0;
    cite = thisCite;
    atEffectScopeString = "";
    atType = [];
    atType.push("");
    waitI = -1;
    for (i = 0; i < cite.length; i++) {
        if (//所有的作用域
            cite[i] == "module"
            || cite[i] == "class"
            || cite[i] == "enum"
            || cite[i] == "namespace"
            || (cite[i] == "function" && cite[i + 1] != "(")
            || (cite[i] == "static" && (cite[i + 2] == "(" || cite[i + 3] == "("))
        ) {
            waitI = i;
        } else if (cite[i] == "{") {
            if (waitI > -1) {
                if (cite[waitI + 1] == "get") {
                    atEffectScope.push(cite[waitI + 2]);
                } else if (cite[waitI + 2] == ":" || cite[waitI + 3] == ":") {
                    waitI = -1;
                    continue;
                } else {
                    atEffectScope.push(cite[waitI + 1]);
                }
                atType.push(cite[waitI]);
                atEffectScopeString = arrayEffectScopeToStringEffectScope(atEffectScope);

                waitI = -1;
                regionHead++;

            }
            atHead++;
        } else if (cite[i] == "}") {
            // if (atEffectScope.length > 0 && (regionHead - regionTail) == atEffectScope.length - 1) {
            // if (atEffectScope.length > 0 && (regionHead - regionTail) == atEffectScope.length) {
            if (atEffectScope.length > 0 && (atHead - atTail) == atEffectScope.length) {
                atEffectScope.pop();
                atType.pop();
                atEffectScopeString = arrayEffectScopeToStringEffectScope(atEffectScope);
                regionTail++;
            }
            atTail++;
        }
        if (!cite[i].charAt(0).match(/[\{\}\,\"\'\:\=\/\(\)]/) && !javaScriptKey[cite[i]]) {
            effectScopeList[i] = { "path": atEffectScopeString, "val": cite[i], "type": atType[atType.length - 1], "tsPath": tsPath };
        }
    }
    return effectScopeList;
}
/**
 * 数组作用域转换成字符串作用域
 */
function arrayEffectScopeToStringEffectScope(atEffectScope) {
    var i,
        atEffectScopeString;
    atEffectScopeString = "";
    for (i = 0; i < atEffectScope.length; i++) {
        if (i != atEffectScope.length - 1) {
            atEffectScopeString += atEffectScope[i] + ".";
        } else {
            atEffectScopeString += atEffectScope[i];
        }

    }
    return atEffectScopeString;
}
/**
 * 处理依赖关系并生成依赖排序
 */
function handleRelyAndCreateRelySort() {
    var result,
        resultString,
        relyListString,
        relyArrayString,
        byRelyArrayString,
        effectScopeArrayString,
        path,
        i,
        j,
        thisNow;

    trace([` 依赖表处理完成！`]);
    // thisNow=new Date().getTime();
    matchTheGeneratedRelyList(byRelyArray, relyArray, relyList);
    // trace("[生成依赖表]","耗时",new Date().getTime()-thisNow);
    resultString = "依赖关系";
    relyListString = "依赖列表";
    for (i = 0; i < relyList.length; i++) {
        resultString += "\n" + relyList[i].path;
        relyListString += "\n\n\n" + relyList[i].path + " " + relyList[i].rely.length;
        for (j = 0; j < relyList[i].rely.length; j++) {
            relyListString += "\n" + relyList[i].rely[j];
        }
    }
    relyArrayString = "依赖组";
    for (path in relyArray) {
        relyArrayString += "\n\n\n" + path;
        for (j = 0; j < relyArray[path].length; j++) {
            relyArrayString += "\n" + relyArray[path][j];
        }
    }
    byRelyArrayString = "被依赖组";
    for (path in byRelyArray) {
        byRelyArrayString += "\n\n\n" + path;
        for (j in byRelyArray[path]) {
            byRelyArrayString += "\n" + j;
        }
    }
    effectScopeArrayString = "作用域";
    for (path in effectScopeArray) {
        effectScopeArrayString += "\n\n\n" + path;
        for (j in effectScopeArray[path]) {
            effectScopeArrayString += "\n" + "   " + j + ":" + JSON.stringify(effectScopeArray[path][j]);
        }
    }

    if (isLog) {
        sorts(relyList);
        result = [];
        resultString = "";
        for (i = 0; i < relyList.length; i++) {
            result.push(relyList[i].path);
            resultString += "\n" + relyList[i].path;
        }
        writeFile("src/com.yigewaixingren/utils/logsort/SortTest.txt", resultString);

        trace(` 依赖排序完成`, "耗时:", Date.now() - now, "ms");

    } else {
        sorts(relyList);
        result = [];
        resultString = "";
        for (i = 0; i < relyList.length; i++) {
            result.push(relyList[i].path);
            resultString += "\n" + relyList[i].path;
        }
        trace(`依赖排序完成`, "耗时:", Date.now() - now, "ms");
    }
    return "666";
}
/**
 * 生成依赖表
 * byRelyElementArray:被依赖组
 * relyElementArray:依赖组
 */
function matchTheGeneratedRelyList(byRelyElementArray, relyElementArray, relyLists) {
    var path,
        j,
        k,
        byRely,
        thisObject;
    for (path in relyElementArray) {
        relyLists.push({ "path": path, "rely": [] });
        for (j = 0; j < relyElementArray[path].length; j++) {
            if (byRelyElementArray[relyElementArray[path][j]]) {
                for (byRely in byRelyElementArray[relyElementArray[path][j]]) {
                    if (byRely != relyLists[relyLists.length - 1].path) {
                        relyLists[relyLists.length - 1].rely.push(byRely);
                    }
                }
            }
        }
    }
}
/**
 * 生成排序
 */
function sorts(relyList) {
    var i;
    var j;
    var k;
    var l;
    var atFile;
    //遍历全部对象依赖表
    for (i = 0; i < relyList.length; i++) {
        atFile = relyList[i];
        for (j = 0; j < i; j++) {
            //遍历当前依赖对象与匹配对象依赖表
            if (isStringArrayToHasString(atFile.path, relyList[j].rely)) {
                //检测是否互相依赖
                if (isStringArrayToHasString(relyList[j].path, atFile.rely)) {
                    if (isLog) {
                        trace("[有互相依赖关系]", "gulp-sort: ts文件不能互相依赖！" + atFile.path + " " + relyList[j].path);
                    }
                    continue;
                    // throw "gulp-sort: ts文件不能互相依赖！" + atFile.path + " " + relyList[j].path;
                }
                //确定依赖关系，当前操作的依赖对象插入之前
                insertObjectGoToArray(i, j, relyList);
                return sorts(relyList);
            }
        }
    }
    //排序完成
    return;
}


/**
 * 生成文件的可被外部引用索引。
 */
function createCiteInside(byRelyArrays, path, tsFile, effectScopeList) {
    var thisCite,
        len,
        i,
        result,
        cite;
    result = [];
    thisCite = tsFile;
    if (!thisCite) {
        return;
    }
    len = thisCite.length;
    for (i = 0; i < len; i++) {
        if (!thisCite[i].charAt(0).match(/[\{\}\,\"\'\:\=\/\(\)]/) && !thisCite[i].match(/this\./g)
        ) {
            cite = citeInsideUpstream(thisCite[i], i, thisCite, path, effectScopeList);
            if (cite) {
                if (!byRelyArrays[cite]) {
                    byRelyArrays[cite] = {};
                }
                byRelyArrays[cite][path] = 0;
                // if (isLog) {
                trace("[更新被依赖组(" + atFileIndex + ")]", cite, path);
                // }
            }
        } else if (thisCite[i].charAt(0) == "\"") {//输出测试
            // trace("[测试输出]",thisCite[i],i,path);
        }
    }
    return result;
}

function citeInsideUpstream(cite, index, citeArray, path, effectScopeList) {
    var i,
        atClass,
        atAttribute,
        atEnum,
        atHead,
        atTail,
        traceHandle;
    traceHandle = false;
    atHead = 0;
    atTail = 0;
    specialEffect = true;
    if (javaScriptKey[cite]
    ) {//是关键字
        return null;
    }
    if (citeArray[index - 1] == "class") {//全局类
        if (!effectScopeList[index].path || effectScopeList[index].path == "") {
            return cite;
        } else {
            return effectScopeList[index].path + "." + cite;
        }
    } else if (citeArray[index - 1] == "module" || citeArray[index - 1] == "namespace") {
        return cite;
    } else if (citeArray[index - 1] == "function") {
        if (!effectScopeList[index].path || effectScopeList[index].path == "") {
            return cite;
        } else {
            return effectScopeList[index].path + "." + cite;
        }
    } else if (citeArray[index - 1] == "static") {
        if (!effectScopeList[index].path || effectScopeList[index].path == "") {
            return cite;
        } else {
            return effectScopeList[index].path + "." + cite;
        }
    }
    return null;
}

/**
 * 元素是否在数组中存在
 */
function isStringArrayToHasString(str, strArray) {
    var i,
        l;
    l = strArray.length;
    for (i = 0; i < l; i++) {
        if (strArray[i] == str) {
            return true;
        }
    }
    return false;
}

/**
 * 生成引用文件外部的全部索引。
 */
function createCiteWithout(path, tsFile, effectScopeList, byRelyArray) {
    var thisCite,
        i,
        result,
        cite,
        citeObjec;
    result = [];
    citeObjec = {};
    thisCite = tsFile;
    if (!thisCite) {
        return result;
    }
    for (i = 0; i < thisCite.length; i++) {
        if (!thisCite[i].charAt(0).match(/[\{\}\,\"\'\:\=\/\(\)]/) && !thisCite[i].match(/this\./g)
        ) {
            cite = citeWithoutUpstream(thisCite[i], i, thisCite, path, effectScopeList, byRelyArray);
            if (cite) {
                if (typeof cite === "string") {
                    citeObjec[cite] = 0;
                } else {
                    citeObjec[cite[0]] = 0;
                    citeObjec[cite[1]] = 0;
                }
                if (isLog) {
                    trace("[更新依赖组(" + atFileIndex + ")]", cite, path);
                }
            }
        }
    }
    for (cite in citeObjec) {
        result.push(cite);
    }
    return result;
}
function citeWithoutUpstream(cite, index, citeArray, path, effectScopeList, byRelyArray) {
    var i,
        atCite,
        atClass,
        atFunc,
        atAttribute,
        atEnum,
        atHead,
        atTail,
        traceHandle;

    atFunc = false;
    atClas = false;
    traceHandle = false;
    atHead = 0;
    atTail = 0;
    specialEffect = true;
    if (javaScriptKey[cite]
    ) {//是关键字
        return null;
    }
    // if(citeArray[index - 1]=="@") trace("6666666",citeArray[index]);
    // if(citeArray[index - 2] == "extends"){
    //         trace("444444",index,cite,effectScopeList[index]);
    // }
    if (
        effectScopeList[index]
        &&
        (//会调用外部而产生依赖的作用域
            effectScopeList[index].type == ""
            || effectScopeList[index].type == "static"
            || effectScopeList[index].type == "enum"
            || effectScopeList[index].type == "module"
            || effectScopeList[index].type == "namespace"
        )
        &&
        (//引用外部的调用方式
            citeArray[index - 1] == ":"
            || citeArray[index - 1] == "new"
            || citeArray[index - 1] == "extends"  //extends UIWindow
            || citeArray[index - 2] == "extends"  //extends UIWindow<FUIInfoView>
            || (index - 3 >= 0 && citeArray[index - 3] == "import")
        )
    ) {
        // if(citeArray[index - 2] == "extends"){
        //     trace("55555",cite);
        // }

        // if (cite.match(/\./) == null && effectScopeList[index].path != "") {
        if (effectScopeList[index].path != "" && byRelyArray[effectScopeList[index].path + "." + cite] != null) {
            return [effectScopeList[index].path + "." + cite, cite];
        }
        return cite;
    }
    else if (
        (
            citeArray[index - 1] == "@"
            || citeArray[index - 3] == "@"
        )
        &&
        effectScopeList[index]
        &&
        (//会调用外部而产生依赖的作用域
            effectScopeList[index].type == ""
            || effectScopeList[index].type == "static"
            || effectScopeList[index].type == "enum"
            || effectScopeList[index].type == "module"
            || effectScopeList[index].type == "namespace"
            || effectScopeList[index].type == "class"
        )
    ) {
        // if(citeArray[index - 1]=="@") trace("99999",citeArray[index]);
        //回滚查找装饰器作用域
        i = index;
        for (i = index; i < citeArray.length; i++) {
            if (
                citeArray[i] == "static"
                || citeArray[i] == "function"
                || citeArray[i] == "class"
                || citeArray[i] == "enum"
                || citeArray[i] == "namespace"
                || citeArray[i] == "const"
            ) {
                // if(citeArray[index - 1]=="@") trace("111111",citeArray[index],cite);
                if (cite.match(/\./) == null && effectScopeList[index].path != "") {
                    return [effectScopeList[index].path + "." + cite, cite];
                }
                return cite;
            } else if (
                citeArray[i] == "var"
                || citeArray[i] == "="
                || citeArray[i] == ":"
                || citeArray[i] == "{"
                || citeArray[i] == ";"
            ) {
                break;
            }
        }
    }
    return null;
}
//写入文件utf-8格式
function writeFile(fileName, data, compltes) {
    fs.writeFile(fileName, data, 'utf-8', compltes ? compltes : complete);
    function complete() {
        console.log("文件生成成功");
    }
}
/**
 * 生成文件的全局引用(变量)
 */
function createFileOfFullCite(fileOfFullCite, path, tsFile) {
}
/**
 * 生成文件引用外部的类
 */
function createImportClass(path, tsFile) {
}
/**
 * 生成文件引用外部的变量
 */
function createImportVariable(path, tsFile) {
}

/**
 * 插入元素到数组指定位置
 */
function insertObjectGoToArray(atIndex, insertIndex, arrays) {
    var frontArray = [];
    var i;
    var atVal;
    atVal = arrays[atIndex];
    for (i = 0; i < insertIndex; i++) {
        if (i != atIndex) {
            frontArray.push(arrays[i]);
        }
    }
    frontArray.push(atVal);
    for (i = frontArray.length - 1; i < arrays.length; i++) {
        if (i != atIndex) {
            frontArray.push(arrays[i]);
        }
    }
    arrays.length = 0;
    for (i = 0; i < frontArray.length; i++) {
        arrays.push(frontArray[i]);
    }
}
/**
 * 读表对象
 * 返回的对象{path:"",contents:""}
 */
function readTheTableObject(path, arrays) {
    var i;
    for (i = 0; i < arrays.length; i++) {
        if (arrays[i].path == path) {
            return arrays[i];
        }
    }
    arrays.push({ "path": "", "rely": [] });
    return arrays[arrays.length - 1];
}



/**
 * 打印输出
 */
function trace(...arg) {
    var i;
    var s = "";
    for (i = 0; i < arg.length; i++) {
        s += String(arg[i]);
        s += " ";
    }
    console.log(s);
}


// 常量
const PLUGIN_NAME = 'gulp-prefixer';
function isNull(str) {
    return str == null || str.value == "";
}

/**
 * java String hashCode 的实现
 * @param strKey
 * @return intValue
 */
function hashCode(strKey) {
    var hash = 0;
    if (!isNull(strKey)) {
        for (var i = 0; i < strKey.length; i++) {
            hash = hash * 31 + strKey.charCodeAt(i);
            hash = intValue(hash);
        }
    }
    return hash;
}

/**
 * 将js页面的number类型转换为java的int类型
 * @param num
 * @return intValue
 */
function intValue(num) {
    var MAX_VALUE = 0x7fffffff;
    var MIN_VALUE = -0x80000000;
    if (num > MAX_VALUE || num < MIN_VALUE) {
        return num &= 0xFFFFFFFF;
    }
    return num;
}

/**
 * 插件级别的函数（处理文件）
 * isLog：是否输出日志，默认为false;
 */
function gulpPrefixer(isLogs, options) {
    var i;
    var thisCite;
    var effectScopeList;
    now = new Date().getTime();

    var files, matchers, onEnd, onFile, rank, relative, fileArray, relyArrayCache;

    initRankTheSorting();
    atFileIndex = 0;
    isLog = isLogs;
    files = [];
    fileArray = {};
    relyArrayCache = [];
    
    onFile = function (file) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return cb();
        }
        // 非声明文件
        if (!("" + file.path).match(/\.d\.ts/ig)) {
            thisCite = ("" + file.contents).match(seekCite);

            if (thisCite) {

                effectScopeList = buildEffectScope(file.path, thisCite);
                effectScopeArray[file.path] = effectScopeList;
                createCiteInside(byRelyArray, file.path, thisCite, effectScopeList);
                relyArrayCache.push(file);

            }
            // trace("[当前处理(" + atFileIndex + ")]", file.path, file);
            atFileIndex++;
        } else {
            dTs.push(file);
            //console.log("Dts : " + file.path);
        }
        // 文件进入缓存
        fileArray[file.path] = file;
        return files.push(file);
    };
    onEnd = function () {
        var i;
        var file;
        relyArrayCache.sort(function (fileA, fileB) {
            if (fileA.path.match('.js')) {
                console.log("min value : " + fileA.path);
                return -Number.MIN_VALUE;
            }
            var aCode = hashCode(fileA.path);
            var bCode = hashCode(fileB.path);
            return aCode - bCode;
        });

        for (i = 0; i < relyArrayCache.length; i++) {

            //trace(fileArray[relyList[i].path]);
            file = relyArrayCache[i];
            effectScopeList = effectScopeArray[file.path];
            thisCite = ("" + file.contents).match(seekCite);
            relyArray[file.path] = createCiteWithout(file.path, thisCite, effectScopeList, byRelyArray);
        }

        handleRelyAndCreateRelySort();
        files.length = 0;
        for (i = 0; i < dTs.length; i++) {
            // trace(dTs[i].path);
            files.push(dTs[i]);
            // trace(fileArray[dTs[i].path]);
        }
        for (i = 0; i < relyList.length; i++) {
            // 确保文件进入下一个 gulp 插件
            files.push(fileArray[relyList[i].path]);
            // trace(fileArray[relyList[i].path]);
        }

        files.forEach((function (_this) {
            return function (file) {
                return _this.emit("data", file);
            };
        })(this));
        return this.emit("end");
    };
    return through(onFile, onEnd);
};

// 导出插件主函数
module.exports = gulpPrefixer;