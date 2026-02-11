/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 12:21:19 GMT+0800 (中国标准时间)
 *
 */

import { DEBUG, sys } from "../yj";
import { arrayUtils } from "./arrayUtils";
import { no } from "../no";

/**
     * 时间系统
     */
class st {
    private _time: number;
    private _targets: any[];
    private _num: number;
    private _IdKey = '__tickTockId';

    /** 
     * 获取/设置当前游戏系统时间（基于游戏启动时间的秒数计时）
     * @example
     * // 获取当前游戏运行时间
     * const currentTime = no.sysTime.now;
     * // 设置游戏时间（用于调试或时间同步）
     * no.sysTime.now = 3600; // 设置为1小时
     */
    public get now(): number {
        return this._time;
    }

    public set now(v: number) {
        this._time = v;
    }

    /**
     * 获取当前设备本地时间戳（毫秒级，不受游戏时间影响）
     * @returns 当前设备时间戳（毫秒）
     * @example
     * // 记录精确的本地时间
     * const timestamp = no.sysTime.locationNow;
     * console.log(`当前设备时间：${new Date(timestamp)}`);
     */
    public get locationNow(): number {
        return Date.now();
    }

    constructor() {
        // 初始化系统时间（转换为秒）
        let t = Math.floor(sys.now() / 1000);
        this._time = t;
        this._targets = [];
        this._num = 1;

        // 创建每秒定时器
        setInterval(() => {
            this._time++;
            this.cb();
        }, 1000);
    }

    /**
     * 注册每秒回调（需实现doTickTock方法）
     * @param target 需要接收时间更新的对象，必须包含doTickTock(now: number)方法
     * @example
     * class GameTimer {
     *     doTickTock(now: number) {
     *         console.log(`当前游戏时间：${now}`);
     *     }
     * }
     * const timer = new GameTimer();
     * no.sysTime.onTickTock(timer);
     */
    public onTickTock(target: any): void {
        if (target == null) return;
        if (!target[this._IdKey])
            target[this._IdKey] = this._num++;
        arrayUtils.addToArray(this._targets, target, this._IdKey);
    }

    /**
     * 取消注册每秒回调
     * @param target 需要移除的时间监听对象
     * @example
     * // 当对象销毁时取消时间监听
     * no.sysTime.offTickTock(timer);
     */
    public offTickTock(target: any): void {
        arrayUtils.removeFromArray(this._targets, target, this._IdKey);
    }

    /**
     * 每秒触发所有注册对象的回调
     * @private
     */
    private cb() {
        // 调试模式下增加异常捕获
        if (DEBUG) {
            try {
                for (let i = this._targets.length - 1; i >= 0; i--) {
                    let a = this._targets[i];
                    if (a && a.doTickTock) a.doTickTock(this._time);
                }
            } catch (e) {
                no.log(e);
            }
        } else {
            // 生产环境直接执行
            for (let i = this._targets.length - 1; i >= 0; i--) {
                let a = this._targets[i];
                if (a && a.doTickTock) a.doTickTock(this._time);
            }
        }
    }
}

/**系统时间 */
export const sysTime = new st();