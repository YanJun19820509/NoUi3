import { ccclass, Component, Node, property, Vec3 } from "../../yj";
/**
 * 手柄
 * Author mqsy_yj
 * DateTime Mon Jun 09 2025 10:19:23 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJHandShank')
export class YJHandShank extends Component {
    @property({ type: Node, displayName: '摇杆' })
    handler: Node = null;
    @property({ displayName: '摇杆半径' })
    radius: number = 100;
    @property({ displayName: '固定位置' })
    fixed: boolean = false;

    private _originPos: Vec3 = null;

    onLoad() {
        if (!this.fixed)
            this._originPos = this.node.position.clone();
    }

    public onStart(pos: Vec3) {
        if (!this.fixed)
            this.node.setPosition(pos.x, pos.y);
    }

    public onMove(radian: number) {
        const x = this.radius * Math.cos(radian);
        const y = this.radius * Math.sin(radian);
        this.handler.setPosition(x, y);
    }

    public onStop() {
        if (!this.fixed)
            this.node.setPosition(this._originPos);
        this.handler.setPosition(0, 0);
    }
}