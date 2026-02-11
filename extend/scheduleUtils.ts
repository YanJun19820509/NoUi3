/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:25:18 GMT+0800 (中国标准时间)
 *
 */

import { no } from "../no";
import { Component, director, macro, Scheduler } from "../yj";
import { arrayUtils } from "./arrayUtils";

export namespace scheduleUtils {


    const _scheduler: Scheduler = director.getScheduler();
    type _schedulerTargetCallbackType = { target: any, cb: (dt?: number) => void, callback: (dt: number) => void, repeat?: number, endCall?: () => void };
    const _schedulerTargetCallbackMap: { [uuid: string]: _schedulerTargetCallbackType[] } = {};

    function getTargetCallback(uuid: string, cb: (dt?: number) => void): _schedulerTargetCallbackType {
        const arr: _schedulerTargetCallbackType[] = _schedulerTargetCallbackMap[uuid];
        if (arr) {
            return arrayUtils.itemOfArray<_schedulerTargetCallbackType>(arr, cb, 'cb');
        }
        return null;
    }

    function setTargetCallback(uuid: string, target: any, cb: (dt?: number) => void, callback: (dt: number) => void, repeat?: number, endCall?: () => void) {
        _schedulerTargetCallbackMap[uuid] = _schedulerTargetCallbackMap[uuid] || [];
        _schedulerTargetCallbackMap[uuid].push({ target: target, cb: cb, callback: callback, repeat: repeat, endCall: endCall });
    }

    function removeTargetCallback(uuid: string, cb: (dt?: number) => void) {
        const arr: _schedulerTargetCallbackType[] = _schedulerTargetCallbackMap[uuid];
        if (arr) {
            const i = arrayUtils.indexOfArray(arr, cb, 'cb');
            if (i > -1) {
                const a = arr[i];
                _scheduler.unschedule(a.callback, { uuid: uuid });
                arr.splice(i, 1);
                a.callback = null;
                return true;
            }
        }
        return false;
    }
    /**
     * 定时器
     * @param cb 
     * @param interval 秒
     * @param repeat 如果为macro.REPEAT_FOREVER，请使用scheduleForever
     * @param delay 秒
     * @param target 
     * @param endCb 定时结束时回调
     */
    export function schedule(cb: (dt?: number) => void, interval: number, repeat: number, delay: number, target: any = {}, endCb?: () => void) {
        if (target && target._uuid == undefined) target._uuid = no.uuid();
        const _uuid = target._uuid;
        unschedule(_uuid, cb);

        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, cb);
            if (a.repeat > 0) {
                --a.repeat;
            } else {
                endCb?.call(a.target);
                unschedule(_uuid, cb);
                return;
            }
            if (!a.target)
                cb?.(dt);
            else if (no.checkValid(a.target)) {
                cb?.call(a.target, dt);
            } else {
                unschedule(_uuid, cb);
                return;
            }
        };
        setTargetCallback(_uuid, target, cb, callback, repeat);
        _scheduler.schedule(callback, { uuid: _uuid }, interval, repeat, delay, false);
    }
    /**
     * 定时执行一次
     * @param cb 
     * @param delay 秒
     * @param target 
     */
    export function scheduleOnce(cb: (dt?: number) => void, delay: number, target: any = {}) {
        schedule(cb, delay, 1, 0, target);
    }
    /**
     * 定时执行无限次
     * @param cb 
     * @param interval 秒 
     * @param target 
     */
    export function scheduleForever(cb: (dt?: number) => void, interval: number, target: any = {}) {
        if (target && target._uuid == undefined) target._uuid = no.uuid();
        const _uuid = target._uuid;
        unschedule(_uuid, cb);

        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, cb);
            if (!a.target)
                cb?.(dt);
            else if (no.checkValid(a.target)) {
                cb?.call(a.target, dt);
            } else {
                unschedule(_uuid, cb);
                return;
            }
        };
        setTargetCallback(_uuid, target, cb, callback);
        _scheduler.schedule(callback, { uuid: _uuid }, interval, macro.REPEAT_FOREVER, 0, false);
    }
    /**
     * 每帧执行target的check方法，当返回true时执行onChecked并停止
     * @param check 
     * @param onChecked 
     * @param target 
     * @param maxTry 最大尝试次数
     */
    export function scheduleUpdateCheck(check: (dt?: number) => boolean, onChecked: () => void, target: any = {}, maxTry?: number) {
        if (!check || !onChecked) return;
        if (check.call(target, 0)) {
            onChecked.call(target);
            return;
        }
        if (target && target._uuid == undefined) target._uuid = no.uuid();
        let _uuid = target._uuid;

        unschedule(_uuid, check);

        if (maxTry == null) maxTry = macro.REPEAT_FOREVER;
        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, check);
            if (!no.checkValid(a.target)) {
                unschedule(_uuid, check);
            } else if (check.call(a.target, dt)) {
                onChecked.call(a.target);
                unschedule(_uuid, check);
            }
        };
        setTargetCallback(_uuid, target, check, callback);
        _scheduler.schedule(callback, { uuid: _uuid }, .1, maxTry, 0, false);
    }

    /**
     * 定时执行cb，直到until返回true结束
     * @param cb 
     * @param interval 
     * @param until 
     * @param delay 
     * @param target 
     */
    export function scheduleUntil(cb: (dt?: number) => void, interval: number, until: () => boolean, delay?: number, target: any = {}) {
        if (until.call(target)) {
            cb?.call(target);
            return;
        }
        if (target && target._uuid == undefined) target._uuid = no.uuid();
        const _uuid = target._uuid;

        unschedule(_uuid, cb);

        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, cb);
            if ((a.target && !no.checkValid(a.target)) || until.call(a.target)) {
                unschedule(_uuid, cb);
            } else {
                cb?.call(a.target, dt);
            }
        };
        setTargetCallback(_uuid, target, cb, callback);
        _scheduler.schedule(callback, { uuid: _uuid }, interval, macro.REPEAT_FOREVER, delay, false);
    }

    /**
     * 这个方法比较耗性能，不要频繁使用
     * @param cb 
     * @param target 
     * @returns 
     */
    export function isScheduled(cb: any, target: any): boolean {
        return _scheduler.isScheduled(cb, target);
    }

    /**
     * 取消target所有定时回调
     * @param target 
     */
    export function unschedule(target: any, cb?: any) {
        const _uuid = target?._uuid || target;
        if (!_uuid) return;
        if (!cb) {
            _scheduler?.unscheduleAllForTarget({ uuid: _uuid });
        } else {
            if (!removeTargetCallback(_uuid, cb))
                _scheduler.unschedule(cb, { uuid: _uuid });
        }
    }

    /**
     * 取消所有定时回调
     */
    export function unscheduleAll() {
        _scheduler?.unscheduleAll();
    }
    /**
     * 每帧执行target的update方法
     * @param target 
     * @param priority  优先级的值越低，定时器被触发的越早
     */
    export function scheduleTargetUpdateFunction(target: any, priority: number) {
        if (!target || !target['update'] || typeof target['update'] != 'function') return;
        if (target._uuid == undefined) target._uuid = no.uuid();
        _scheduler.scheduleUpdate(target, priority, false);
    }

    /**
     * 取消每帧执行target的update方法
     * @param target 
     * @returns 
     */
    export function unscheduleTargetUpdateFunction(target: any) {
        if (!target) return;
        _scheduler?.unscheduleUpdate(target);
    }

    /**
     * 暂停schedule
     * @param target 
     * @returns 
     */
    export function pauseSchedule(target: any) {
        if (!target) return;
        _scheduler?.pauseTarget(target);
    }

    /**
     * 继续schedule
     * @param target 
     * @returns 
     */
    export function resumeSchedule(target: any) {
        if (!target) return;
        _scheduler?.resumeTarget(target);
    }

    /**
     * 替代原生setTimeout方法
     * @param callback 
     * @param ms 
     * @param target 如果target为组件，需要注意不要同时调用target的schedule方法，否则在clearInterval时很可能会取消target的schedule
     * @returns 
     */
    export function setTimeoutF(callback: () => void, ms = 0, target?: any) {
        const a = target || { uuid: no.uuid() };
        scheduleOnce(callback, ms / 1000, a);
        return a._uuid;
    }

    /**
     * 替代原生clearTimeout方法
     * @param handler 
     * @returns 
     */
    export function clearTimeoutF(handler: string) {
        if (!handler) return;
        unschedule(handler);
    }

    /**
     * 替代原生setInterval方法
     * @param callback 
     * @param ms 
     * @param target 如果target为组件，需要注意不要同时调用target的schedule方法，否则在clearInterval时很可能会取消target的schedule
     * @returns 
     */
    export function setIntervalF(callback: () => void, ms = 0, target?: any) {
        const a = target || { uuid: no.uuid() };
        scheduleForever(callback, ms / 1000, a);
        return a._uuid;
    }

    /**
     * 替代原生clearInterval方法
     * @param handler 
     * @returns 
     */
    export function clearIntervalF(handler: string) {
        if (!handler) return;
        unschedule(handler);
    }

    /**
     * 等待条件成立（返回Promise）
     * @param express 条件判断函数，返回boolean（可接收deltaTime参数）
     * @param comp 关联的组件（可选，用于自动管理生命周期）
     * @returns Promise对象，当条件成立时解析
     * @example
     * // 等待玩家血量恢复
     * await no.waitFor(() => player.health >= 100);
     * 
     * // 带组件的条件等待（组件销毁时自动取消）
     * await no.waitFor(
     *   () => loadingProgress >= 1.0,
     *   this.loadingComponent
     * );
     */
    export function waitFor(express: (dt?: number) => boolean, comp?: Component): Promise<void> {
        if (comp)
            return new Promise<void>(resolve => {
                scheduleUpdateCheck(express, resolve, comp);
            }).catch(e => {
                console.error(e);
            });
        else
            return no.checkUntil(express);
    }
}