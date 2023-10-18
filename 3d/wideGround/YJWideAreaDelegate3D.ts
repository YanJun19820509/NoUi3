
/**
 * YJWideArea的代理类，用于实现在移动过程中实现一些自定义逻辑，如切换网格底图，生成事件等
 */
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

@ccclass('YJWideAreaDelegate3D')
export class YJWideAreaDelegate3D extends Component {
    public onStart(xy: Vec2): void { }
    /**
     * 移动中的回调
     * @param xy 屏幕中心在广域中的坐标
     */
    public onMove(xy: Vec2, angle: number): void { }
    public onEnd(xy: Vec2): void { }

    /**
     * 初始化视图块时
     */
    public onBlocksInit(blocks: Node[]) { }
    /**
     * 视图块移动时
     */
    public onBlockMove(block: Node, xy: Vec3) { }
    /**
     * 视图块切换回调
     */
    public onBlockSwitch(block: Node, xy: Vec3) { }
}
