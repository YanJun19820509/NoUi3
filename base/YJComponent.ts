
import { ccclass, Component, macro, Node } from '../yj';

/**
 * Predefined variables
 * Name = YJComponent
 * DateTime = Thu Jan 13 2022 00:26:24 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJComponent.ts
 * FileBasenameNoExtension = YJComponent
 * URL = db://assets/Script/NoUi3/base/YJComponent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJComponent')
export class YJComponent extends Component {
    private updateHandlers: Map<number, any>;
    private updateHandlersNum: number = 0;
    private needRemoveHandlerKeys: number[] = [];

    /**
     * 添加基于帧频的lateUpdate执行方法
     * @param f 要执行的回调函数，当返回false时自动移除
     * @param frequency 执行频率（每隔n帧执行一次），默认1帧
     * @returns {number} 处理器唯一标识key，用于后续移除
     * @example
     * // 每5帧执行一次
     * const key = this.addUpdateHandlerByFrame((dt) => {
     *     console.log('每5帧执行');
     *     return true; // 返回false将自动移除
     * }, 5);
     */
    public addUpdateHandlerByFrame(f: Function, frequency = 1): number {
        return this.addHandler({ f: f, fre: frequency, n: 0 });
    }

    /**
     * 添加基于时间的lateUpdate执行方法
     * @param f 要执行的回调函数，当返回false时自动移除
     * @param duration 执行间隔（单位：秒），例如0.5表示半秒执行一次
     * @returns {number} 处理器唯一标识key，用于后续移除
     * @example
     * // 每0.5秒执行一次
     * const key = this.addUpdateHandlerByTime((dt) => {
     *     console.log('每0.5秒执行');
     *     return true; // 返回false将自动移除
     * }, 0.5);
     */
    public addUpdateHandlerByTime(f: Function, duration: number): number {
        return this.addHandler({ f: f, dur: duration, dt: 0 });
    }

    /**
     * 内部方法：添加处理器到管理Map
     * @param v 处理器配置对象
     * @returns {number} 自增的处理器唯一标识
     */
    private addHandler(v: any): number {
        this.updateHandlers = this.updateHandlers || new Map<number, any>();
        this.updateHandlers.set(this.updateHandlersNum, v);
        return this.updateHandlersNum++;
    }

    /**
     * 移除已注册的更新处理器
     * @param handlerKey 通过add方法获取的处理器标识key
     * @example
     * // 添加后立即移除示例
     * const key = this.addUpdateHandlerByFrame(() => {});
     * this.removeUpdateHandler(key);
     */
    public removeUpdateHandler(handlerKey: number): void {
        if (handlerKey == null) return;
        this.needRemoveHandlerKeys.push(handlerKey);
    }

    /**
     * 清空所有更新处理器
     * @example
     * // 场景切换时清空所有定时器
     * this.clearUpdateHandlers();
     */
    public clearUpdateHandlers(): void {
        this.updateHandlers = null;
    }

    /**
     * 执行注册的更新处理器
     * @param dt 距离上次更新的时间（秒）
     * @remarks
     * 处理两种更新模式：
     * 1. 时间间隔模式：根据duration参数按时间间隔执行
     * 2. 帧间隔模式：根据frequency参数按帧数间隔执行
     * 
     * @example
     * // 当回调返回false时自动移除处理器
     * this.addUpdateHandlerByTime((dt) => {
     *     if(condition) return false; // 满足条件时自动移除
     *     return true;
     * }, 0.5);
     */
    private executeUpdateHandlers(dt: number): void {
        if (this.updateHandlers == null) return;

        this.removeHandlers(this.needRemoveHandlerKeys);
        this.needRemoveHandlerKeys.length = 0;
        let keys = [];
        this.updateHandlers.forEach((v, k) => {
            let run = false;
            if (v.dur != undefined) {
                v.dt += dt;
                run = v.dt >= v.dur;
                run && (v.dt = 0);
            } else {
                v.n++;
                run = v.n >= v.fre;
                run && (v.n = 0);
            }
            if (run) {
                if (v.f.call(this, dt) === false) {
                    keys.push(k);
                }
            }
        });
        this.removeHandlers(keys);
    }

    /**
     * 移除指定标识的处理器
     * @param keys 要移除的处理器标识数组
     * @example
     * // 批量移除多个处理器
     * this.removeHandlers([key1, key2, key3]);
     */
    private removeHandlers(keys: number[]): void {
        for (let i = 0; i < keys.length; i++) {
            this.updateHandlers?.delete(keys[i]);
        }
    }

    /**
     * lateUpdate生命周期回调
     * @param dt 距离上次更新的时间（秒）
     * @remarks 继承Component的lateUpdate方法，用于驱动自定义更新处理器
     * @example
     * // 组件启用时会自动执行lateUpdate
     * this.node.active = true;
     */
    lateUpdate(dt: number) {
        this.executeUpdateHandlers(dt);
    }

    /**
     * 等待表达式成立
     * @param express 条件表达式（可接收dt参数）
     * @returns Promise 当表达式返回true时resolve
     * @example
     * // 等待isReady变量变为true
     * await this.waitFor(() => this.isReady);
     * 
     * // 等待时间超过3秒
     * let start = Date.now();
     * await this.waitFor(() => Date.now() - start > 3000);
     */
    public async waitFor(express: (dt?: number) => boolean): Promise<void> {
        return new Promise<void>(resolve => {
            this.callUntil(express, resolve);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 直到表达式成立后执行回调
     * @param express 条件表达式（可接收dt参数）
     * @param callback 条件满足时的回调
     * @param dt 初始检测延迟时间（秒）
     * @example
     * // 当节点x位置大于100时执行动画
     * this.callUntil(() => this.node.x > 100, () => this.playJumpAnim());
     * 
     * // 延迟1秒后检测是否可见
     * this.callUntil(() => this.visible, () => console.log('可见了'), 1);
     */
    public callUntil(express: (dt?: number) => boolean, callback: () => void, dt = 0): void {
        if (express(dt)) {
            callback?.();
            return;
        }
        const cb = (dt: number) => {
            if (express(dt)) {
                callback?.();
                this.unschedule(cb);
            }
        }
        this.schedule(cb, 0, macro.REPEAT_FOREVER);
    }

    /**
     * 等待几帧
     * @param n 要等待的帧数（不传或0:下一帧，负数:无限等待）
     * @returns Promise 在指定帧数后resolve
     * @example
     * // 等待下一帧
     * await this.waitForFrames();
     * 
     * // 等待3帧后执行
     * await this.waitForFrames(3);
     */
    public async waitForFrames(n?: number): Promise<void> {
        return new Promise<void>(resolve => {
            let repeat = !n ? 0 : (n < 0 ? Infinity : n - 1);
            this.schedule(resolve, 0, repeat);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 等待一段时间
     * @param duration 要等待的秒数
     * @returns Promise 在指定时间后resolve
     * @example
     * // 等待2.5秒
     * await this.waitForTime(2.5);
     * 
     * // 组合使用：先等待1秒再执行
     * await this.waitForTime(1);
     * this.doSomething();
     */
    public async waitForTime(duration: number): Promise<void> {
        return new Promise<void>(resolve => {
            this.scheduleOnce(resolve, duration);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 清除所有等待和定时回调
     * @example
     * // 在场景切换时取消所有等待
     * this.clearWaits();
     */
    public clearWaits(): void {
        this.unscheduleAllCallbacks();
    }
}
