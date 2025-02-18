import { ccclass, Component, property } from "NoUi3/yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 18 2025 10:51:39 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJMoveHandleDelegate')
export class YJMoveHandleDelegate extends Component {
    public moveHandleEvent(e: { type: 'move' | 'stop', dir?: { angle: number, radian: number }, dt?: number }) {
    }
}