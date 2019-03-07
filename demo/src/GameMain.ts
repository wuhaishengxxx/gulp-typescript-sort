



class GameMain {

	private width: number
	private height: number
	constructor(width: number = 640, height: number = 1136) {
		this.width = width;
		this.height = height
	}



	start() {
		//程序入口
		Laya.init(this.width, this.height, Laya.WebGL);

		Laya.loader.load("res/atlas/comp.atlas", Laya.Handler.create(this, this.onLoaded));
	}

	onLoaded(): void {
		Laya.stage.addChild(new view.MainPanel());
	}

}
