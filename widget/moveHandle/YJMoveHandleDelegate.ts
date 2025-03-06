import { ccclass, Component, property } from "NoUi3/yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 18 2025 10:51:39 GMT+0800 (中国标准时间)
 *
 */

type MoveHandleData = {
    /** 移动类型:'moveby'表示步进移动,'moveto'表示移动到,'stop'表示停止 */
    type: 'moveby' | 'moveto' | 'stop',
    /** 步进移动方向,包含弧度和角度 */
    dir?: { angle: number, radian: number },
    /** 步进移动时间间隔 */
    dt?: number,
    /** 移动到相对于屏幕ui坐标系的位置,包含x和y坐标 */
    pos?: { x: number, y: number }
}

@ccclass('YJMoveHandleDelegate')
export class YJMoveHandleDelegate extends Component {
    public moveHandleEvent(e: MoveHandleData) { }
}