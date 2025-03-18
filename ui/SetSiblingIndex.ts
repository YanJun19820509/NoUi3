import { no } from '../no';
import { ccclass, menu, property, Enum } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetSiblingIndex
 * DateTime = Mon Jan 17 2022 14:19:53 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSiblingIndex.ts
 * FileBasenameNoExtension = SetSiblingIndex
 * URL = db://assets/Script/NoUi3/ui/SetSiblingIndex.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

export enum SiblingType {
    None = 0,
    Top,
    Bottom
}

@ccclass('SetSiblingIndex')
@menu('NoUi/ui/SetSiblingIndex(设置同级节点索引:number)')
/**
 * 节点层级控制组件
 * 功能说明：
 * - 提供三种层级调整方式：
 *   1. None: 直接设置具体索引值
 *   2. Top: 将节点置顶（设置到同级末尾）
 *   3. Bottom: 将节点置底（设置到同级开头）
 * 
 * 使用示例：
 * // 设置节点为同级第3个位置（索引从0开始）
 * this.a_setData(2) && this.type=None
 * // 当data为true时置顶节点
 * this.a_setData(true) && this.type=Top
 * // 当data为true时置底节点
 * this.a_setData(true) && this.type=Bottom
 */
export class SetSiblingIndex extends HackUi {
    /**
     * 层级调整方式枚举：
     * - None: 直接设置索引值
     * - Top: 置顶节点（设置到同级末尾）
     * - Bottom: 置底节点（设置到同级开头）
     */
    @property({ type: Enum(SiblingType), displayName: '方式' })
    type: SiblingType = SiblingType.None;

    /**
     * 数据变化处理函数
     * @param data 根据不同类型需要的数据：
     * - None模式: 数字类型，表示要设置的索引值（0-based）
     * - Top/Bottom模式: 布尔值，true时执行对应操作
     */
    protected onDataChange(data: any) {
        switch (this.type) {
            case SiblingType.None:
                // 直接设置具体索引值（需确保索引在有效范围内）
                // 示例：data=3 将节点设置到第4个位置
                no.siblingIndex(this.node, Number(data));
                break;
            case SiblingType.Top:
                // 当data为true时，将节点设置到同级末尾（置顶）
                // 注意：需要确保节点有父节点
                if (Boolean(data)) {
                    const lastIndex = this.node.parent.children.length - 1;
                    no.siblingIndex(this.node, lastIndex);
                }
                break;
            case SiblingType.Bottom:
                // 当data为true时，将节点设置到同级开头（置底）
                // 注意：会改变原有同级节点顺序
                if (Boolean(data)) {
                    no.siblingIndex(this.node, 0);
                }
                break;
        }
    }
}
