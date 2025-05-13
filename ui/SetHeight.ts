
import { no } from '../no';
import { ccclass, property, menu, UITransform } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetHeight
 * DateTime = Mon Jan 17 2022 10:49:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetHeight.ts
 * FileBasenameNoExtension = SetHeight
 * URL = db://assets/Script/common/ui/SetHeight.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetHeight')
@menu('NoUi/ui/SetHeight(设置高:number)')
/**
 * 动态设置节点高度组件
 * @property percent 是否将输入值视为百分比（0-1范围）
 * @property max 当使用百分比模式时的最大像素值
 * @example
 * // 直接设置高度模式
 * this.setHeight.data = 200; // 直接设置200像素高
 * 
 * // 百分比模式
 * this.setHeight.percent = true;
 * this.setHeight.max = 300;
 * this.setHeight.data = 0.5; // 实际高度为150像素
 */
export class SetHeight extends HackUi {

    @property({ displayName: '是否百分比' })
    percent: boolean = false;

    @property({ displayName: '最大值', visible() { return this.percent; } })
    max: number = 0;

    /**
     * 数据变化回调函数
     * @param data 输入数据，可以是数字或可转换为数字的类型
     * @description
     * - 当percent=true时，数据会被解释为百分比（自动限制在0-1范围）
     * - 当percent=false时，直接使用原始数值
     */
    protected onDataChange(data: any): void {
        no.height(this.node, this.caculate(data));
    }

    /**
     * 计算最终高度值
     * @param data 输入数据
     * @returns 计算后的实际像素高度
     * @example
     * caculate(0.8) // percent模式返回 max*0.8
     * caculate(250) // 普通模式直接返回250
     */
    protected caculate(data: any): number {
        let h = Number(data);
        // 百分比模式处理逻辑
        if (this.percent) {
            // 限制输入值在0-1范围内
            h = Math.min(Math.max(h, 0), 1);
            // 转换为实际像素值
            h *= this.max;
        }
        // 返回最终计算结果，确保不小于0
        return Math.max(h, 0);
    }
}
