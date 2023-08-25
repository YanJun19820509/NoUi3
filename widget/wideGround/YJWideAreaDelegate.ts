
/**
 * YJWideArea的代理类，用于实现在移动过程中实现一些自定义逻辑，如切换网格底图，生成事件等
 */
import { YJFitScreen } from "../../base/YJFitScreen";
import { no } from "../../no";
import { Component, Size, Vec2, ccclass, Node, Vec3, v3 } from "../../yj";

/**
 * 视图块信息
 * size：块大小，
 * xy：所在世界坐标
 * uv：所在网格坐标
 * image: 显示图片名称
 * direction：所处方位'top' | 'bottom' | 'left' | 'right'
 */

export type WideAreaObject = { node: Node, pos: Vec3, dis: number, xy: Vec2, active: boolean };

@ccclass('YJWideAreaDelegate')
export class YJWideAreaDelegate extends Component {
    public onStart(xy: Vec2): void { }
    /**
     * 移动中的回调
     * @param xy 屏幕中心在广域中的坐标
     */
    public onMove(xy: Vec2): void { }
    public onEnd(xy: Vec2): void { }
    /**
     * 视图块切换回调
     */
    public onBlockSwitch(block: Node, xy: Vec2) { }

    public setWideAreaObject(obj: WideAreaObject) {
        const s = 100 / obj.dis;
        no.scale(obj.node, v3(s, s));
        no.position(obj.node, obj.pos);
    }

    public wideAreaObjectMove(obj: WideAreaObject, xy: Vec2) {
        const dis = Vec2.distance(xy, obj.xy),
            viewSize = YJFitScreen.getVisibleSize();
        let oy = Math.abs(no.y(obj.node));
        if ((dis > obj.dis || oy > viewSize.height / 2) && obj.active) {
            obj.active = false;
            no.visible(obj.node, false);
        } else if (dis < obj.dis && oy < viewSize.height / 2) {
            if (!obj.active) {
                obj.active = true;
                no.visible(obj.node, true);
            }
            const s = 100 / dis;
            no.scale(obj.node, v3(s, s));
            // let pos = obj.pos.clone();

            // no.position(obj.node, pos);
        }
    }
}
