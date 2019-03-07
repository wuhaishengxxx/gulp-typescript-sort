
import View=laya.ui.View;
import Dialog=laya.ui.Dialog;
module ui {
    export class MainUI extends View {

        public static  uiView:any ={"type":"View","props":{"width":640,"height":1136},"child":[{"type":"Image","props":{"y":317,"x":237,"skin":"comp/image.png"}}]};
        constructor(){ super()}
        createChildren():void {
        
            super.createChildren();
            this.createView(ui.MainUI.uiView);

        }

    }
}
