import { ccclass, property, Vec3 } from '../yj';
import { HackUi } from './HackUi';
import { nodeUtils } from '../extend/nodeUtils';

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
        nodeUtils.moveBy(this.node, data, this.reverse);
    }
}
