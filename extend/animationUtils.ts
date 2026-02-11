/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 17:18:35 GMT+0800 (中国标准时间)
 *
 */

import { no } from "@hackUi/no";
import { AnimationClip } from "cc";
import { Animation, Node } from "../yj";

export namespace animationUtils {
    export function play(node: Node, params: { name?: string, speed?: number, repeat?: number, wrapMode?: AnimationClip.WrapMode, beforeStartCb?: () => void, afterEndCb?: () => void }) {
        if (!no.checkValid(node)) return;
        let ani = node.getComponent(Animation);
        if (!ani) {
            no.err('animationUtils.play no animation', node.name);
            return;
        }
        let { name, speed, repeat, wrapMode, beforeStartCb, afterEndCb } = params;
        // 判断是否需要加载新动画
        if (ani.getState(name)) {
            _play(ani, name, speed, repeat, wrapMode, beforeStartCb, afterEndCb);
        } else {
            no.err('animationUtils.play no state', name);
        }
    }

    // ======================== 动画控制逻辑 ========================
    /**
     * 执行动画播放
     * @param name 动画状态名称
     * @param speed 播放速度
     * @param repeat 重复次数（null/-1=无限循环，0=停止）
     * 
     * @实现特性
     * - 支持播放控制：播放/停止/重置
     * - 自动处理事件监听
     * - 灵活的循环控制
     */
    function _play(ani: Animation, name: string, speed = 1, repeat?: number, wrapMode?: AnimationClip.WrapMode, beforeStartCb?: () => void, afterEndCb?: () => void) {
        let state = ani.getState(name);

        // 处理停止指令
        if (repeat == 0) {
            state?.stop();
            state?.setTime(0); // 重置播放进度
            return;
        }

        if (state) {
            // 注册动画事件监听
            if (beforeStartCb) ani.on(Animation.EventType.PLAY, beforeStartCb);
            if (afterEndCb) ani.on(Animation.EventType.FINISHED, afterEndCb);

            // 配置循环参数
            if (repeat == null || repeat == -1) repeat = 999;
            if (wrapMode != null)
                state.wrapMode = wrapMode;
            state.repeatCount = repeat;
            state.speed = speed;
            state.play();
        }
    }
}