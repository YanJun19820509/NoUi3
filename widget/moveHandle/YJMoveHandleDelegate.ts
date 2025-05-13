import { ccclass, Component, property } from "../../yj";
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
/**
 * 移动手柄事件代理基类（需继承实现具体逻辑）
 * @example
 * // 基础实现示例：
 * @ccclass('PlayerMoveDelegate')
 * class PlayerMoveDelegate extends YJMoveHandleDelegate {
 *     // 实现移动事件处理方法
 *     public moveHandleEvent(e: MoveHandleData) {
 *         switch(e.type) {
 *             case 'moveto': // 点击移动到目标位置
 *                 console.log(`移动到坐标: (${e.pos.x}, ${e.pos.y})`);
 *                 this.moveToPosition(e.pos);
 *                 break;
 *             case 'moveby': // 根据方向持续移动
 *                 const speed = 200;
 *                 const dx = Math.cos(e.dir.radian) * speed * e.dt;
 *                 const dy = Math.sin(e.dir.radian) * speed * e.dt;
 *                 this.node.position = this.node.position.add(v3(dx, dy, 0));
 *                 break;
 *             case 'stop':   // 停止移动
 *                 this.stopMovement();
 *                 break;
 *         }
 *     }
 *     
 *     private moveToPosition(pos: {x: number, y: number}) {
 *         // 实现具体移动逻辑...
 *     }
 * }
 */
export class YJMoveHandleDelegate extends Component {
    /**
     * 移动事件处理接口
     * @param e 移动事件数据对象，包含以下可能属性：
     * - type: 事件类型 
     *   'moveby' 持续移动（每帧触发）
     *   'moveto' 点击移动（单次触发） 
     *   'stop'   停止移动
     * - dir:  移动方向（仅当type为moveby/moveto时存在）
     *   - angle: 角度制方向（0-360度）
     *   - radian: 弧度制方向
     * - dt:   帧时间间隔（秒，仅当type为moveby时存在）
     * - pos:  目标位置坐标（仅当type为moveto时存在，相对屏幕中心的UI坐标系）
     */
    public moveHandleEvent(e: MoveHandleData) { }
}