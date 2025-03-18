import { HackUi } from './HackUi';
import { no } from '../no';
import { ccclass } from '../yj';

/**
 * Predefined variables
 * Name = SetAnchorPoint
 * DateTime = Wed Jun 15 2022 15:55:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAnchorPoint.ts
 * FileBasenameNoExtension = SetAnchorPoint
 * URL = db://assets/NoUi3/ui/SetAnchorPoint.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 设置节点锚点组件
 * 
 * @功能说明
 * - 通过数据驱动方式设置UI节点的锚点位置
 * - 支持多种输入格式：数字、字符串、数组
 * - 自动处理类型转换，适配不同数据来源
 * 
 * @使用示例
 * // 设置统一锚点（x和y相同）
 * a_setData(0.5);       // 设置锚点为(0.5, 0.5)
 * 
 * // 设置不同锚点
 * a_setData([0, 0.5]);  // 设置锚点为(0, 0.5)
 * 
 * // 字符串输入自动转换
 * a_setData("0.5");     // 等效于a_setData(0.5)
 */
@ccclass('SetAnchorPoint')
export class SetAnchorPoint extends HackUi {
    /**
     * 数据变更处理核心方法
     * @param data 锚点数据，支持格式：
     * - number: 同时设置x/y锚点（如0.5 → [0.5, 0.5]）
     * - string: 数字字符串自动转换（如"0.5" → [0.5]）
     * - number[]: 直接设置[x,y]锚点（[0, 0.5] → 锚点x=0,y=0.5）
     */
    protected onDataChange(data: any) {
        // 统一转换为数组格式处理
        if (typeof data == 'number') {
            // 单个数字参数处理：同时设置x/y轴
            data = [data];
        } else if (typeof data == 'string') {
            // 字符串参数处理：转换为数字数组
            data = [Number(data)];
        }
        
        // 调用no工具类设置锚点
        // 参数说明：this.node-目标节点，data-锚点数组[x,y]或[x]
        no.anchor(this.node, data);
    }
}
