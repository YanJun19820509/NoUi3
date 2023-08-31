
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

export type WideAreaObject = { node: Node, pos: Vec3, xy: Vec2, size: Size, active: boolean };

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

    public setWideAreaObject(obj: WideAreaObject, xy: Vec2): Vec3 {
        const dis = obj.xy.y - xy.y,
            viewSize = YJFitScreen.getVisibleSize(),
            absDis = Math.abs(dis),
            max = (viewSize.height + obj.size.height) / 2;
        let s = 1, x = 0, y = obj.pos.y;
        s = (1 - absDis / max) * .3 + .7;
        if (absDis <= max) {
            y = dis;
            x = obj.xy.x - xy.x;
        } else {
            s = no.clamp(s, .1, 1);
            x = (max / dis) * (obj.xy.x - xy.x);
        }
        no.scale(obj.node, v3(s, s));
        const p = v3(x, y);
        no.position(obj.node, p);
        // no.log('set', x, y);
        return p;
    }

    public wideAreaObjectMove(obj: WideAreaObject, xy: Vec2) {
        const dis = obj.xy.y - xy.y,
            viewSize = YJFitScreen.getVisibleSize(),
            absDis = Math.abs(dis),
            max = (viewSize.height + obj.size.height) / 2;
        let x = 0, y = 0;
        y = dis;
        if (absDis <= max) {
            x = obj.xy.x - xy.x;
        } 
        // else {
        //     if (dis < 0)
        //         y = -absy;
        //     else y = absy;
        //     s = no.clamp(s, .1, 1);
        //     x = (absy / absDis) * (obj.xy.x - xy.x);
        // }
        if (Math.abs(x) > (viewSize.width + obj.size.width) / 2 || Math.abs(y) > max) {
            if (obj.active) {
                no.visible(obj.node, false);
                obj.active = false;
            }
            return;
        } else if (!obj.active) {
            no.visible(obj.node, true);
            obj.active = true;
        }
        let s = (1 - absDis / max) * .3 + .7;
        no.scale(obj.node, v3(s, s));
        no.position(obj.node, v3(x, y));
        // no.log('move', x, y);
    }
}
