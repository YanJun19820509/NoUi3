
import { ccclass, menu } from '../../yj';
import { SetNodeTweenAction } from '../SetNodeTweenAction';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = SetBlink
 * DateTime = Mon Jan 17 2022 09:55:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetBlink.ts
 * FileBasenameNoExtension = SetBlink
 * URL = db://assets/Script/NoUi3/tween/SetBlink.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetBlink')
@menu('NoUi/tween/SetBlink(闪烁动效:{frequency:number, repeat: number})')
/**
 * 节点闪烁动效组件
 * @通过周期性改变节点透明度实现闪烁效果
 * @data配置示例 {
 *     frequency: 2,   // 每秒闪烁次数（频率）
 *     repeat: 3       // 重复执行次数（0=无限循环）
 * }
 */
export class SetBlink extends SetNodeTweenAction {
    /**
     * 创建闪烁动画配置
     * @param data 动效参数 {
     *     frequency: number,  // 闪烁频率（次/秒）
     *     repeat: number      // 重复次数（0=无限循环）
     * }
     * @returns 生成的动画配置集
     * 
     * @实现原理
     * 1. 单次闪烁包含两个阶段：淡出（到透明）和淡入（恢复显示）
     * 2. 每个阶段持续时间 = 1秒 / 频率 / 2（平分一个完整周期）
     * 3. 通过repeat参数控制循环次数
     * 
     * @示例
     * createAction({
     *     frequency: 3,  // 每秒闪烁3次
     *     repeat: 2      // 总共执行2次完整闪烁
     * }) 
     * 将生成：淡出(0.166s) → 淡入(0.166s) → 重复1次 → 总共闪烁2次
     */
    protected createAction(data: any): no.TweenSet | no.TweenSet[] {
        // 构建动画阶段配置数组
        let d = [
            // 淡出阶段：节点透明度从255降到0
            {
                duration: 1 / data.frequency, // 单次阶段持续时间
                to: 1,                        // 使用线性插值
                props: {
                    opacity: 0                // 目标透明度
                }
            },
            // 淡入阶段：节点透明度从0恢复到255
            {
                duration: 1 / data.frequency,
                to: 1,
                props: {
                    opacity: 255
                }
            },
            // 循环控制配置
            {
                repeat: data.repeat // 重复次数（0=无限循环，1=执行1次完整循环）
            }
        ];
        
        // 将配置数据转换为实际的动画对象
        return no.parseTweenData(d, this.node);
    }
}
