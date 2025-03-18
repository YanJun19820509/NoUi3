
import { ccclass, property, requireComponent, math } from '../yj';
import { no } from '../no';
import { YJScrollPanel } from '../widget/scrollPanel/YJScrollPanel';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetScrollPanel
 * DateTime = Mon Aug 15 2022 09:57:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollPanel.ts
 * FileBasenameNoExtension = SetScrollPanel
 * URL = db://assets/NoUi3/ui/SetScrollPanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 设置YJScrollPanel
 * data:{
 *     pos?: [x,y],
 *     target?: string,
 *     scale?: number,
 *     offset?: number[],
 *     duration?: number
 * }
 */
@ccclass('SetScrollPanel')
@requireComponent(YJScrollPanel)
/**
 * 滚动面板控制组件
 * 提供三种滚动控制方式：
 * 1. 滚动到指定坐标位置
 * 2. 滚动到指定目标节点
 * 3. 调整面板缩放比例
 * 示例数据：
 * {pos: [100,200], scale: 1.2, offset: [10,0], duration: 0.5}
 * {target: "itemNode", duration: 1}
 * {scale: 0.8}
 */
export class SetScrollPanel extends HackUi {
    // 滚动结束事件处理器数组
    @property({ type: no.EventHandlerInfo })
    onScrollEnd: no.EventHandlerInfo[] = [];

    /**
     * 数据变化处理函数
     * @param data 配置数据，包含以下可选参数：
     * - pos: 目标坐标[x,y] 
     * - target: 目标节点名称
     * - scale: 目标缩放比例
     * - offset: 视口偏移量[x,y]
     * - duration: 动画持续时间（秒）
     */
    protected onDataChange(data: any) {
        // 解构配置参数并设置默认值
        let { pos, target, scale, offset, duration }: { 
            pos?: number[], 
            target?: string, 
            scale?: number, 
            offset?: number[], 
            duration?: number 
        } = data;
        
        // 确保持续时间不小于0
        if (duration < 0) duration = 0;
        
        // 获取滚动面板组件
        let sp = this.getComponent(YJScrollPanel);
        // 转换偏移量为cc.Vec2对象
        let os = offset ? math.v2(offset[0], offset[1]) : null;

        // 情况1: 指定坐标位置滚动
        if (pos) {
            let p = math.v3(pos[0], pos[1]);
            if (scale) {
                // 带缩放的滚动（示例：{pos: [100,200], scale: 1.2}）
                sp.scrollToAndScale(p, scale, os, duration);
            } else {
                // 普通滚动（示例：{pos: [50,100], duration: 1}）
                sp.scrollTo(p, os, duration);
            }
            this.endCall(duration);
        } 
        // 情况2: 指定目标节点滚动
        else if (target) {
            if (scale) {
                // 滚动到目标并缩放（示例：{target: "boss", scale: 1.5}）
                sp.scrollToTargetAndScale(target, scale, os, duration, () => {
                    this.endCall(duration);
                });
            } else {
                // 普通滚动到目标（示例：{target: "player"}）
                sp.scrollToTarget(target, os, duration, () => {
                    this.endCall(duration);
                });
            }
        } 
        // 情况3: 仅缩放操作
        else if (scale) {
            // 纯缩放动画（示例：{scale: 0.8, duration: 0.3}）
            sp.scaleTo(scale, duration);
            this.endCall(duration);
        }
    }

    /**
     * 延迟触发滚动结束事件
     * @param duration 延迟时间（秒）
     * 事件参数示例：[调用者, 自定义参数, 滚动结束时间...]
     */
    private endCall(duration = 0) {
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.onScrollEnd);
        }, duration);
    }
}
