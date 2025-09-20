import { ccclass, property, Vec3 } from '../yj';
import { HackUi } from './HackUi';
import { no } from '../no';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Feb 13 2025 11:18:15 GMT+0800 (中国标准时间)
 * data: {x:number,y:number}|0|{radian:number,distance:number}，{x:number,y:number}表示移动增量，0表示更新当前位置，{radian:number,distance:number}表示移动指定角度和距离
 */

@ccclass('SetMoveBy')
/**
 * 节点位移控制组件
 * @功能说明
 * - 支持多种位移方式：坐标增量、极坐标位移、位置重置
 * - 提供反向移动功能
 * - 自动记录当前位置作为位移基准点
 * @应用场景
 * - 游戏角色控制
 * - UI元素动画
 * - 场景对象动态移动
 */
export class SetMoveBy extends HackUi {
    /**
     * 反向移动开关
     * @example
     * // 启用反向时：
     * // 输入坐标(x:10,y:10) 实际移动(-10,-10)
     * // 极坐标移动参数将自动取反
     */
    @property({ displayName: '反向', tooltip: '反向移动' })
    reverse: boolean = false;

    /**
     * 节点位置基准点存储
     * @description 
     * - 记录初始位置作为位移计算的基准
     * - 每次位移操作都基于此基准点进行累加
     * - 重置位置时清空此基准点
     */
    private _pos: { x: number, y: number, z: number };

    /**
     * 处理位置数据变更
     * @param data 移动参数，支持多种格式：
     * @example <caption>重置当前位置</caption>
     * component.a_setData(0); // 清空基准点，下次移动从当前实际位置开始
     * 
     * @example <caption>直角坐标系移动</caption>
     * component.a_setData({x: 50, y: -30}); 
     * component.a_setData([20, 40]); // 数组形式[x,y]
     * 
     * @example <caption>极坐标系移动</caption>
     * // 30度角方向移动200像素
     * component.a_setData({ 
     *   radian: Math.PI/6, // 弧度制角度 
     *   distance: 200 
     * });
     */
    protected onDataChange(data: any) {
        // 位置重置逻辑：清空基准点，下次移动从当前实际位置开始
        if (data == 0) {
            this._pos = null;
            return;
        }

        // 初始化基准点：首次移动或重置后，记录当前实际位置
        if (!this._pos) {
            const { x, y, z } = no.position(this.node);
            this._pos = { x, y, z };
        }

        let x: number, y: number;

        // 极坐标处理逻辑
        if (data.radian && data.distance) {
            /**
             * 极坐标转直角坐标公式：
             * x = distance * cos(θ)
             * y = distance * sin(θ)
             * 其中θ为以x轴正方向为起点的弧度值
             */
            x = data.distance * Math.cos(data.radian);
            y = data.distance * Math.sin(data.radian);
        } else {
            // 直角坐标系处理：支持对象和数组两种传参方式
            x = data.x ?? data[0]; // 优先取对象形式的x值，不存在则取数组第一个元素
            y = data.y ?? data[1]; // 优先取对象形式的y值，不存在则取数组第二个元素
        }

        // 反向处理：对位移量取反
        if (this.reverse) {
            x = -x;
            y = -y;
        }

        // 更新基准点坐标
        this._pos.x += x;
        this._pos.y += y;

        // 应用新位置到实际节点
        no.position(this.node, this._pos);
    }
}
