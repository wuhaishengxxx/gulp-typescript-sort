var GameMain = /** @class */ (function () {
    function GameMain(width, height) {
        if (width === void 0) { width = 640; }
        if (height === void 0) { height = 1136; }
        this.width = width;
        this.height = height;
    }
    GameMain.prototype.start = function () {
        //程序入口
        Laya.init(this.width, this.height, Laya.WebGL);
        Laya.loader.load("res/atlas/comp.atlas", Laya.Handler.create(this, this.onLoaded));
    };
    GameMain.prototype.onLoaded = function () {
        Laya.stage.addChild(new view.MainPanel());
    };
    return GameMain;
}());

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var View = laya.ui.View;
var Dialog = laya.ui.Dialog;
var ui;
(function (ui) {
    var MainUI = /** @class */ (function (_super) {
        __extends(MainUI, _super);
        function MainUI() {
            return _super.call(this) || this;
        }
        MainUI.prototype.createChildren = function () {
            _super.prototype.createChildren.call(this);
            this.createView(ui.MainUI.uiView);
        };
        MainUI.uiView = { "type": "View", "props": { "width": 640, "height": 1136 }, "child": [{ "type": "Image", "props": { "y": 317, "x": 237, "skin": "comp/image.png" } }] };
        return MainUI;
    }(View));
    ui.MainUI = MainUI;
})(ui || (ui = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var view;
(function (view) {
    var MainPanel = /** @class */ (function (_super) {
        __extends(MainPanel, _super);
        function MainPanel() {
            return _super.call(this) || this;
        }
        return MainPanel;
    }(ui.MainUI));
    view.MainPanel = MainPanel;
})(view || (view = {}));
