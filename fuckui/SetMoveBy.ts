import { ccclass, Vec3 } from 'NoUi3/yj';
import { FuckUi } from './FuckUi';
import { no } from 'NoUi3/no';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Feb 13 2025 11:18:15 GMT+0800 (中国标准时间)
 * data: {x:number,y:number}|0|{radian:number,distance:number}，{x:number,y:number}表示移动增量，0表示更新当前位置，{radian:number,distance:number}表示移动指定角度和距离
 */

@ccclass('SetMoveBy')
export class SetMoveBy extends FuckUi {
    // 存储节点位置的向量
    private _pos: Vec3;

    /**
     * 处理数据变化的方法
     * @param data 位置数据，可以是以下几种格式:
     * - 0: 更新并存储当前节点位置
     * - {x:number, y:number}: 按x和y方向移动指定距离
     * - {radian:number, distance:number}: 按指定角度和距离移动
     */
    protected onDataChange(data: any) {
        // 当data为0时，仅更新当前位置
        if (data == 0) {
            this._pos = no.position(this.node);
            return;
        }

        // 如果_pos未初始化，则获取当前节点位置
        if (!this._pos) {
            this._pos = no.position(this.node);
        }

        // 如果提供了角度和距离，按极坐标方式移动
        if (data.radian && data.distance) {
            // 使用三角函数计算x和y方向的位移
            this._pos.x += data.distance * Math.cos(data.radian);
            this._pos.y += data.distance * Math.sin(data.radian);
        } else {
            // 直接按x、y坐标增量移动
            this._pos.x += data.x;
            this._pos.y += data.y;
        }

        // 将计算后的新位置应用到节点上
        no.position(this.node, this._pos);
    }
}
