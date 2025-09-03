
import { ccclass, menu } from '../yj';
import { no } from '../no';
import { SetHeight } from './SetHeight';

/**
 * Predefined variables
 * Name = SetWidth
 * DateTime = Mon Jan 17 2022 14:46:14 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetWidth.ts
 * FileBasenameNoExtension = SetWidth
 * URL = db://assets/Script/NoUi3/ui/SetWidth.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetWidth')
@menu('NoUi/ui/SetWidth(设置宽:number)')
/**
 * 设置节点宽度的组件（继承自SetHeight共享计算逻辑）
 * 
 * @特性说明
 * - 通过数据绑定动态计算宽度值
 * - 支持百分比、表达式等多种计算方式（依赖父类caculate实现）
 * - 自动响应数据变更并更新宽度
 * 
 * @示例用法
 * // 在编辑器绑定数据：
 * // 当数据{ maxWidth: 100 }时，设置节点宽度为屏幕宽度的50%
 * {
 *   "expression": "Math.min(data.maxWidth, screenWidth * 0.5)"
 * }
 */
export class SetWidth extends SetHeight {

    /**
     * 数据变更处理回调
     * @param data 输入数据，可以是以下类型：
     * - number: 直接作为宽度值
     * - string: 百分比字符串（如"50%"）
     * - object: 包含计算表达式/公式的配置对象
     */
    protected onDataChange(data: any) {
        // 调用父类计算方法处理数据后设置宽度
        // caculate方法支持多种数据格式处理：
        // - 数值直接返回
        // - "50%" 转换为父节点宽度的50%
        // - { expression: "data.width * 2" } 使用表达式计算
        no.width(this.node, this.caculate(data));
    }
}
