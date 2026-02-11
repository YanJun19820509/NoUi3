import { ccclass, menu, property } from '../yj';
import { HackUi } from './HackUi';
import { nodeUtils } from '../extend/nodeUtils';

/**
 * Predefined variables
 * Name = SetPositionY
 * DateTime = Mon Jan 17 2022 12:10:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPositionY.ts
 * FileBasenameNoExtension = SetPositionY
 * URL = db://assets/Script/NoUi3/ui/SetPositionY.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPositionY')
@menu('NoUi/ui/SetPositionY(设置y坐标:number)')
/**
 * 设置节点Y坐标组件
 * 功能说明：
 * - 支持绝对坐标和相对父节点高度百分比两种模式
 * - 自动处理数值类型转换和异常值
 * - 继承自HackUi，支持通过节点事件驱动数据变化
 * 
 * @使用示例：
 * // 设置绝对Y坐标为200
 * this.a_setData(200);
 * // 设置相对父节点高度50%位置（需先开启isPer属性）
 * this.a_setData(0.5);
 * // 通过字符串设置坐标
 * this.a_setData("150.5"); // 转换为150.5
 */
export class SetPositionY extends HackUi {
    /**
     * 是否为相对父节点高度模式
     * @property {boolean} isPer
     * @default false
     * @规则说明：
     * - 启用时输入值应为0~1之间的比例值
     * - 实际坐标 = 输入值 * 父节点高度
     * @示例：
     * // 当父节点高度为400时：
     * this.isPer = true;
     * this.a_setData(0.75); // 实际Y坐标=300
     */
    @property({ displayName: '相对父节点', tooltip: '此时需要传入0~1，在父节点高度范围内' })
    isPer: boolean = false;

    /**
     * 缓存父节点高度（优化性能避免重复计算）
     * @private
     */
    private _parentHeight: number;

    /**
     * 数据变化处理核心方法
     * @param data 输入数据：
     * - 数字类型：直接作为Y坐标值
     * - 字符串类型：可转换为数字的字符串
     * - 其他类型：尝试转换为数字，失败则使用0
     * @实现流程：
     * 1. 相对模式时：
     *    a. 首次计算缓存父节点高度
     *    b. 将输入值转换为父节点高度的比例
     * 2. 绝对模式时直接使用输入值
     * 3. 通过no.y安全设置坐标（自动处理NaN/undefined）
     */
    protected onDataChange(data: any) {
        // 相对百分比模式处理
        if (this.isPer) {
            // 延迟计算父节点高度（确保节点树已建立）
            if (!this._parentHeight) {
                // 使用no.height获取父节点高度（已包含空值保护）
                this._parentHeight = nodeUtils.height(this.node.parent);
            }
            // 将比例值转换为实际坐标（自动处理非数值输入）
            data *= this._parentHeight;
        }
        
        // 设置最终坐标（Number转换保证类型安全）
        // no.y内部已处理异常值：当data转换失败时保持原坐标不变
        nodeUtils.y(this.node, Number(data));
    }
}
