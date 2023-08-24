
/**
 * YJWideArea的代理类，用于实现在移动过程中实现一些自定义逻辑，如切换网格底图，生成事件等
 */
import { Component, Size, Vec2, ccclass, Node } from "../../yj";

/**
 * 视图块信息
 * size：块大小，
 * xy：所在世界坐标
 * uv：所在网格坐标
 * image: 显示图片名称
 * direction：所处方位'top' | 'bottom' | 'left' | 'right'
 */
export type BlockInfo = { size: Size, xy: Vec2, uv: Vec2, image: string, direction: 'top' | 'bottom' | 'left' | 'right' };

@ccclass('YJWideAreaDelegate')
export class YJWideAreaDelegate extends Component {
    /**
     * 移动中的回调
     * @param xy 广域中心的世界坐标
     * @param uv 广域中心的网格坐标
     */
    public onMove(xy: Vec2, uv: Vec2): void { }
    /**
     * 视图块切换回调
     */
    public onBlockSwitch(block: Node, xy: Vec2, uv: Vec2) { }
}


