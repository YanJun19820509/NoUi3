import { FixedSizeArray } from "./FixedSizeArray";
import {
    AnimationClip, Asset, AudioClip, BufferAsset, Color, Component, DEBUG, EDITOR, EffectAsset, EventHandler, Font, JsonAsset, Material, Prefab, Quat,
    Rect, Scheduler, Size, SpriteAtlas, SpriteFrame, TextAsset, Texture2D, UIOpacity, UITransform, Vec2, Vec3, WECHAT, assetManager, ccclass, color,
    director, game, instantiate, isValid, js, macro, property, random, sys, tween, v2, v3, view, Node, Tween, EventTarget, ImageAsset, _AssetInfo, Button, Bundle, SkeletonData, NodeEventType, TTFFont, BlockInputEvents,
    Layers,
    CCObject,
    EventTouch,
    Toggle,
    resources, JSB,
    rendererCamera,
    screen,
    ResolutionPolicy,
    rect
} from "./yj";

//用于设置下载的最大并发连接数，若当前连接数超过限制，将会进入等待队列。
assetManager.downloader.maxConcurrency = 10;
//用于设置每帧发起的最大请求数，从而均摊发起请求的 CPU 开销，避免单帧过于卡顿
assetManager.downloader.maxRequestsPerFrame = 10;
assetManager.downloader.maxRetryCount = 2;
export namespace no {
    let _debug: boolean = DEBUG;
    let _version: string = '';
    let _appVer: string = '';
    let _isLogEnabled: boolean = DEBUG;
    let _isSpineEnable: boolean = true;

    /**
     * 不支持动态合图
     */
    export const notUseDynamicAtlas = false;//sys.platform == sys.Platform.WECHAT_GAME && sys.os == sys.OS.IOS;

    /**
     * 获取当前调试模式状态
     * @returns 是否处于调试模式
     * @example
     * if (no.isDebug()) {
     *     // 调试模式下显示开发面板
     *     showDevTools();
     * }
     */
    export function isDebug(): boolean {
        return _debug;
    }

    /**
     * 设置调试模式状态
     * @param v 是否启用调试模式
     * @example
     * // 测试阶段开启调试模式
     * no.setDebug(true);
     * // 生产环境关闭调试模式
     * no.setDebug(false);
     */
    export function setDebug(v: boolean) {
        _debug = v;
        _isLogEnabled = v;
        log('isDebug', _debug);
    }

    /**
     * 游戏资源版本
     * @returns 
     */
    export function gameVersion(): string {
        return _version;
    }
    /**
     * 游戏资源版本
     * @param v 
     */
    export function setGameVersion(v: string) {
        _version = v;
    }
    /**
     * 上线版本
     * @returns 
     */
    export function appVer(): string {
        return _appVer;
    }
    /**
     * 上线版本
     * @param v 
     */
    export function setAppVer(v: string) {
        _appVer = v;
    }

    /**
     * 获取当前Spine动画是否启用
     * @returns 当前Spine动画启用状态
     * @example
     * // 检查当前Spine动画状态
     * const isEnabled = no.spineEnable();
     * if (isEnabled) {
     *     console.log('Spine动画已启用');
     * }
     */
    export function spineEnable(): boolean {
        return _isSpineEnable;
    }

    /**
     * 设置是否启用Spine动画
     * @param v 是否启用Spine动画
     * @example
     * // 启用Spine动画
     * no.setSpineEnable(true);
     * // 禁用Spine动画（可用于性能优化）
     * no.setSpineEnable(false);
     * // 根据条件动态切换
     * no.setSpineEnable(device.platform !== 'MOBILE');
     */
    export function setSpineEnable(v: boolean) {
        _isSpineEnable = v;
    }

    /**
     * 是否支持多点触摸
     * @param v 非空时修改当前全局多点触摸状态，否则仅返回当前全局多点触摸状态
     * @returns 
     */
    export function multiTouch(v?: boolean): boolean {
        if (v !== undefined) macro.ENABLE_MULTI_TOUCH = v;
        return macro.ENABLE_MULTI_TOUCH;
    }

    let _uuidCount = 0;
    /**
     * 创建唯一标识
     * @param obj 
     * @returns 
     */
    export function uuid(obj?: any): string {
        if (obj && obj['_uuid']) return obj['_uuid'];
        // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        //     var r = floor(random() * 16),
        //         v = c == 'x' ? r : (r & 0x3 | 0x8);
        //     return v.toString(16);
        // });
        return `${++_uuidCount}`;
    }

    const _scheduler: Scheduler = director.getScheduler();
    type _schedulerTargetCallbackType = { target: any, cb: (dt?: number) => void, callback: (dt: number) => void, repeat?: number, endCall?: () => void };
    const _schedulerTargetCallbackMap: { [uuid: string]: _schedulerTargetCallbackType[] } = {};

    function getTargetCallback(uuid: string, cb: (dt?: number) => void): _schedulerTargetCallbackType {
        const arr: _schedulerTargetCallbackType[] = _schedulerTargetCallbackMap[uuid];
        if (arr) {
            return itemOfArray<_schedulerTargetCallbackType>(arr, cb, 'cb');
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
            const i = indexOfArray(arr, cb, 'cb');
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
        if (target && target._uuid == undefined) target._uuid = uuid();
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
            else if (checkValid(a.target)) {
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
        if (target && target._uuid == undefined) target._uuid = uuid();
        const _uuid = target._uuid;
        unschedule(_uuid, cb);

        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, cb);
            if (!a.target)
                cb?.(dt);
            else if (checkValid(a.target)) {
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
        if (target && target._uuid == undefined) target._uuid = uuid();
        let _uuid = target._uuid;

        unschedule(_uuid, check);

        if (maxTry == null) maxTry = macro.REPEAT_FOREVER;
        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, check);
            if (!checkValid(a.target)) {
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
        if (target && target._uuid == undefined) target._uuid = uuid();
        const _uuid = target._uuid;

        unschedule(_uuid, cb);

        let callback = (dt: number) => {
            const a = getTargetCallback(_uuid, cb);
            if ((a.target && !checkValid(a.target)) || until.call(a.target)) {
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
        if (target._uuid == undefined) target._uuid = uuid();
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
        const a = target || { uuid: uuid() };
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
        const a = target || { uuid: uuid() };
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
     * 事件系统
     */
    class Event {
        private _map: Map<string, any[]>;

        constructor() {
            this._map = new Map();
        }

        /**
         * 监听事件
         * @param type 
         * @param handler 
         * @param target 
         * @param onlyone 是否独占，为true时为先执行typeOff，默认false
         */
        public on(type: string, handler: Function, target?: any, onlyone = false): void {
            if (onlyone) this.typeOff(type);
            let a: { h: Function, t: any, o: boolean }[] = this._map.get(type) || [];
            a[a.length] = {
                h: handler,
                t: target,
                o: false
            };
            this._map.set(type, a);
        }
        /**
         * 注册一次性事件监听（触发后自动移除）
         * @param type 事件类型 
         * @param handler 事件处理函数
         * @param target 事件目标对象
         * @example
         * // 监听游戏结束事件（仅触发一次）
         * no.evn.once('game_over', (score) => {
         *     console.log(`最终得分: ${score}`);
         * }, this);
         */
        public once(type: string, handler: Function, target?: any): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map.get(type) || [];
            a[a.length] = {
                h: handler,
                t: target,
                o: true
            };
            this._map.set(type, a);
        }

        /**
         * 移除指定类型的事件监听
         * @param type 事件类型
         * @param handler 要移除的处理函数
         * @param target 要移除的目标对象
         * @example
         * // 移除特定伤害事件监听
         * no.evn.off('player_hurt', this.onHurt, this);
         */
        public off(type: string, handler: Function, target?: any): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map.get(type) || [];
            if (!a) return;
            for (let i = 0, n = a.length; i < n; i++) {
                let b = a[i];
                if (b.h == handler && b.t == target) {
                    a.splice(i, 1);
                    break;
                }
            }
            this._map.set(type, a);
        }

        /**
         * 移除指定目标的所有事件监听
         * @param target 要移除的目标对象
         * @example
         * // 当UI面板关闭时移除所有相关监听
         * no.evn.targetOff(this.uiPanel);
         */
        public targetOff(target: any): void {
            for (let type of this._map.keys()) {
                let a: { h: Function, t: any, o: boolean }[] = this._map.get(type) || [];
                if (!a) continue;
                for (let i = a.length - 1; i >= 0; i--) {
                    let b = a[i];
                    if (b.t == target) {
                        a.splice(i, 1);
                    }
                }
                if (a.length == 0) this._map.delete(type);
                else this._map.set(type, a);
            }
        }

        /**
         * 移除指定类型的所有事件监听
         * @param type 事件类型
         * @example
         * // 清除所有网络错误监听
         * no.evn.typeOff('network_error');
         */
        public typeOff(type: string): void {
            this._map.delete(type);
        }

        /**
         * 触发指定类型的事件
         * @param type 事件类型
         * @param args 事件参数（最后一个参数会自动追加事件类型）
         * @example
         * // 触发玩家移动事件并传递坐标
         * no.evn.emit('player_move', x, y, z);
         */
        public emit(type: string, ...args: any[]): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map.get(type) || [];
            if (!a.length) return;
            args = args || [];
            args[args.length] = type;

            for (let i = a.length - 1; i >= 0; i--) {
                let b = a[i];
                if (b.t && !checkValid(b.t)) {
                    a.splice(i, 1);
                }
            }

            if (DEBUG) {
                for (let i = a.length - 1; i >= 0; i--) {
                    const b = a[i];
                    try {
                        if (b.o) {
                            a.splice(i, 1);
                        }
                        b.h.apply(b.t, args);
                    } catch (e) { console.error(e); }
                }
            } else {
                for (let i = a.length - 1; i >= 0; i--) {
                    const b = a[i];
                    if (b.o) {
                        a.splice(i, 1);
                    }
                    b.h.apply(b.t, args);
                }
            }
            if (a.length == 0) this._map.delete(type);
            else this._map.set(type, a);
        }

        /**
         * 检查是否存在指定类型的事件监听
         * @param type 事件类型
         * @returns 是否存在监听
         * @example
         * // 检查是否有成就解锁监听
         * if (no.evn.hasType('achievement_unlock')) {
         *     // 存在成就系统相关监听
         * }
         */
        public hasType(type: string): boolean {
            let a: any[] = this._map.get(type) || [];
            return a && a.length > 0;
        }

        /**
         * 在事件触发后移除指定监听（标记移除）
         * @param type 事件类型
         * @param target 可选目标对象（不传则移除该类型所有监听）
         * @example
         * // 标记移除新手引导完成监听
         * no.evn.offAfterTrigger('tutorial_complete', this);
         */
        public offAfterTrigger(type: string, target?: any): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map.get(type) || [];
            if (!a) return;
            for (let i = 0, n = a.length; i < n; i++) {
                const b = a[i];
                if (target) {
                    if (b.t == target) b.o = true;
                } else b.o = true;
            }
        }

        public isEmpty(): boolean {
            return this._map.size == 0;
        }

        /**
         * 清空所有事件监听
         * @example
         * // 游戏重置时清空所有事件
         * no.evn.clear();
         */
        public clear() {
            this._map.clear();
        }

        /**
         * 创建新的事件系统实例
         * @returns 新的事件系统实例
         * @example
         * // 为小游戏创建独立的事件系统
         * const miniGameEvents = no.evn.new();
         */
        public new() {
            return new Event();
        }
    }
    /**
    * 消息系统
    */
    export const evn = new Event();

    /**
     * 状态系统
     */
    export class State {
        private _states: any;
        private _watchers: any;

        constructor() {
            this._states = {};
            this._watchers = {};
        }

        /**
         * 设置状态值并记录时间戳
         * @param type 状态类型标识 
         * @param value 要设置的状态值
         * @example
         * // 设置玩家生命值状态
         * no.state.set('player_health', 100);
         * // 标记关卡完成状态
         * no.state.set('level_completed', true);
         */
        public set(type: string, value?: any): void {
            this._states[type] = { v: value, t: sys.now() };
        }

        /**
         * 注册状态监听（自动生成目标UUID）
         * @param type 要监听的状态类型
         * @param target 监听目标对象（需保持引用）
         * @example
         * // 监听玩家升级事件
         * no.state.on('player_level_up', this);
         */
        public on(type: string, target: any) {
            if (!target._uuid) target._uuid = uuid();
            this._watchers[type] = this._watchers[type] || {};
            this._watchers[type][target._uuid] = sys.now();
        }

        /**
         * 移除状态监听
         * @param type 要移除的状态类型 
         * @param target 要移除的监听目标
         * @example
         * // 当对象销毁时移除监听
         * no.state.off('player_level_up', this);
         */
        public off(type: string, target: any) {
            if (!target._uuid) return;
            if (this._watchers[type])
                delete this._watchers[type][target._uuid];
        }

        /**
         * 清除指定类型的状态和监听
         * @param type 要清除的状态类型
         * @example
         * // 重置任务状态
         * no.state.clear('quest_progress');
         */
        public clear(type: string) {
            delete this._states[type];
            delete this._watchers[type];
        }

        /**
         * 清空所有状态和监听
         * @example
         * // 游戏重置时清空所有状态
         * no.state.clearAll();
         */
        public clearAll(): void {
            this._states = {};
            this._watchers = {};
        }

        /**
         * 检查状态更新（带自动标记已读功能）
         * @param type 要检查的状态类型
         * @param target 检查目标对象
         * @returns 包含状态是否更新和值的对象
         * @example
         * // 检查资源加载状态
         * const resStatus = no.state.check('assets_loaded', this);
         * if (resStatus.state) {
         *     console.log('加载进度:', resStatus.value);
         * }
         */
        public check(type: string, target: any): { state: boolean, value?: any } {
            let c = { state: false, value: null };
            let b: { v: any, t: number } = this._states[type];
            if (!b) return c;
            if (!target._uuid) target._uuid = uuid();
            let a = this._watchers[type];
            if (!a) {
                this._watchers[type] = {};
            } else if (a[target._uuid] == b.t) return c;
            this._watchers[type][target._uuid] = b.t;
            c.state = true;
            c.value = b.v;
            return c;
        }

        /**
         * 异步等待状态变为true
         * @param type 要等待的状态类型
         * @param target 目标对象
         * @returns Promise对象，解析时返回状态值
         * @example
         * // 等待数据加载完成
         * async function init() {
         *     const data = await no.state.checkTrue('data_loaded', this);
         *     initUI(data);
         * }
         */
        public async checkTrue(type: string, target: any): Promise<any> {
            if (!target?.isValid) return null;
            let a = this.check(type, target);
            if (a.state) return a.value;
            await sleep(0, target);
            return this.checkTrue(type, target);
        }

    }
    /**
    * 状态系统
    */
    export const state = new State();

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

        /**
         * 获取当前时区时间（秒级，基于本地时区）
         * @returns 当前时区时间戳（秒）
         * @example
         * // 显示本地时间
         * const localSeconds = no.sysTime.locationTimeZoneNow;
         * console.log(`当前本地时间：${new Date(localSeconds * 1000)}`);
         */
        public get locationTimeZoneNow(): number {
            return no.localDateSeconds(this._time);
        }

        constructor() {
            // 初始化系统时间（转换为秒）
            let t = floor(sys.now() / 1000);
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
            addToArray(this._targets, target, this._IdKey);
        }

        /**
         * 取消注册每秒回调
         * @param target 需要移除的时间监听对象
         * @example
         * // 当对象销毁时取消时间监听
         * no.sysTime.offTickTock(timer);
         */
        public offTickTock(target: any): void {
            removeFromArray(this._targets, target, this._IdKey);
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
                    log(e);
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

    /**事件处理类 */
    @ccclass('EventHandlerInfo')
    export class EventHandlerInfo {
        @property(EventHandler)
        handler: EventHandler = new EventHandler();

        /**
         * 创建运行时事件处理器配置
         * @param target 目标节点
         * @param comp 组件类名
         * @param handler 处理方法名
         * @returns 事件处理器配置对象
         * @example
         * // 创建按钮点击处理器
         * const btnHandler = EventHandlerInfo.new(
         *     this.buttonNode, 
         *     'Button', 
         *     'onClick'
         * );
         */
        public static new(target: Node, comp: string, handler: string): EventHandlerInfo {
            let a = new EventHandlerInfo();
            a.handler.target = target;
            a.handler.component = comp;
            a.handler.handler = handler;
            return a;
        }

        /**
         * 创建编辑器环境下的事件处理器配置
         * @param target 目标节点
         * @param compId 编辑器组件ID
         * @param handler 处理方法名
         * @returns 事件处理器配置对象
         * @example
         * // 在编辑器工具中创建处理器
         * const editorHandler = EventHandlerInfo.newInEditor(
         *     this.node,
         *     '3f4r5-6tg7',
         *     'onCustomEvent'
         * );
         */
        public static newInEditor(target: Node, compId: string, handler: string): EventHandlerInfo {
            let a = new EventHandlerInfo();
            a.handler.target = target;
            a.handler._componentId = compId;
            a.handler.handler = handler;
            return a;
        }

        /**
         * 批量执行事件处理器
         * @param handlers 处理器数组
         * @param args 传递给处理器的参数
         * @example
         * // 触发所有按钮点击处理器
         * EventHandlerInfo.execute(
         *     [btnHandler, editorHandler],
         *     { type: 'custom_click' }
         * );
         */
        public static execute(handlers: EventHandlerInfo[], ...args: any[]): void {
            if (!handlers || handlers.length == 0) return;
            for (let i = 0; i < handlers.length; i++) {
                const handler = handlers[i];
                handler?.execute.apply(handler, args);
            }
        }

        /**
         * 执行当前事件处理器
         * @param args 传递给处理器的参数
         * @example
         * // 在自定义组件中触发事件
         * this.eventHandler.execute(
         *     { data: this.itemData },
         *     v2(100, 200)
         * );
         */
        public execute(...args: any[]): void {
            if (isValid(this.handler?.target, true)) {
                if (this.handler._componentName == '' || this.handler.handler == '') {
                    console.error('EventHandlerInfo componentName or handler is empty', this.handler.target.name, this.handler._componentName, this.handler.handler);
                } else
                    this.handler.emit(args);
            }
        }
    }

    /**
     * 带标记的日志输出（受全局日志开关控制）
     * @param Evns 要输出的任意类型参数（支持多参数）
     * @example
     * // 记录玩家位置和状态
     * no.log('玩家坐标', player.position, '当前状态:', player.state);
     * // 调试物品拾取逻辑
     * no.log('拾取物品:', itemId, '剩余背包空间:', backpack.space);
     */
    export function log(...Evns: any[]): void {
        (_isLogEnabled || (JSB && window?.['DBT']?.Console?.['enabled'])) && console.log.call(console, '#NoUi#Log', jsonStringify(Evns));
    }

    /**
     * 带标记的警告输出（受全局日志开关控制）
     * @param Evns 要输出的警告内容（支持多参数）
     * @example
     * // 资源加载失败警告
     * no.warn('未找到角色贴图:', texturePath);
     * // 非法状态警告
     * no.warn('玩家处于异常状态:', currentState, '位置:', player.position);
     */
    export function warn(...Evns: any[]): void {
        (_isLogEnabled || (JSB && window?.['DBT']?.Console?.['enabled'])) && console.warn('#NoUi#Warn', Evns);
    }

    /**
     * 带标记的错误输出（始终输出到控制台）
     * @param Evns 要输出的错误内容（支持多参数）
     * @example
     * // 关键数据缺失错误
     * no.err('未找到玩家基础数据:', playerId);
     * // 网络请求失败记录
     * no.err('API请求超时:', url, '参数:', reqParams);
     */
    export function err(...Evns: any[]): void {
        console.error('#NoUi#这不是报错', Evns);
    }

    /**
     * 启动性能计时器（需与logTimeEnd配对使用）
     * @param type 计时器标识类型（可选）
     * @example
     * // 测量资源加载耗时
     * no.logTimeStart('load_textures');
     * // 测试战斗逻辑性能
     * no.logTimeStart('battle_calculation');
     */
    export function logTimeStart(type?: string) {
        (_isLogEnabled || (JSB && window?.['DBT']?.Console?.['enabled'])) && console.time(`#NoUi#time-${type ? type : ''}`);
    }

    /**
     * 结束性能计时器并输出结果
     * @param type 计时器标识类型（需与logTimeStart对应）
     * @example
     * // 结束资源加载计时
     * no.logTimeEnd('load_textures'); // 控制台输出: #NoUi#time-load_textures: 0.25ms
     * // 结束战斗逻辑计时
     * no.logTimeEnd('battle_calculation');
     */
    export function logTimeEnd(type?: string) {
        (_isLogEnabled || (JSB && window?.['DBT']?.Console?.['enabled'])) && console.timeEnd(`#NoUi#time-${type ? type : ''}`);
    }


    /**
     * 触发事件并注册一次性回调
     * @param emitType 要触发的事件类型
     * @param callbackType 要监听的回调事件类型
     * @param callback 回调函数
     * @param args 事件参数（可选）
     * @param target 目标对象（可选）
     * @example
     * // 发送登录请求后等待服务器响应
     * no.emitAndOnceCallback(
     *   'login_request', 
     *   'login_response',
     *   (response) => {
     *     if(response.success) showMainUI();
     *   },
     *   [{username: 'test', password: '123'}]
     * );
     */
    export function emitAndOnceCallback(emitType: string, callbackType: string, callback: (v: any) => void, args?: any[], target?: any): void {
        if (!evn.hasType(emitType)) {
            callback(null);
        } else {
            evn.once(callbackType, callback, target);
            evn.emit(emitType, args);
        }
    }

    /**
     * 异步版触发事件并等待回调（返回Promise）
     * @param emitType 要触发的事件类型
     * @param callbackType 要监听的回调事件类型 
     * @param args 事件参数（可选）
     * @param target 目标对象（可选）
     * @returns Promise对象，解析时返回回调值
     * @example
     * // 异步加载资源并等待完成
     * async function loadCharacter() {
     *   const data = await no.emitAndOnceCallbackAsync(
     *     'load_character_assets',
     *     'assets_loaded',
     *     [characterId]
     *   );
     *   initCharacter(data);
     * }
     */
    export function emitAndOnceCallbackAsync(emitType: string, callbackType: string, args?: any[], target?: any): Promise<any> {
        return new Promise<any>(resolve => {
            emitAndOnceCallback(emitType, callbackType, resolve, args, target);
        }).catch(e => {
            console.error(e);
            return null;
        });
    }

    /**
     * 等待事件触发（返回Promise）
     * @param type 要等待的事件类型
     * @param target 目标对象（可选）
     * @param arg 标识值，当事件触发时会将这个值返回（可选）
     * @returns Promise对象，解析时返回传入的标识值
     * @example
     * // 等待网络连接成功
     * async function initNetwork() {
     *   await no.waitForEvent('network_connected');
     *   startSyncData();
     * }
     * 
     * // 带标识值的等待
     * const result = await no.waitForEvent('user_confirm', this, 'confirmed');
     * console.log(result); // 输出: 'confirmed'
     */
    export function waitForEvent(type: string, target?: any, arg?: any): Promise<any> {
        return new Promise<any>(resolve => {
            evn.once(type, (v: any) => {
                if (v == '__clear_Wait_For_Event__') resolve(null);
                else resolve(arg);
            }, target);
        }).catch(e => {
            console.error(e);
            return null;
        });
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
            return checkUntil(express);
    }

    /**
     * 等待事件触发并获取事件值（返回Promise）
     * @param type 事件类型
     * @param target 可选目标对象
     * @returns Promise对象，解析时返回事件携带的值
     * @example
     * // 等待资源加载完成事件并获取加载结果
     * async function loadData() {
     *   const result = await no.waiForEventValue('data_loaded');
     *   console.log('加载结果:', result);
     * }
     * 
     * // 带目标对象的等待
     * const userData = await no.waiForEventValue('user_info_updated', this.userComponent);
     */
    export function waitForEventValue(type: string, target?: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            evn.once(type, (v: any) => {
                if (v == '__clear_Wait_For_Event__') reject(null);
                else resolve(v);
            }, target);
        }).catch(e => {
            console.error(e);
            return null;
        });
    }

    /**
     * 等待事件返回值与预期值相等
     * @param type 事件类型
     * @param equalValue 预期匹配的值
     * @param target 可选目标对象
     * @returns Promise对象，当值匹配时解析
     * @example
     * // 等待登录状态变为成功
     * await no.waiForEventValueEqual('login_status', 'success');
     * 
     * // 带目标对象的条件等待
     * await no.waiForEventValueEqual('item_purchased', 123, this.storeComponent);
     */
    export function waiForEventValueEqual(type: string, equalValue: any, target?: any): Promise<void> {
        let e = evn;
        return new Promise<void>((resolve, reject) => {
            e.on(type, (v: any) => {
                if (v == '__clear_Wait_For_Event__') resolve();
                else {
                    log('waiForEventValueEqual', type, v);
                    if (v == equalValue) {
                        e.offAfterTrigger(type, target);
                        resolve();
                    }
                }
            }, target);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 取消指定类型事件的等待
     * @param type 要取消的事件类型
     * @example
     * // 取消所有网络超时等待
     * no.clearWaitForEvent('network_timeout');
     * 
     * // 在场景切换时取消相关等待
     * onSceneChange() {
     *   no.clearWaitForEvent('scene_loading');
     * }
     */
    export function clearWaitForEvent(type: string) {
        evn.emit(type, '__clear_Wait_For_Event__');
        evn.typeOff(type);
    }

    /**
     * 持续检查条件直到满足（使用requestAnimationFrame优化性能）
     * @param express 条件判断函数
     * @returns Promise对象，当条件满足时解析
     * @example
     * // 等待资源加载完成
     * await no.checkUntil(() => resourcesLoaded);
     * 
     * // 等待界面元素可见
     * await no.checkUntil(() => this.uiElement.active);
     */
    export async function checkUntil(express: () => boolean) {
        // 先检查一次,避免不必要的定时器
        if (express()) {
            return;
        }
        return new Promise<void>(resolve => {
            // 使用 requestAnimationFrame 代替 setInterval,性能更好
            const check = () => {
                if (express()) {
                    resolve();
                    return;
                }
                requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 根据模板格式化字符串
     * @param formatter 模板字符串，支持 {key} 和 {0} 格式的占位符
     * @param data 替换数据，可以是对象或数组
     * @returns 格式化后的字符串
     * @example
     * // 对象参数示例
     * formatString('玩家:{name} 等级:{level}', {name: '张三', level: 99}); // 返回 "玩家:张三 等级:99"
     * // 数组参数示例
     * formatString('坐标:{0},{1}', [120, 240]); // 返回 "坐标:120,240"
     */
    export function formatString(formatter: string, data: any[] | object): string {
        if (data == null) return '';
        let s = String(formatter);
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i];
            s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), data[k]);
        }
        return s;
    }

    /**
     * 格式化字符串后执行求值运算
     * @param formatter 可包含变量的表达式模板
     * @param data 替换数据对象
     * @returns 表达式计算结果
     * @example
     * // 计算玩家属性
     * evalFormateStr('{atk} * {critMultiplier}', {atk: 100, critMultiplier: 2.5}); // 返回 250
     * @warning 注意eval的安全风险，请勿用于不可信输入
     */
    export function evalFormateStr(formatter: string, data: any) {
        let str = formatString(formatter, data);
        return eval(str);
    }

    /**
     * JSON对象深拷贝
     * @param json 需要拷贝的JSON对象
     * @returns 深拷贝后的新对象
     * @example
     * const original = { a: 1, b: { c: 2 } };
     * const cloned = cloneJson(original);
     * cloned.b.c = 3;
     * console.log(original.b.c); // 仍然输出2
     */
    export function cloneJson(json: any): any {
        return parse2Json(jsonStringify(json));
    }

    /**
     * 十六进制颜色转RGB对象
     * @param hex 十六进制颜色字符串，支持 # 开头或省略
     * @returns 包含r,g,b属性的对象（值范围0-255），无效格式返回null
     * @example
     * hex2Rgb('#ff0000');    // 返回 {r: 255, g: 0, b: 0}
     * hex2Rgb('00ff00');     // 返回 {r: 0, g: 255, b: 0}
     * hex2Rgb('invalid');    // 返回 null
     */
    export function hex2Rgb(hex: string) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * 字符串转Color对象
     * @param v 颜色字符串，支持十六进制格式（#RGB或#RRGGBB）
     * @returns 对应的Color对象
     * @example
     * str2Color('#ff0000');  // 返回红色
     * str2Color('#0f0');     // 返回绿色
     * str2Color('0000ff');   // 返回蓝色
     */
    export function str2Color(v: string): Color {
        let c = color();
        Color.fromHEX(c, v);
        return c;
    }

    /**
     * 将数字转换为带单位的字符串
     * @param n 要转换的数字
     * @param units 单位数组（按单位从小到大排列，如[ 'K', 'M', 'B']）
     * @param unitLen 每个单位对应的数字长度（如3表示每3位换一个单位）
     * @param digits 小数保留位数（默认2）
     * @example num2strWithUnit(123456, ['K', 'M', 'B'], 3) -> "123.45K"
     * num2strWithUnit(123456, ['万', '亿'], 4) -> "12.34万"
     */
    export function num2strWithUnit(n: number, units: string[], unitLen: number, digits: number = 2): string {
        // 处理空值情况
        if (n == null) return '';

        // 将数字转换为字符串并获取长度
        const s = String(n);
        const len = s.length;
        const ul = unitLen;
        // 如果数字长度小于等于单位长度，直接返回原数字字符串
        if (len <= ul) return String(n);

        // 计算单位层级和余数
        // 例：数字长度5位，单位长度3位时，level=1（对应千位单位），remainder=2
        const level = Math.floor(len / ul);
        const remainder = len % unitLen;

        // 计算格式化数值（保留两位小数）：
        // 1. 确定需要截断的位数 = 单位层级对应的总位数 - 余数处理偏移 - 小数保留位数
        // 2. 截断后除以100得到小数保留位数的小数
        // 例：n=12345（5位），unitLen=3，level=1，remainder=2
        //    截断位数 = 1*3 - (remainder?0:unitLen) -2 = 3 -0 -2 =1 → 10^1=10
        //    n/10=1234.5 → floor=1234 → 1234/100=12.34
        const digitsToCut = level * unitLen - (remainder === 0 ? unitLen : 0) - digits;
        const a = Math.floor(n / Math.pow(10, digitsToCut)) / Math.pow(10, digits);

        // 计算单位索引：
        // 1. 基础索引 = 总单位层级 - 1（数组从0开始）
        // 2. 余数为0时需要再减1（处理整除数情况）
        // 例：数字长度4位，unitLen=3 → level=1，remainder=1 → 索引 1-1=0（对应第一个单位）
        //    数字长度6位，unitLen=3 → level=2，remainder=0 → 索引 2-1-1=0（对应第二个单位需要减1）
        const unitIndex = level - 1 - (remainder === 0 ? 1 : 0);
        return a + units[unitIndex];
    }

    /**
     * 大数字缩写格式化
     * @param n 需要格式化的数字
     * @returns 格式化后的字符串（最多保留1位小数）
     * @example
     * num2str(2500);     // 返回 "2.5K"
     * num2str(1350000);  // 返回 "1.3M"
     * num2str(999);      // 返回 "999"
     * num2str(1234567);  // 返回 "1.2B"
     */
    export function num2str(n: number): string {
        if (n == null) return '';
        if (n < 1000) return String(n);
        let unit = ['K', 'M', 'B'];
        let s = String(n);
        let len = s.length;
        let l = len % 3;

        // 计算显示数值部分
        let displayValue = '';
        if (l === 1) { // 处理类似 1,500 -> 1.5K
            displayValue = `${s[0]}.${s[1]}`;
        } else { // 处理类似 12,500 -> 12.5K 或 123,456 -> 123K
            displayValue = s.slice(0, l || 3);
            if (l === 0) displayValue = s.slice(0, 3);
        }

        // 计算单位索引
        const unitIndex = Math.floor(len / 3) - 1 - (l === 0 ? 1 : 0);
        return displayValue + unit[unitIndex];
    }

    /**
     * 从数组中随机抽取指定数量的元素
     * @param arr 源数组（支持任意类型元素）
     * @param n 需要抽取的元素数量（默认1，当n=1时返回单个元素，否则返回数组）
     * @param repeatable 是否允许重复抽取（默认false）
     * @param except 需要排除的元素数组（可选）
     * @returns 随机抽取的元素或元素数组
     * @example
     * // 基本用法：从数字数组中随机1个
     * const num = no.arrayRandom([1,2,3,4,5]);
     * 
     * // 抽取3个不重复的字母
     * const letters = no.arrayRandom(['a','b','c','d','e'], 3);
     * 
     * // 排除特定元素后抽取
     * const colors = no.arrayRandom(['red','green','blue','yellow'], 2, false, ['red']);
     * 
     * // 允许重复抽取（可能得到相同元素）
     * const roles = no.arrayRandom(['战士','法师','牧师'], 5, true);
     * 
     * // 处理空数组情况
     * const empty = no.arrayRandom([]); // 返回null
     */
    export function arrayRandom(arr: any[], num = 1, repeatable = false, except?: any[], needArr = false): any {
        if (!arr || arr.length == 0) return [];
        if (arr.length == 1) return needArr ? arr : arr[0];
        let a: any[] = [];
        if (except) {
            a = [];
            for (let i = 0, n = arr.length; i < n; i++) {
                let has = false;
                for (let j = 0, m = except.length; j < m; j++) {
                    if (arr[i] === except[j]) {
                        has = true;
                        break;
                    }
                }
                if (!has) {
                    a[a.length] = arr[i];
                }
            }
        } else {
            a = arr.slice();
        }
        let c = [];
        for (var i = 0; i < num; i++) {
            let al = a.length;
            if (al == 0) break;
            let b = floor(random() * al);
            if (!repeatable)
                c = [].concat(c, a.splice(b, 1));
            else
                c = [].concat(c, a[b]);
        }
        return needArr ? c : num == 1 ? c[0] : c;
    }

    /**
     * 从对象中获取嵌套属性值
     * @param data 源数据对象
     * @param path 属性路径（使用点号分隔），例如'a.b.c'
     * @returns 获取到的属性值，路径不存在时返回null
     * @example
     * // 获取嵌套属性
     * const user = { profile: { name: '张三', address: { city: '北京' } } };
     * no.getValue(user, 'profile.address.city'); // 返回 '北京'
     * 
     * // 路径不存在的情况
     * no.getValue(user, 'profile.age'); // 返回 null
     * 
     * // 不传path返回整个对象
     * no.getValue(user); // 返回user对象本身
     */
    export function getValue(data: Object, path?: string): any {
        if (!path) {
            return data;
        }
        let p = path.split('.');
        let o = data;
        let max = p.length;
        for (let index = 0; index < max; index++) {
            let k = p[index];
            if (o[k] == null) return null;
            o = o[k];
        }
        return o;
    }

    /**
     * 使用数组路径获取嵌套属性值
     * @param data 源数据对象
     * @param path 属性路径数组，例如['a','b','c']
     * @param def 当路径不存在时返回的默认值
     * @returns 获取到的属性值或默认值
     * @example
     * // 使用数组路径获取值
     * const config = { db: { mysql: { port: 3306 } } };
     * no.getValuePath(config, ['db','mysql','port'], 8080); // 返回 3306
     * 
     * // 路径不存在时返回默认值
     * no.getValuePath(config, ['db','redis','port'], 6379); // 返回 6379
     */
    export function getValuePath(data: Object, path: any[], def?: any): any {
        let k = path.join('.');
        return getValue(data, k) || def
    }

    /**
     * 设置对象的嵌套属性值（自动创建中间对象）
     * @param data 目标对象
     * @param path 属性路径（使用点号分隔），例如'a.b.c'
     * @param value 要设置的值
     * @example
     * // 设置深层属性
     * const obj = {};
     * no.setValue(obj, 'a.b.c', 10);
     * console.log(obj.a.b.c); // 输出 10
     * 
     * // 覆盖现有值
     * no.setValue(obj, 'a.b', { d: 20 });
     * console.log(obj.a.b.d); // 输出 20
     */
    export function setValue(data: Object, path: string, value: any): void {
        let p = path.split('.');
        let o = data;
        let max = p.length;
        for (let index = 0; index < max; index++) {
            let k = p[index];
            if (o[k] == null) {
                if (index < max - 1) {
                    o[k] = new Object();
                    o = o[k];
                } else {
                    o[k] = value;
                }
            } else if (index < max - 1) {
                if (typeof o[k] != 'object')
                    o[k] = {};
                o = o[k];
            } else {
                o[k] = value;
            }
        }
    }

    /**
     * 使用数组路径设置嵌套属性值
     * @param data 目标对象
     * @param path 属性路径数组，例如['a','b','c']
     * @param value 要设置的值
     * @example
     * // 动态路径设置
     * const settings = {};
     * const path = ['server', 'ports', 'http'];
     * no.setValuePath(settings, path, 80);
     * console.log(settings.server.ports.http); // 输出 80
     */
    export function setValuePath(data: Object, path: any[], value: any): void {
        let k = path.join('.');
        setValue(data, k, value)
    }

    /**
     * 删除对象的嵌套属性
     * @param data 目标对象
     * @param path 属性路径（使用点号分隔），例如'a.b.c'
     * @returns 被删除的属性值，路径不存在时返回null
     * @example
     * // 删除属性
     * const data = { user: { id: 1, temp: 'value' } };
     * const deleted = no.deleteValue(data, 'user.temp');
     * console.log(deleted); // 输出 'value'
     * console.log('temp' in data.user); // 输出 false
     * 
     * // 删除不存在的路径
     * no.deleteValue(data, 'user.age'); // 返回 null
     */
    export function deleteValue(data: Object, path: string): any {
        let p = path.split('.');
        let o = data;
        let max = p.length;
        for (let index = 0; index < max; index++) {
            let k = p[index];
            if (o[k] == null) {
                return null;
            } else if (index < max - 1) {
                o = o[k];
            } else {
                let a = o[k];
                delete o[k];
                return a;
            }
        }
    }

    /**
     * 连接多个字符串并过滤空值
     * @param separator 连接分隔符
     * @param strs 要连接的字符串数组（支持null/undefined过滤）
     * @returns 拼接后的字符串
     * @example
     * // 拼接文件路径
     * const path = no.joinStrings('/', 'usr', 'local', 'bin'); // 返回 "usr/local/bin"
     * // 拼接API参数
     * const params = no.joinStrings('&', 'name=John', null, 'age=25'); // 返回 "name=John&age=25"
     */
    export function joinStrings(separator: string, ...strs: string[]): string {
        let a: string[] = [];
        for (let i = 0, n = strs.length; i < n; i++) {
            const str = strs[i];
            if (str != null && str != '') {
                a[a.length] = str;
            }
        }
        return a.join(separator);
    }

    /**
     * 使用点号连接多个字符串
     * @param strs 要连接的字符串数组
     * @returns 拼接后的字符串
     * @example
     * // 组合API版本号
     * const version = no.join('1', '0', '3'); // 返回 "1.0.3"
     * // 创建命名空间
     * const namespace = no.join('game', 'utils', 'math'); // 返回 "game.utils.math"
     */
    export function join(...strs: string[]): string {
        return joinStrings('.', ...strs);
    }

    export function toArray(v: any) {
        if (!v) return [];
        if (v instanceof Array) return v;
        let t = [].concat(v);
        return t;
    }

    /**
     * 将一维数组分割为二维数组
     * @param array 原始数组
     * @param num 每个子数组的最大长度
     * @returns 二维数组
     * @example
     * // 分页处理数据
     * const data = [1,2,3,4,5];
     * const paged = no.arrayToArrays(data, 2); // 返回 [[1,2],[3,4],[5]]
     * // 矩阵转换
     * const matrix = no.arrayToArrays([1,2,3,4,5,6], 3); // 返回 [[1,2,3],[4,5,6]]
     */
    export function arrayToArrays(array: any[], num: number): any[] {
        if (!array) return [];
        if (!num) return array;
        var dd = [];
        let length = ceil(array.length / num);
        for (var ii = 0; ii < length; ii++) {
            dd[ii] = [];
            for (var jj = 0; jj < num; jj++) {
                if (array[ii * num + jj] == undefined) continue;
                dd[ii][jj] = array[ii * num + jj];
            }
        }
        return dd;
    };

    /**
     * 在对象数组中查找元素索引
     * @param array 目标数组
     * @param item 要查找的元素（可以是对象或属性值）
     * @param key 用于比较的对象属性名
     * @returns 元素索引，未找到返回-1
     * @example
     * // 查找用户ID为3的索引
     * const users = [{id:1,name:'A'}, {id:2,name:'B'}, {id:3,name:'C'}];
     * const index = no.indexOfArray(users, 3, 'id'); // 返回2
     * // 查找完整对象
     * const target = {id:2,name:'B'};
     * const index2 = no.indexOfArray(users, target, 'id'); // 返回1
     */
    export function indexOfArray(array: any[], item: any, key: string): number {
        if (array == null || item == null) return -1;
        for (let i = 0, n = array.length; i < n; i++) {
            let a = array[i];
            if (a[key] == item || a[key] == item[key]) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 在对象数组中查找元素对象
     * @template T 返回类型
     * @param array 目标数组
     * @param value 要查找的值（可以是对象或属性值）
     * @param key 用于比较的对象属性名
     * @returns 找到的元素对象，未找到返回null
     * @example
     * // 查找用户ID为2的用户对象
     * const user = no.itemOfArray(users, 2, 'id'); // 返回 {id:2,name:'B'}
     * // 使用对象查找
     * const partialUser = {id:3};
     * const found = no.itemOfArray(users, partialUser, 'id'); // 返回 {id:3,name:'C'}
     */
    export function itemOfArray<T>(array: any[], value: any, key: string): T {
        if (array == null || value == null || key == null) return null as T;
        for (let i = 0, n = array.length; i < n; i++) {
            const a = array[i];
            if (!a) continue;
            if (a[key] == value || a[key] == value[key]) {
                return a as T;
            }
        }
        return null as T;
    }

    /**
     * 检查数组是否包含另一个数组的任意元素
     * @param array 主数组
     * @param other 要检查的数组
     * @returns 是否包含任意元素
     * @example
     * // 检查权限
     * const userRoles = ['admin', 'editor'];
     * const requiredRoles = ['viewer', 'editor'];
     * const hasAccess = no.isArrayIncludeOther(userRoles, requiredRoles); // 返回true
     */
    export function isArrayIncludeOther(array: any[], other: any[]): boolean {
        for (let i = 0, n = other.length; i < n; i++) {
            if (array.indexOf(other[i]) > -1) return true;
        }
        return false;
    }

    /**
     * 获取两个数组的交集
     * @param array 主数组
     * @param other 要比较的数组
     * @returns 包含共同元素的新数组
     * @example
     * // 获取共同好友
     * const myFriends = ['Alice', 'Bob', 'Charlie'];
     * const yourFriends = ['Bob', 'David', 'Eve'];
     * const common = no.arrayIncludeOther(myFriends, yourFriends); // 返回 ['Bob']
     */
    export function arrayIncludeOther(array: any[], other: any[]): any[] {
        let arr: any[] = [];
        for (let i = 0, n = other.length; i < n; i++) {
            if (array.indexOf(other[i]) > -1) arr[arr.length] = other[i];
        }
        return arr;
    }

    /**
     * 向数组添加元素（支持唯一性检查）
     * @param array 目标数组
     * @param value 要添加的值
     * @param key 唯一性检查的属性名（可选）
     * @returns 是否添加成功
     * @example
     * // 添加唯一用户
     * const users = [];
     * no.addToArray(users, {id:1,name:'A'}, 'id'); // 返回true
     * no.addToArray(users, {id:1,name:'B'}, 'id'); // 返回false
     * 
     * // 普通添加
     * const numbers = [1,2,3];
     * no.addToArray(numbers, 4); // 返回true
     */
    export function addToArray(array: any[], value: any, key?: string): boolean {
        if (!array) return false;
        if (key == null && array.indexOf(value) == -1) {
            array[array.length] = value;
            return true;
        } else if (key != null && indexOfArray(array, value, key) == -1) {
            array[array.length] = value;
            return true;
        }
        return false;
    }

    /**
     * 向数组末尾追加元素
     * @param array 目标数组
     * @param value 要添加的值
     * @example
     * // 记录日志
     * const log = [];
     * no.pushToArray(log, 'error1');
     * no.pushToArray(log, 'error2'); // log: ['error1', 'error2']
     */
    export function pushToArray(array: any[], value: any): void {
        if (!array) return;
        if (value == null) return;
        array[array.length] = value;
    }

    /**
     * 从数组中移除元素
     * @param array 目标数组
     * @param value 要移除的值（可以是对象或属性值）
     * @param key 对象属性名（可选）
     * @example
     * // 移除用户
     * const users = [{id:1}, {id:2}];
     * no.removeFromArray(users, 1, 'id'); // 移除id=1的用户
     * 
     * // 移除普通元素
     * const nums = [10,20,30];
     * no.removeFromArray(nums, 20); // nums变为[10,30]
     */
    export function removeFromArray(array: any[], value: any, key?: string): void {
        let i = -1;
        if (key == null) {
            i = array.indexOf(value);
        } else {
            i = indexOfArray(array, value, key);
        }
        if (i > -1) array.splice(i, 1);
        else {
            // console.log('removeFromArray fail', value);
        }
    }

    /**
     * 将Map的键转换为数组
     * @template K 键类型
     * @template T 值类型
     * @param map 源Map对象
     * @returns 键数组
     * @example
     * // 获取玩家ID列表
     * const players = new Map([[1, 'A'], [2, 'B']]);
     * const ids = no.MapKeys2Array(players); // 返回 [1,2]
     */
    export function MapKeys2Array<K, T>(map: Map<K, T>): K[] {
        let a: K[] = [];
        let keys = map.keys();
        let b = keys.next();
        while (!b.done) {
            a[a.length] = b.value;
            b = keys.next();
        }
        return a;
    }

    /**
     * 将Map的值转换为数组
     * @template K 键类型
     * @template T 值类型
     * @param map 源Map对象
     * @returns 值数组
     * @example
     * // 获取玩家得分列表
     * const scores = new Map([['A', 100], ['B', 200]]);
     * const values = no.MapValues2Array(scores); // 返回 [100,200]
     */
    export function MapValues2Array<K, T>(map: Map<K, T>): T[] {
        if (map == null || map.size == 0) return [];
        let a: T[] = [];
        let values = map.values();
        let b = values.next();
        while (!b.done) {
            a[a.length] = b.value;
            b = values.next();
        }
        return a;
    }

    /**
     * 将对象数组转换为键值对结构
     * @param array 源数组
     * @param keyType 作为键的属性名
     * @returns 键值对对象
     * @example
     * // 转换用户数据
     * const users = [{id:1,name:'A'}, {id:2,name:'B'}];
     * const userMap = no.arrayToKV(users, 'id');
     * // 结果: {1: {id:1,name:'A'}, 2: {id:2,name:'B'}}
     */
    export function arrayToKV(array: any[], keyType: string): any {
        let b: any = {};
        for (let i = 0, n = array.length; i < n; i++) {
            let a = array[i];
            b[a[keyType]] = a;
        }
        return b;
    }

    /**
     * 遍历键值对对象
     * @param d 要遍历的对象
     * @param func 遍历回调函数（返回true时终止遍历）
     * @example
     * // 遍历配置项
     * const config = {width:100, height:200};
     * no.forEachKV(config, (k,v) => {
     *     console.log(`${k}: ${v}`);
     * });
     * 
     * // 提前终止遍历
     * no.forEachKV(config, (k,v) => {
     *     if(k === 'height') return true; // 遇到height键时停止遍历
     * });
     */
    export function forEachKV(d: any, func: (k: any, v: any) => boolean) {
        if (d == null) return;
        for (const key in d) {
            if (func(key, d[key]) === true) break;
        }
    }

    const _angleToCache: { angle: number, radian: number } = { angle: 0, radian: 0 };
    /**
     * 计算两点之间的角度（以p1为圆心，从水平正X轴到p2的夹角）
     * @param p1 圆心/起点坐标（支持Vec2或Vec3类型）
     * @param p2 目标点坐标（支持Vec2或Vec3类型）
     * @returns 包含角度（0-360度）和弧度（-π~π）的对象
     * @example
     * // 计算玩家朝向敌人的角度
     * const playerPos = new Vec3(0, 0, 0);
     * const enemyPos = new Vec3(1, 1, 0);
     * const angleInfo = no.angleTo(playerPos, enemyPos);
     * console.log(`攻击角度：${angleInfo.angle}度`);
     * 
     * // 处理2D坐标
     * const from = new Vec2(0, 0);
     * const to = new Vec2(0, 1);
     * console.log(no.angleTo(from, to).radian); // 输出1.5708（π/2）
     */
    export function angleTo(p1: Vec2 | Vec3 | { x: number, y: number }, p2: Vec2 | Vec3 | { x: number, y: number }): { angle: number, radian: number } {
        if (p1 == null || p2 == null) {
            _angleToCache.angle = 0;
            _angleToCache.radian = 0;
            return _angleToCache;
        }
        const b = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        _angleToCache.angle = radianToAngle(b);
        _angleToCache.radian = b;
        return _angleToCache;
    }

    export const RAD_TO_DEG = 180 / Math.PI;
    /**
     * 将弧度转换为角度
     * @param radian 弧度
     * @returns 角度
     */
    export function radianToAngle(radian: number): number {
        const angle = radian * RAD_TO_DEG;
        return angle >= 0 ? angle : angle + 360;
    }

    const sinTable: number[] = [];
    const cosTable: number[] = [];
    const SinCosSize = 124;
    for (let i = 0; i <= SinCosSize; i++) {
        const angle = (i - 62) * 0.1;
        sinTable[i] = Math.sin(angle);
        cosTable[i] = Math.cos(angle);
    }
    export function fastSin(radian: number): number {
        radian = radian % (2 * Math.PI);
        const index = (radian * 10 + 62) | 0;
        return sinTable[index] || 0;
    }
    export function fastCos(radian: number): number {
        radian = radian % (2 * Math.PI);
        const index = (radian * 10 + 62) | 0;
        return cosTable[index] || 0;
    }
    /**
     * 将角度转换为弧度
     * @param angle 角度
     * @returns 弧度
     */
    export function angleToRadian(angle: number): number {
        if (angle > 180) angle -= 360;
        return angle / 180 * Math.PI;
    }

    /**
     * 计算两点之间的距离
     * @param p1 点1坐标
     * @param p2 点2坐标
     * @returns 距离
     * @example
     * // 计算玩家与目标点之间的距离
     * const playerPos = new Vec3(0, 0, 0);
     * const targetPos = new Vec3(1, 1, 0);
     * const distance = no.distance(playerPos, targetPos);
     */
    export function distance(p1: Vec2 | Vec3 | { x: number, y: number }, p2: Vec2 | Vec3 | { x: number, y: number }): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * 粗略判断两个点是否靠近
     * @param pos1 点1坐标
     * @param pos2 点2坐标
     * @param radius1 点1的检测半径
     * @param radius2 点2的检测半径
     * @returns 是否在范围内
     */
    export function isNear(pos1: { x: number, y: number }, pos2: { x: number, y: number }, radius1: number, radius2: number) {
        return !(pos2.x < pos1.x - radius1 - radius2
            || pos2.x > pos1.x + radius1 + radius2
            || pos2.y < pos1.y - radius1 - radius2
            || pos2.y > pos1.y + radius1 + radius2);
    }

    /**
     * 批量执行事件处理器
     * @param handlers 事件处理器数组
     * @param args 要传递给处理器的参数（会自动合并handler的customEventData）
     * @example
     * // 触发按钮点击事件
     * const handlers = [buttonClickHandler, achievementUnlockHandler];
     * no.executeHandlers(handlers, 'attack_button');
     * 
     * // 带自定义数据的事件处理
     * const damageHandlers = getDamageHandlers();
     * no.executeHandlers(damageHandlers, 100, 'fire_damage');
     */
    export function executeHandlers(handlers: EventHandler[], ...args: any[]): void {
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            handler.emit([].concat(args, handler.customEventData));
        }
    }

    /**
     * 将三维坐标转换为二维坐标（丢弃z轴）
     * @param v3 三维坐标对象
     * @returns 二维坐标对象
     * @example
     * // 在2D游戏中处理3D模型位置
     * const model3DPos = new Vec3(100, 200, 0);
     * const uiPos = no.vec3ToVec2(model3DPos);
     * this.uiWidget.node.position = uiPos;
     */
    export function vec3ToVec2(v3: Vec3): Vec2 {
        return new Vec2(v3.x, v3.y);
    }

    /**
     * 将二维坐标转换为三维坐标（z轴默认为0）
     * @param v2 二维坐标对象
     * @returns 三维坐标对象
     * @example
     * // 将UI坐标转换为3D世界坐标
     * const uiPos = new Vec2(300, 150);
     * const worldPos = no.vec2ToVec3(uiPos);
     * this.character.node.position = worldPos;
     * 
     * // 在2.5D游戏中使用
     * const mapCoord = new Vec2(5, 8);
     * const worldCoord = no.vec2ToVec3(mapCoord).addZ(10);
     */
    export function vec2ToVec3(v2: Vec2): Vec3 {
        return new Vec3(v2.x, v2.y);
    }

    /**
     * 创建事件处理器对象
     * @param target 事件目标节点
     * @param comp 组件类型（可以是组件类或组件名称字符串）
     * @param handler 要调用的处理方法名称
     * @param arg 自定义事件数据（会传递给处理方法的参数）
     * @returns 配置好的事件处理器对象
     * @example
     * // 创建按钮点击事件处理器
     * const btnHandler = no.createEventHandler(
     *   this.btnNode, 
     *   'ButtonComponent', 
     *   'onClick',
     *   { type: 'attack' }
     * );
     * 
     * // 使用组件类创建技能释放处理器
     * const skillHandler = no.createEventHandler(
     *   skillNode,
     *   SkillController,
     *   'castSkill',
     *   'fireball'
     * );
     */
    export function createEventHandler(target: Node, comp: string | typeof Component, handler: string, arg = ''): EventHandler {
        let a = new EventHandler();
        a.target = target;
        if (typeof comp == 'string')
            a._componentName = comp;
        else
            a._componentId = js._getClassId(comp);
        a.handler = handler;
        a.customEventData = arg;
        return a;
    }

    /**
     * 深拷贝对象/数组（支持结构化克隆和JSON序列化两种方式）
     * @param d 要克隆的数据（支持对象、数组和基本类型）
     * @returns 克隆后的新对象
     * @example
     * // 克隆配置对象
     * const originalConfig = { version: 1, features: ['a','b'] };
     * const clonedConfig = no.clone(originalConfig);
     * clonedConfig.version = 2;
     * console.log(originalConfig.version); // 仍为1
     * 
     * // 克隆数组
     * const arr = [1, { name: 'test' }];
     * const clonedArr = no.clone(arr);
     * clonedArr[1].name = 'modified';
     * console.log(arr[1].name); // 仍为'test'
     */
    export function clone(d: any): any {
        if (typeof d == 'object') {
            if (typeof structuredClone == "function") return structuredClone(d);
            else {
                let a = JSON.stringify(d);
                return JSON.parse(a);
            }
        }
        return d;
    }

    /**
     * 异步等待指定时间（使用setTimeout实现）
     * @param duration 等待时长（单位：秒）
     * @param component 已废弃参数（保留兼容性）
     * @returns Promise对象，在指定时间后resolve
     * @example
     * // 等待3秒后执行操作
     * async function delayAction() {
     *   await no.sleep(3);
     *   console.log('3秒后执行');
     * }
     * 
     * // 网络请求后最小等待
     * async function fetchData() {
     *   const response = await fetch('/api');
     *   await no.sleep(0.5); // 至少等待500ms避免闪烁
     *   showData(response);
     * }
     */
    export function sleep(duration: number, component?: Component): Promise<void> {
        if (duration <= 0) duration = game.deltaTime;
        return new Promise<void>(resolve => {
            setTimeout(() => { resolve(); }, duration * 1000);
        }).catch(e => {
            console.error(e);
        });
    }

    /**
     * 计算两个数值的百分比比例
     * @param min 当前值（分子）
     * @param max 最大值（分母）
     * @param maxNum 比例基数（如要转换为0-100的百分比则传100）
     * @returns 计算后的比例数值（向下取整）
     * @example
     * // 计算进度条比例（0-100）
     * const progress = no.twoNumPercentage2Num(25, 50, 100); // 50
     * 
     * // 计算血量显示比例（0-1）
     * const hpRatio = no.twoNumPercentage2Num(75, 150, 1); // 0
     * 
     * // 处理越界值
     * const safeValue = no.twoNumPercentage2Num(200, 100, 1000); // 1000
     */
    export function twoNumPercentage2Num(min: number, max: number, maxNum: number): number {
        if (min > max) {
            min = max;
        }
        return floor(min / max * maxNum);
    }

    /**
     * 获取指定范围内的随机值（支持整数/浮点数和排除值）
     * @param min 最小值（包含）
     * @param max 最大值（包含）
     * @param except 需要排除的数值数组 或 是否取整（默认true）
     * @returns 范围内的随机数值
     * @example
     * // 基础用法：生成1-6的随机整数（骰子）
     * const dice = no.randomBetween(1, 6);
     * 
     * // 生成0-1的随机浮点数
     * const precise = no.randomBetween(0, 1, false);
     * 
     * // 排除特定值：生成1-10但不包含5和7
     * const safeNum = no.randomBetween(1, 10, [5, 7]);
     * 
     * // 颜色通道生成：0-255整数且排除纯黑
     * const colorChannel = no.randomBetween(0, 255, [0,0,0]);
     * 
     * // 边界测试：当min等于max时
     * const fixed = no.randomBetween(100, 100); // 总是返回100
     */
    export function randomBetween(min: number, max: number, except?: number[]): number;
    export function randomBetween(min: number, max: number, isInt?: boolean): number;
    export function randomBetween(min: number, max: number, except?: number[] | boolean): number {
        if (min == max) return min;
        if (min == null || max == null) return min || max;
        let isInt = true;
        if (except === false) isInt = false;
        const a = random() * (max - min + 1);
        const b = (isInt ? floor(a) : a) + min;
        if (Array.isArray(except) && except.includes(b)) return randomBetween(min, max, except);
        return b;
    }

    /**
     * 将UTC时区时间戳转化为本地系统所在时区时间戳
     * @param utcSeconds UTC时间戳（秒）
     * @returns 本地时区时间戳（秒）
     * @example
     * // 将UTC时间转换为北京时间
     * const utcTime = 1620000000; // 2021-05-03T00:00:00Z
     * const localTime = no.localDateSeconds(utcTime); // 返回1620028800（北京时间2021-05-03T08:00:00+08:00）
     * 
     * // 处理跨时区应用场景
     * const serverUTC = 1672531200; // 服务器UTC时间
     * const clientLocal = no.localDateSeconds(serverUTC); // 根据客户端时区转换
     */
    export function localDateSeconds(utcSeconds: number): number {
        const t = new Date(utcSeconds * 1000);
        t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
        return Math.floor(t.getTime() * .001);
    }

    const _parseSecondsCache: { d: number, h: number, M: number, s: number } = { d: 0, h: 0, M: 0, s: 0 };
    /**
     * 将秒数解析为日时分秒
     * @param v 总秒数
     * @returns 包含天(d)、小时(h)、分钟(M)、秒(s)的对象
     * @example
     * // 计算在线时长
     * no.parseSeconds(86461); // {d:1, h:1, M:1, s:1}
     * 
     * // 显示任务剩余时间
     * const {d, h} = no.parseSeconds(93200);
     * console.log(`剩余${d}天${h}小时`);
     */
    export function parseSeconds(v: number): { d: number, h: number, M: number, s: number } {
        _parseSecondsCache.d = floor(v / 86400);
        _parseSecondsCache.h = floor(v / 3600) % 24;
        _parseSecondsCache.M = floor((v % 3600) / 60);
        _parseSecondsCache.s = v % 60;
        return _parseSecondsCache;
    }

    const _parseTimestampCache: { y: number, m: number, d: number, h: number, M: number, s: number } = { y: 0, m: 0, d: 0, h: 0, M: 0, s: 0 };
    /**
     * 将时间戳解析为年月日时分秒
     * @param v 时间戳总秒数
     * @returns 包含年(y)、月(m)、日(d)、时(h)、分(M)、秒(s)的对象
     * @example
     * // 解析活动开始时间
     * no.parseTimestamp(1696141845); // {y:2023, m:10, d:1, h:12, M:30, s:45}
     * 
     * // 格式化生日时间
     * const {y, m, d} = no.parseTimestamp(947606400);
     * console.log(`生日：${y}年${m}月${d}日`); // 生日：2000年1月1日
     */
    export function parseTimestamp(v: number): { y: number, m: number, d: number, h: number, M: number, s: number } {
        let t = new Date(v * 1000);
        _parseTimestampCache.y = t.getFullYear();
        _parseTimestampCache.m = t.getMonth() + 1;
        _parseTimestampCache.d = t.getDate();
        _parseTimestampCache.h = t.getHours();
        _parseTimestampCache.M = t.getMinutes();
        _parseTimestampCache.s = t.getSeconds();
        return _parseTimestampCache;
    }

    /**
     * 获取当前时间戳（秒）
     * @param v 时间偏移量（秒），默认0
     * @returns 当前时间戳（秒）加上偏移量
     * @example
     * // 获取当前时间
     * no.timestamp(); // 1696141845
     * 
     * // 计算1小时后时间
     * const oneHourLater = no.timestamp(3600);
     */
    export function timestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        return floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取当前时间戳（毫秒）
     * @param v 时间偏移量（毫秒），默认0
     * @returns 当前时间戳（毫秒）加上偏移量
     * @example
     * // 精确计时
     * const start = no.timestampMs();
     * // ...执行操作
     * const cost = no.timestampMs() - start;
     * 
     * // 设置30分钟后过期
     * const expireTime = no.timestampMs(1800000);
     */
    export function timestampMs(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        return a.getTime() + v;
    }

    /**
     * 获取当前/指定偏移的零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @param isUTC 是否使用UTC时间 默认false（使用本地时区）
     * @returns 零点时间戳（秒） + 偏移量
     * @example
     * // 获取今日零点
     * no.zeroTimestamp(); // 1696141800
     * // 获取UTC零点
     * no.zeroTimestamp(0, true); 
     * // 获取明日此时时间戳
     * no.zeroTimestamp(86400);
     */
    export function zeroTimestamp(v = 0, isUTC = false): number {
        let a = new Date(sysTime.now * 1000);
        if (isUTC) {
            a.setUTCHours(0, 0, 0, 0);
        } else {
            a.setHours(0, 0, 0, 0);
        }
        return floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取本周一零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 本周一零点时间戳 + 偏移量
     * @example
     * // 获取本周一零点
     * no.mondayZeroTimestamp(); 
     * // 计算本周活动结束时间（下周一零点前10秒）
     * no.nextMondayZeroTimestamp(-10);
     */
    export function mondayZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(a.getDate() - (a.getDay() || 7) + 1);
        return floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取下周一零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 下周一零点时间戳 + 偏移量
     * @example
     * // 获取下周一起始时间
     * no.nextMondayZeroTimestamp();
     * // 计算周常任务剩余时间
     * const remain = no.nextMondayZeroTimestamp() - Date.now()/1000;
     */
    export function nextMondayZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(a.getDate() - (a.getDay() || 7) + 8);
        return floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取本月1号零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 当月首日零点时间戳 + 偏移量
     * @example
     * // 获取本月起始时间
     * no.date1ZeroTimestamp();
     * // 计算月度统计时长
     * const monthDuration = Date.now()/1000 - no.date1ZeroTimestamp();
     */
    export function date1ZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(1);
        return floor(a.getTime() / 1000) + v;
    }

    /**
     * 获取下月1号零点时间戳（秒）
     * @param v 时间偏移量（秒）默认0
     * @returns 下月首日零点时间戳 + 偏移量
     * @example
     * // 获取下月起始时间
     * no.nextMonthDate1ZeroTimestamp();
     * // 计算订阅剩余时间
     * const remain = no.nextMonthDate1ZeroTimestamp() - Date.now()/1000;
     */
    export function nextMonthDate1ZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(1);
        a.setMonth(a.getMonth() + 1);
        return floor(a.getTime() / 1000) + v;
    }

    /**
     * 转换任意时间戳为当日零点时间戳（秒）
     * @param v 原始时间戳（秒）
     * @returns 对应日期的零点时间戳
     * @example
     * // 转换当前时间
     * no.toZeroTimestamp(Date.now()/1000);
     * // 处理日志时间
     * const logTime = 1696141845;
     * const logDate = no.toZeroTimestamp(logTime);
     */
    export function toZeroTimestamp(v: number): number {
        let a = new Date(v * 1000);
        a.setHours(0, 0, 0, 0);
        return floor(a.getTime() / 1000);
    }

    /**
     * 将秒数转换为本地化时间格式（时:分:秒）
     * @param time 时间长度（秒）
     * @returns 格式化的时间字符串（示例：3:15:45 表示3小时15分45秒）
     * @example
     * // 转换游戏在线时长
     * no.time2LocalFormat(3661); // 返回 "1:1:1"
     * // 显示任务耗时
     * const costTime = no.time2LocalFormat(145); // 返回 "0:2:25"
     */
    export function time2LocalFormat(time: number): string {
        let h: number, m: number, s: number;
        h = floor(time / 3600);
        m = floor((time % 3600) / 60);
        s = time % 60;
        return `${h}:${m}:${s}`;
    }

    /**
     * 将秒数转换为本地化的时分秒字符串（自动省略前导零）
     * @param seconds 时间长度（秒）
     * @returns 格式化的时间字符串（优先显示最大时间单位）
     * @example
     * // 显示任务剩余时间
     * no.second2LocalString(3661); // 返回 "1小时"
     * no.second2LocalString(61);   // 返回 "1分1秒"
     * no.second2LocalString(45);   // 返回 "45秒"
     * 
     * // 处理成就时间显示
     * const playTime = 3599;
     * document.getElementById('time').textContent = no.second2LocalString(playTime); // 显示 "59分59秒"
     */
    export function second2LocalString(seconds: number): string {
        let h: number, m: number, s: number;
        h = floor(seconds / 3600);
        m = floor((seconds % 3600) / 60);
        s = seconds % 60;
        let a = '';
        if (h > 0) a = `${h}`;
        if (m > 0) a = `${m}`;
        if (s > 0) a = `${s}`;
        return a;
    }

    /**
     * 秒数转格式化时间字符串（支持自定义格式和天数显示）
     * @param sec 时间长度（秒）
     * @param formatter 格式模板，支持 {d}天,{h}小时,{m}分,{s}秒
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * // 基本用法
     * no.sec2time(3723); // 返回 "01:02:03"
     * 
     * // 自定义格式
     * no.sec2time(90061, '{d}天{h}时', false); // 返回 "1天1时"
     * 
     * // 显示倒计时
     * no.sec2time(3599, '{m}:{s}'); // 返回 "59:59"
     * 
     * // 处理负数
     * no.sec2time(-5); // 返回 "00:00:00"
     */
    export function sec2time(sec: number, formatter?: string, show0 = true) {
        formatter = formatter || '{h}:{m}:{s}';
        // 处理负数和零值
        if (sec <= 0) {
            let a = show0 ? '00' : '0';
            return formatString(formatter, { h: a, m: a, s: a });
        }
        let d = floor(sec / 86400);
        let h = floor(sec / 3600) % 24;
        // 自动切换天数显示
        if (d > 0) {
            formatter = `{d}d{h}h`;
            return formatString(formatter, { h: h, d: d });
        }

        let m: any = floor(sec / 60 % 60);
        let s: any = floor(sec % 60);

        // 前导零处理
        if (m <= 9 && show0) { m = `0${m}` }
        if (s <= 9 && show0) { s = `0${s}` }

        return formatString(formatter, { h: h, m: m, s: s });
    }

    /**
     * 内部方法 - 格式化纯时间部分（时/分/秒）
     * @param sec 时间戳（秒）
     * @param formatter 格式模板
     * @param show0 是否显示前导零
     * @returns 格式化后的时间字符串
     * @example
     * _formatSeconds(3615, '{h}小时{M}分', true) // 返回 "01小时00分"
     */
    function _formatSeconds(sec: number, formatter: string, show0: boolean): string {
        if (sec <= 0) {
            let a = show0 ? '00' : '0';
            return formatString(formatter, { h: a, M: a, s: a });
        }
        let h: any, m: any, s: any;
        h = floor(sec / 3600);
        m = floor((sec % 3600) / 60);
        s = sec % 60;
        if (m <= 9 && show0) { m = `0${m}`; }
        if (s <= 9 && show0) { s = `0${s}`; }
        return formatString(formatter, { h: h, M: m, s: s });
    }

    /**
     * 内部方法 - 格式化完整时间（年/月/日/时/分/秒）
     * @param sec 时间戳（秒）
     * @param formatter 格式模板
     * @param show0 是否显示前导零
     * @returns 格式化后的日期时间字符串
     * @example
     * _formatTime(1654321000, '{y}-{m}-{d}', true) // 返回 "2022-06-04"
     */
    function _formatTime(sec: number, formatter: string, show0: boolean): string {
        if (sec <= 0) return '';
        let { y, m, d, h, M, s }: { y: number, m: any, d: any, h: any, M: any, s: any } = parseTimestamp(sec);
        if (m <= 9 && show0) { m = `0${m}`; }
        if (d <= 9 && show0) { d = `0${d}`; }
        if (h <= 9 && show0) { h = `0${h}`; }
        if (M <= 9 && show0) { M = `0${M}`; }
        if (s <= 9 && show0) { s = `0${s}`; }
        return formatString(formatter, { y: y, m: m, d: d, h: h, M: M, s: s });
    }

    /**
     * 格式化时间为年月日时分秒（格式：年.月.日 时:分:秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_yymmddhhMMss(1654321000) // "2022.06.04 12:36:40"
     * formatTime_yymmddhhMMss(0, false)   // "0.0.0 0:0:0"
     */
    export function formatTime_yymmddhhMMss(sec: number, show0 = true): string {
        return _formatTime(sec, '{y}.{m}.{d} {h}:{M}:{s}', show0);
    }

    /**
     * 格式化时间为年月日（格式：年.月.日）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的日期字符串
     * @example
     * formatTime_yymmdd(1654321000)    // "2022.06.04"
     * formatTime_yymmdd(1696141845)    // "2023.10.01"
     */
    export function formatTime_yymmdd(sec: number, show0 = true): string {
        return _formatTime(sec, '{y}.{m}.{d}', show0);
    }

    /**
     * 格式化时间为时分秒（格式：时:分:秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_hhMMss(3661)         // "01:01:01"
     * formatTime_hhMMss(45296, false) // "12:34:56"
     */
    export function formatTime_hhMMss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}:{M}:{s}', show0);
    }

    /**
     * 格式化时间为时分（格式：时:分）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_hhMM(3661)       // "01:01"
     * formatTime_hhMM(45296)      // "12:34"
     */
    export function formatTime_hhMM(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}:{M}', show0);
    }

    /**
     * 格式化时间为小时数（格式：时）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的小时字符串
     * @example
     * formatTime_hh(3600)     // "01"
     * formatTime_hh(7200, false) // "2"
     */
    export function formatTime_hh(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}', show0);
    }

    /**
     * 格式化时间为分秒（格式：分:秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime_MMss(65)     // "01:05"
     * formatTime_MMss(125)    // "02:05"
     */
    export function formatTime_MMss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{M}:{s}', show0);
    }

    /**
     * 格式化时间为秒数（格式：秒）
     * @param sec 时间戳（秒）
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的秒数字符串
     * @example
     * formatTime_ss(45)       // "45"
     * formatTime_ss(5)        // "05"（当show0为true时）
     */
    export function formatTime_ss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{s}', show0);
    }

    /**
     * 通用时间格式化方法
     * @param sec 时间戳（秒）
     * @param fmt 格式类型：yymmddhhMMss | yymmdd | hhMMss | hhMM | hh | MMss | ss
     * @param show0 是否显示前导零（默认true）
     * @returns 格式化后的时间字符串
     * @example
     * formatTime(1654321000, 'yymmdd') // "2022.06.04"
     * formatTime(45296, 'hhMM')        // "12:34"
     * formatTime(125, 'MMss', false)   // "2:5"
     */
    export function formatTime(sec: number, fmt: 'yymmddhhMMss' | 'yymmdd' | 'hhMMss' | 'hhMM' | 'hh' | 'MMss' | 'ss', show0 = true): string {
        switch (fmt) {
            case 'yymmddhhMMss': return formatTime_yymmddhhMMss(sec, show0);
            case 'yymmdd': return formatTime_yymmdd(sec, show0);
            case 'hhMMss': return formatTime_hhMMss(sec, show0);
            case 'hhMM': return formatTime_hhMM(sec, show0);
            case 'hh': return formatTime_hh(sec, show0);
            case 'MMss': return formatTime_MMss(sec, show0);
            case 'ss': return formatTime_ss(sec, show0);
        }
    }

    /**
     * 获取节点的世界坐标系坐标（基于Cocos Creator坐标系，屏幕左下角为原点）
     * @param node 目标节点
     * @param out 可选输出向量，用于复用Vec3对象（提升性能）
     * @returns 世界坐标系中的三维坐标
     * @example
     * // 获取玩家角色世界坐标
     * const playerPos = no.nodeWorldPosition(this.playerNode);
     * // 复用向量对象避免频繁创建
     * const tempPos = no.v3();
     * no.nodeWorldPosition(this.enemyNode, tempPos);
     */
    export function nodeWorldPosition(node: Node, out?: Vec3): Vec3 {
        if (!checkValid(node)) return;
        out = out || _tempPos;
        node.getWorldPosition(out);
        return out;
    }

    /**
     * 将世界坐标转换为节点本地坐标系坐标
     * @param pos 世界坐标系中的位置
     * @param node 目标节点（需要包含UITransform组件）
     * @param out 可选输出向量，用于复用Vec3对象
     * @returns 节点本地坐标系中的坐标
     * @example
     * // 转换点击位置到UI节点本地坐标
     * const touchWorldPos = no.v3(event.touch._point.x, event.touch._point.y);
     * const localPos = no.worldPositionInNode(touchWorldPos, this.uiPanel);
     * // 处理3D物体在UI中的投影位置
     * const modelWorldPos = this.modelNode.worldPosition;
     * const uiLocalPos = no.worldPositionInNode(modelWorldPos, this.uiContainer);
     */
    export function worldPositionInNode(pos: Vec3, node: Node, out?: Vec3): Vec3 {
        if (!checkValid(node)) return;
        out = out || _tempPos;
        node.getComponent(UITransform).convertToNodeSpaceAR(pos, out);
        return out;
    }

    /**
     * 将节点A的坐标转换为节点B的本地坐标系坐标
     * @param node 源节点
     * @param otherNode 目标节点（需要包含UITransform组件）
     * @param out 可选输出向量，用于复用Vec3对象
     * @returns 目标节点本地坐标系中的坐标
     * @example
     * // 转换小地图图标到全屏地图的位置
     * const miniMapPos = no.nodePositionInOtherNode(this.iconNode, this.fullMapNode);
     * // 计算两个UI元素的相对位置
     * const buttonPos = no.nodePositionInOtherNode(this.btnNode, this.mainPanel);
     * // 跟踪3D物体在雷达图上的位置
     * const radarPos = no.nodePositionInOtherNode(this.aircraftNode, this.radarNode);
     */
    export function nodePositionInOtherNode(node: Node, otherNode: Node, out?: Vec3): Vec3 {
        out = out || _tempPos;
        nodeWorldPosition(node, out);
        otherNode.getComponent(UITransform).convertToNodeSpaceAR(out, out);
        return out;
    }

    /**
     * 数组排序（支持自定义比较函数和升降序）
     * @param arr 要排序的数组（会被直接修改）
     * @param handler 自定义比较函数（返回负数表示a在前，正数表示b在前，0不变）
     *                未提供时默认按数字升序排序
     * @param desc 是否降序排列（默认false升序）
     * @example
     * // 基本数字排序
     * const nums = [3, 1, 4];
     * no.sortArray(nums); // [1, 3, 4]
     * 
     * // 降序排列
     * no.sortArray(nums, undefined, true); // [4, 3, 1]
     * 
     * // 对象数组自定义排序（按age升序）
     * const users = [{age:25}, {age:18}];
     * no.sortArray(users, (a, b) => a.age - b.age);
     */
    export function sortArray<T>(arr: T[], handler?: (a: T, b: T) => number, desc = false): void {
        if (arr == null || arr.length == 0) return;
        if (!handler)
            handler = (a: T, b: T) => {
                return <number><undefined>a - <number><undefined>b;
            };
        arr.sort((a, b) => {
            if (desc) return handler(b, a);
            return handler(a, b);
        });
    }

    /**
     * 插入排序算法（适合相对有序的数据，稳定排序）
     * @param arr 要排序的数组（会被直接修改）
     * @param handler 比较函数（返回true时交换位置）
     *                未提供时默认按数字升序排序
     * @param desc 是否降序排列（默认false升序）
     * @example
     * // 基本数字排序
     * const data = [5, 2, 4, 6];
     * no.insertionSort(data); // [2, 4, 5, 6]
     * 
     * // 降序排列对象数组（按score）
     * const items = [{score:80}, {score:95}];
     * no.insertionSort(items, (a, b) => a.score > b.score, true);
     * 
     * // 自定义排序逻辑（字符串长度排序）
     * const strs = ['apple', 'kiwi'];
     * no.insertionSort(strs, (a, b) => a.length > b.length);
     */
    export function insertionSort<T>(arr: T[], handler?: (a: T, b: T) => boolean, desc = false) {
        let n = arr?.length || 0;
        if (n <= 1) return;
        if (!handler)
            handler = (a: T, b: T) => {
                return <number><undefined>a > <number><undefined>b;
            };
        let a1: any, a2: any;
        for (let i = 1; i < n; i++) {
            a2 = arr[i];
            let j: number;
            for (j = i; j > 0; j--) {
                a1 = arr[j - 1];
                if (desc && handler(a2, a1)) arr[j] = a1;
                else if (!desc && handler(a1, a2)) arr[j] = a1;
                else break;
            }
            arr[j] = a2;
        }
    }

    /**
     * 计算节点在世界坐标系中的包围盒矩形
     * @param node 目标节点
     * @param offset 矩形偏移量（可选，默认Vec2.ZERO）
     * @param subSize 尺寸增减量（可选，默认Size.ZERO）
     * @returns 世界坐标系中的矩形区域
     * @example
     * // 检测按钮在世界空间的实际范围
     * const btnBox = no.nodeBoundingBox(this.startBtn);
     * 
     * // 带偏移和尺寸扩展的碰撞检测
     * const enemyHitBox = no.nodeBoundingBox(
     *   enemyNode, 
     *   v2(10, -5),  // 向右偏移10，向下偏移5
     *   size(20, 20) // 宽高各增加20
     * );
     * 
     * // 配合物理系统使用
     * const collider = this.getComponent(BoxCollider2D);
     * collider.size = no.nodeBoundingBox(this.node).size;
     */
    export function nodeBoundingBox(node: Node, offset?: Vec2, subSize?: Size): Rect {
        offset = offset || v2();
        subSize = subSize || Size.ZERO;
        let origin = _tempPos;
        origin = nodeWorldPosition(node, origin);
        let anchor = node.getComponent(UITransform).anchorPoint;
        let size = node.getComponent(UITransform).contentSize;
        let rect = new Rect();
        rect.height = size.height + subSize.height;
        rect.width = size.width + subSize.width;
        rect.x = origin.x - anchor.x * size.width;
        rect.y = origin.y - anchor.y * size.height
        return rect;
    }

    /**
     * 获取节点在父节点坐标系中的矩形区域
     * @param node 目标节点
     * @returns 父节点坐标系中的矩形
     * @example
     * // 检测子节点是否在父容器可见区域
     * const itemRect = no.nodeRect(scrollView.content.children[0]);
     * const viewRect = no.nodeRect(scrollView.view);
     * const isVisible = viewRect.intersects(itemRect);
     * 
     * // 拖拽对齐辅助线
     * const targetRect = no.nodeRect(dropTarget);
     * if (draggingRect.intersects(targetRect)) {
     *   showAlignmentGuide(targetRect.center);
     * }
     */
    export function nodeRect(node: Node): Rect {
        const pos = node.position,
            contentSize = size(node);
        let anchor = node.getComponent(UITransform).anchorPoint;
        const rect = new Rect();
        rect.x = pos.x - anchor.x * contentSize.width;
        rect.y = pos.y - anchor.y * contentSize.height
        rect.height = contentSize.height;
        rect.width = contentSize.width;
        return rect;
    }

    export function nodeRectInOther(node: Node, other: Node): Rect {
        const pos = nodePositionInOtherNode(node, other, _tempPos),
            contentSize = size(node);
        let anchor = node.getComponent(UITransform).anchorPoint;
        const rect = new Rect();
        rect.x = pos.x - anchor.x * contentSize.width;
        rect.y = pos.y - anchor.y * contentSize.height
        rect.height = contentSize.height;
        rect.width = contentSize.width;
        return rect;
    }

    /**
     * 检测坐标点是否在节点范围内（支持世界坐标系）
     * @param node 目标节点
     * @param point 检测点（世界坐标系）
     * @param offset 包围盒偏移量（可选）
     * @param subSize 包围盒尺寸调整（可选）
     * @returns 是否包含该点
     * @example
     * // 按钮点击检测
     * input.on(Input.EventType.TOUCH_END, (event) => {
     *   const touchPos = event.touch.getUILocation();
     *   if (no.nodeContainsPoint(this.btnNode, touchPos)) {
     *     this.onClickButton();
     *   }
     * });
     * 
     * // 自定义热区检测（扩展点击区域）
     * const isHit = no.nodeContainsPoint(
     *   this.smallButton,
     *   touchPos,
     *   v2(-10, -10), // 向左上偏移
     *   size(20, 20)  // 扩大点击区域
     * );
     */
    export function nodeContainsPoint(node: Node, point: Vec2, offset?: Vec2, subSize?: Size): boolean {
        let rect = nodeBoundingBox(node, offset, subSize);
        return rect.contains(point);
    }

    /**
     * 检测两个节点在场景中是否相交
     * @param node 第一个节点
     * @param otherNode 第二个节点
     * @returns 是否发生矩形相交
     * @example
     * // 敌人与子弹碰撞检测
     * update() {
     *   this.bullets.forEach(bullet => {
     *     if (no.nodeIntersects(this.enemyNode, bullet.node)) {
     *       this.onEnemyHit();
     *     }
     *   });
     * }
     * 
     * // UI元素重叠提示
     * const isOverlap = no.nodeIntersects(
     *   this.draggingItem, 
     *   this.inventorySlot
     * );
     * this.slotHighlight.active = isOverlap;
     */
    export function nodeIntersects(node: Node, otherNode: Node): boolean {
        let rect = nodeBoundingBox(node),
            rect1 = nodeBoundingBox(otherNode);
        return rect.intersects(rect1);
    }

    /**
     * 将对象转换为指定键值结构的数组
     * @param obj 源对象（键值对结构）
     * @param keyName 生成的数组元素中用于存储对象键的属性名
     * @param valueName 生成的数组元素中用于存储对象值的属性名
     * @returns 包含键值对对象的数组，无效输入返回null
     * @example
     * // 转换配置表数据
     * const config = { attack: 100, defense: 50 };
     * no.object2Array(config, 'type', 'value'); 
     * // 返回 [{type:'attack', value:100}, {type:'defense', value:50}]
     * 
     * // 处理空值情况
     * no.object2Array(null, 'key', 'value'); // 返回 null
     */
    export function object2Array(obj: any, keyName: string, valueName: string): any[] {
        if (obj == null || keyName == null || valueName == null) return null;
        let arr = new Array();
        let keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            arr[arr.length] = {
                [keyName]: keys[i],
                [valueName]: obj[keys[i]]
            };
        }
        return arr;
    }

    /**
     * 将对象转换为值列表数组
     * @param obj 源对象（键值对结构）
     * @returns 包含对象所有属性值的数组，无效输入返回空数组
     * @example
     * // 获取用户数据列表
     * const users = { 1: {name:'A'}, 2: {name:'B'} };
     * no.object2List(users); // 返回 [{name:'A'}, {name:'B'}]
     * 
     * // 处理空对象
     * no.object2List({}); // 返回 []
     */
    export function object2List(obj: any): any[] {
        if (obj == null) return [];
        let arr = new Array();
        let keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            arr[arr.length] = obj[keys[i]];
        }
        return arr;
    }

    /**
     * 根据权重值进行随机选择（支持排除特定索引）
     * @param weight 权重数组（数值越大被选中的概率越高）
     * @param except 需要排除的权重数组索引（可选）
     * @returns 被选中的权重项索引
     * @example
     * // 基础权重随机
     * no.weightRandom([70, 20, 10]); // 70%概率返回0，20%返回1，10%返回2
     * 
     * // 排除不可选项
     * no.weightRandom([50, 0, 50], [0]); // 只会返回2（索引0被排除）
     * 
     * // 处理全排除情况
     * no.weightRandom([10, 20], [0,1]); // 返回undefined（需调用方处理）
     */
    export function weightRandom(weight: number[], except?: number[]): number {
        if (!weight) return 0;
        let sum = 0;
        except = except || [];
        for (let i = 0; i < weight.length; i++) {
            if (except.indexOf(i) == -1) {
                sum += Number(weight[i]);
            }
        }
        let r = random() * sum;
        let n = weight.length;
        let a = 0;
        for (let i = 0; i < n; i++) {
            let m = Number(weight[i]);
            if (m == 0 || except.indexOf(i) > -1) continue;
            a += m;
            if (r <= a) {
                return i;
            }
        }
    }

    /**
     * 根据对象数组中的指定属性进行权重随机
     * @param weight 对象数组（每个元素需包含权重属性）
     * @param key 权重值对应的属性名
     * @returns 被选中的对象数组索引
     * @example
     * // 随机游戏事件
     * const events = [
     *   { id:1, prob:80 }, 
     *   { id:2, prob:15 },
     *   { id:3, prob:5 }
     * ];
     * no.weightRandomObject(events, 'prob'); // 80%概率返回0
     * 
     * // 处理无效键
     * no.weightRandomObject([{a:10}], 'b'); // 所有权重为NaN，返回0
     */
    export function weightRandomObject(weight: any[], key: string): number {
        if (!weight) return 0;
        let a: number[] = [];
        for (let i = 0; i < weight.length; i++) {
            a[a.length] = Number(weight[i][key]);
        }
        return weightRandom(a);
    }

    /**
     * 数值取整（优化版）
     * @param v - 需要处理的数值
     * @returns 取整后的数值
     * @example
     * no.floor(3.7)   // 3
     * no.floor(-1.2)  // -1（与Math.floor(-1.2)=-2不同）
     * no.floor(0.999) // 0
     * no.floor(12345678901234567890.5) // 精度可能丢失（超过安全整数范围时）
     */
    export function floor(v: number): number {
        if (v < 1 && v >= 0) return 0;
        let a = v | 0;
        if (a == 0 || (v > 0 && a < 0) || (v < 0 && a > 0)) return Math.floor(v);
        return a;
    }

    /**
     * 获取数值的小数部分
     * @param v - 需要处理的数值
     * @returns 小数部分（0到1之间的浮点数）
     * @example
     * no.fract(3.14)  // 0.14
     * no.fract(-2.5)  // 0.5
     * no.fract(100)   // 0
     */
    export function fract(v: number): number {
        let s = String(v).split('.');
        s[0] = '0';
        return Number(s.join('.'));
    }

    /**
     * 向上取整（优化版）
     * @param v - 需要处理的数值
     * @returns 向上取整后的数值
     * @example
     * no.ceil(2.3)   // 3
     * no.ceil(-2.7)  // -2
     * no.ceil(5)     // 5
     */
    export function ceil(v: number): number {
        let a = floor(v);
        if (a < 0 || a >= v) return a;
        return a + 1;
    }

    /**
     * 循环数值（环形数值处理）
     * @param v - 当前值
     * @param min - 最小值（包含）
     * @param max - 最大值（包含）
     * @returns 循环后的数值
     * @example
     * no.cyclic(5, 0, 4)   // 0
     * no.cyclic(-1, 0, 4)  // 4
     * no.cyclic(2.5, 0, 4) // 2.5
     */
    export function cyclic(v: number, min: number, max: number): number {
        if (v < min) return max;
        if (v > max) return min;
        return v;
    }

    /**
     * 数值钳制（限制在指定范围内）
     * @param v - 需要处理的数值
     * @param min - 最小值
     * @param max - 最大值
     * @returns 限制后的数值
     * @example
     * no.clamp(10, 0, 5)  // 5
     * no.clamp(-3, 0, 5)  // 0
     * no.clamp(3.5, 0, 5) // 3.5
     */
    export function clamp(v: number, min: number, max: number): number {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    /**
     * 是否在范围内
     * @param v 
     * @param min 
     * @param max 
     * @returns 
     */
    export function inRange(v: number, min: number, max: number): boolean {
        return v >= min && v <= max;
    }

    /**
     * 循环索引（适用于环形数组访问）
     * @param n - 当前索引
     * @param min - 最小索引值（通常为0）
     * @param max - 最大索引值（通常为数组长度-1）
     * @returns 循环后的索引
     * @example
     * no.circleIndex(5, 0, 4)  // 0
     * no.circleIndex(-1, 0, 4) // 4
     * no.circleIndex(3, 0, 4)  // 3
     */
    export function circleIndex(n: number, min: number, max: number): number {
        if (n < min) return max;
        if (n > max) return min;
        return n;
    }

    /**
     * 平滑过渡计算（返回0-1标准化值）
     * @param v - 当前值
     * @param min - 范围最小值
     * @param max - 范围最大值
     * @returns 标准化后的0-1值
     * @example
     * no.smoothStep(5, 0, 10)  // 0.5
     * no.smoothStep(15, 10, 20) // 0.5
     * no.smoothStep(25, 10, 20) // 1
     */
    export function smoothStep(v: number, min: number, max: number): number {
        if (v < min) return 0;
        if (v > max) return 1;
        return (v - min) / (max - min);
    }

    /**
     * 获取数字科学计数法表示的指数值
     * @param n - 需要解析的数字
     * @returns 科学计数法指数部分的值（无科学计数法时返回0）
     * @example
     * eIndex(1.23e5)  // 5
     * eIndex(0.0003)  // 0
     */
    function eIndex(n: number): number {
        let s = n.toString().toLowerCase();
        let a = s.split('e');
        if (!a[1]) return 0;
        return Number(a[1]);
    }

    /**
     * 计算数字的实际小数位数（考虑科学计数法）
     * @param n - 需要计算的数字
     * @returns 修正后的有效小数位数
     * @example
     * decimalDigits(0.123)    // 3
     * decimalDigits(1.23e-2) // 5（实际值为0.0123）
     */
    function decimalDigits(n: number): number {
        let a = n.toString().toLowerCase().split('e')[0].split('.');
        return (!!a[1] ? a[1].length : 0) - eIndex(n);
    }

    /**
     * 精确加法运算（解决浮点数精度问题）
     * @param n1 - 被加数
     * @param n2 - 加数
     * @returns 精确相加结果
     * @example
     * add(0.1, 0.2)   // 0.3
     * add(1e-3, 2e-3) // 0.003
     * add(5, 3.1)     // 8.1
     */
    export function add(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            m: number = Math.pow(10, Math.max(r1, r2));
        return (n1 * m + n2 * m) / m;
    }

    /**
     * 精确减法运算（解决浮点数精度问题）
     * @param n1 - 被减数
     * @param n2 - 减数
     * @returns 精确相减结果
     * @example
     * minus(0.3, 0.1) // 0.2
     * minus(2e-2, 1e-2) // 0.01
     * minus(5, 2.3)   // 2.7
     */
    export function minus(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            n: number = Math.max(r1, r2),
            m: number = Math.pow(10, n);
        return Number(((n1 * m - n2 * m) / m).toFixed(n));
    }

    /**
     * 精确乘法运算（解决浮点数精度问题）
     * @param n1 - 被乘数
     * @param n2 - 乘数
     * @returns 精确相乘结果
     * @example
     * mutiply(0.1, 0.2) // 0.02
     * mutiply(3e3, 2e2) // 600000
     * mutiply(1.5, 3)   // 4.5
     */
    export function mutiply(n1: number, n2: number): number {
        let m: number = decimalDigits(n1) + decimalDigits(n2),
            s1 = n1.toString().toLowerCase().split('e')[0].replace('.', ''),
            s2 = n2.toString().toLowerCase().split('e')[0].replace('.', '');
        return Number(s1) * Number(s2) / Math.pow(10, m);
    }

    /**
     * 精确除法运算（解决浮点数精度问题）
     * @param n1 - 被除数
     * @param n2 - 除数
     * @returns 精确相除结果
     * @example
     * divide(0.3, 0.1) // 3
     * divide(1e6, 2e2) // 5000
     * divide(4.5, 1.5) // 3
     */
    export function divide(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            s1 = n1.toString().toLowerCase().split('e')[0].replace('.', ''),
            s2 = n2.toString().toLowerCase().split('e')[0].replace('.', '');
        return (Number(s1) / Number(s2)) * Math.pow(10, r2 - r1);
    }

    export enum TweenSetType {
        Node = 'node',
        Transform = 'transform',
        Opacity = 'opacity'
    }

    export class TweenSet {

        protected map: any;
        private _node: Node;

        constructor(node: Node) {
            this.init(node);
        }

        /**
         * 初始化缓动集合
         * @param node 目标节点
         * @private
         * @example
         * // 创建包含节点位置、尺寸和透明度的缓动集合
         * const tweenSet = new TweenSet(someNode);
         * // 同时控制多个组件属性：
         * // - Node组件控制位置/旋转/缩放
         * // - UITransform控制尺寸/锚点
         * // - UIOpacity控制透明度
         */
        private init(node: Node) {
            this._node = node;
            this.map = {};
            this.map[TweenSetType.Node] = tween(this._node);
            this.map[TweenSetType.Transform] = this._node.getComponent(UITransform) ? tween(this._node.getComponent(UITransform)) : null;
            this.map[TweenSetType.Opacity] = this._node.getComponent(UIOpacity) ? tween(this._node.getComponent(UIOpacity)) : null;
        }

        /**
         * 启动所有缓动动画
         * @returns Promise 在所有节点缓动完成后resolve
         * @example
         * // 同时执行多个缓动并等待完成
         * await this.tweenSet.start();
         * console.log('所有动画完成');
         * 
         * // 链式动画示例
         * this.tweenSet.start().then(() => {
         *     this.playCompleteSound();
         *     this.switchToNextScene();
         * });
         */
        public start(): Promise<void> {
            return new Promise<void>(resolve => {
                for (const key in this.map) {
                    let t: Tween = this.map[key];
                    if (key == TweenSetType.Node) {
                        t.call(resolve).start();
                    } else
                        t?.start();
                }
            }).catch(e => {
                console.error(e);
            });
        }

        /**
         * 停止所有缓动动画
         * @example
         * // 当界面需要提前销毁时停止动画
         * onDestroy() {
         *     this.tweenSet.stop();
         * }
         * 
         * // 用户快速操作时中断当前动画
         * button.onClick(() => {
         *     this.tweenSet.stop();
         *     this.playButtonEffect();
         * });
         */
        public stop() {
            for (const key in this.map) {
                let t: Tween = this.map[key];
                t?.stop();
            }
        }

        /**
         * 设置缓动动画数据
         * @param data 动画配置数据对象，包含以下属性：
         *   - delay: 延迟时间（秒）
         *   - duration: 动画持续时间（秒）
         *   - props: 动画属性配置对象
         *   - easing: 缓动函数类型
         *   - by/to/set: 动画类型（增量/目标值/立即设置）
         *   - callback: 动画完成回调
         *   - repeat: 重复次数
         * @example
         * // 基本位置动画
         * setTweenData({
         *   duration: 1,
         *   props: { pos: [100, 200] },
         *   easing: 'quadOut'
         * });
         * 
         * // 组合动画示例（旋转+缩放+透明度）
         * setTweenData({
         *   delay: 0.5,
         *   duration: 2,
         *   props: {
         *     rotation: [0, 0, 360], // XYZ旋转角度
         *     scale: 2,              // 等比缩放
         *     opacity: 0
         *   },
         *   to: true,
         *   repeat: 3
         * });
         * 
         * // 立即设置属性示例
         * setTweenData({
         *   props: {
         *     anchor: [0.5, 0.5],    // 设置锚点居中
         *     size: [200, 100]       // 设置节点尺寸
         *   },
         *   set: true
         * });
         */
        public setTweenData(data: any) {
            if (data.props != null) {
                let np: any, tp: any, op: any; // 分别存储节点属性、变换属性、透明度属性

                // 遍历所有属性配置
                for (let k in data.props) {
                    let v = data.props[k];
                    switch (k) {
                        case 'pos': // 位置属性（三维坐标）
                            np = np || {};
                            np['position'] = new Vec3(v[0], v[1], v[2]);
                            break;
                        case 'rotation': // 旋转属性（欧拉角转四元数）
                            np = np || {};
                            let quat: Quat = new Quat();
                            Quat.fromEuler(quat, v[0], v[1], v[2]);
                            np['rotation'] = quat;
                            break;
                        case 'scale': // 缩放属性（支持单值/二维/三维缩放）
                            np = np || {};
                            np['scale'] = new Vec3(
                                v[0] == undefined ? v : v[0],  // 处理单值缩放
                                v[1] == undefined ? (v[0] == undefined ? v : v[0]) : v[1], // 处理二维缩放
                                v[2] == undefined ? 1 : v[2]  // Z轴默认不缩放
                            );
                            break;
                        case 'angle': // 二维旋转角度（绕Z轴）
                            np = np || {};
                            np['angle'] = v;
                            break;
                        case 'size': // 尺寸属性（宽高）
                            tp = tp || {};
                            tp['contentSize'] = new Size(v[0], v[1]);
                            break;
                        case 'anchor': // 锚点属性（归一化坐标）
                            tp = tp || {};
                            tp['anchorPoint'] = new Vec2(v[0], v[1]);
                            break;
                        case 'opacity': // 透明度属性（0-255）
                            op = op || {};
                            op['opacity'] = v;
                            break;
                    }
                }
                // 设置全局延迟时间
                this.setDelay(data.delay);

                // 处理没有属性变化的延迟设置
                if (!np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].delay(data.duration || 0);
                if (!tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.delay(data.duration || 0);
                if (!op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.delay(data.duration || 0);

                const easing = data.easing; // 获取缓动函数类型

                // 根据动画类型配置缓动
                if (data.by) { // 增量动画
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].by(data.duration, np, { easing: easing });
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.by(data.duration, tp, { easing: easing });
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.by(data.duration, op, { easing: easing });
                } else if (data.to) { // 目标值动画
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].to(data.duration, np, { easing: easing });
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.to(data.duration, tp, { easing: easing });
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.to(data.duration, op, { easing: easing });
                } else if (data.set) { // 立即设置属性
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].set(np);
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.set(tp);
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.set(op);
                }

                // 设置回调函数到最后一个动画属性
                this.setCallback(data.callback, np ? TweenSetType.Node : (tp ? TweenSetType.Transform : TweenSetType.Opacity));
            } else if (data.delay) {
                this.setDelay(data.delay);
            }

            // 设置动画重复次数
            this.setRepeat(data.repeat);
        }

        /**
         * 设置动画延迟时间（所有属性动画统一延迟）
         * @param v 延迟时间（秒）
         * @example
         * // 在连续动画中设置初始延迟
         * this.setDelay(0.5); // 所有动画属性延迟0.5秒执行
         */
        private setDelay(v: number) {
            if (!v) return;
            for (const key in this.map) {
                this.map[key] = this.map[key]?.delay(v);
            }
        }

        /**
         * 设置动画重复次数
         * @param v 重复次数（负数表示无限循环）
         * @example
         * // 创建心跳动画效果
         * this.setRepeat(-1); // 无限循环
         * // 创建三次闪烁效果
         * this.setRepeat(2); // 实际执行3次（初始+重复2次）
         */
        private setRepeat(v: number) {
            if (!v) return;
            if (v < 0) v = 9999;
            for (const key in this.map) {
                this.map[key] = this.map[key]?.repeat(v, this.map[key]);
            }
        }

        /**
         * 设置动画完成回调
         * @param cb 回调类型：函数 | 事件对象{type: 事件类型, args: 参数数组}
         * @param key 目标动画属性键
         * @example
         * // 动画结束时播放音效
         * this.setCallback(() => audio.play('click'), 'opacity');
         * // 动画结束时派发自定义事件
         * this.setCallback({type: 'ANIM_END', args: [this.node]}, 'position');
         */
        private setCallback(cb: any, key: string) {
            if (!cb) return;
            let callFn: any;
            if (typeof cb == 'function') callFn = cb;
            else if (typeof cb == 'object') {
                const type: string = cb.type,
                    args: any[] = cb.args || [];
                callFn = () => {
                    no.evn.emit(type, ...args);
                }
            };
            this.map[key] = this.map[key]?.call(callFn);
        }

        /**
         * 播放动画序列
         * @param endCall 动画全部完成后的回调
         * @example
         * // 播放动画并在结束时跳转场景
         * this.play(() => {
         *   no.scene.load('Level2');
         * });
         */
        public play(endCall?: () => void) {
            this.start().then(endCall).catch(e => { err(e); });
        }

        /**
         * 播放缓动动画（支持并行/串行控制）
         * @param tweenSets 动画集合：单个为串行，数组元素并行执行
         * @param endCall 全部动画完成回调
         * @param target 关联目标对象（用于自动清理）
         * @example
         * // 并行执行移动和旋转动画
         * TweenSet.play([
         *   new TweenSet(node).to({position: v3(100,0,0)}),
         *   new TweenSet(node).to({angle: 360})
         * ], () => console.log('All done'));
         * 
         * // 串行执行先缩放后变色
         * TweenSet.play(
         *   new TweenSet(node)
         *     .to({scale: v3(2,2)})
         *     .to({color: Color.RED})
         * );
         */
        public static play(tweenSets: TweenSet | TweenSet[], endCall?: () => void, target?: any) {
            if (tweenSets instanceof Array) {
                let all = tweenSets.length,
                    n = 0;
                for (let i = 0; i < all; i++) {
                    tweenSets[i].play(() => {
                        n++;
                    });
                }
                scheduleUpdateCheck(() => {
                    return n === all;
                }, () => {
                    endCall?.();
                }, target);
            } else tweenSets.play(endCall);
        }

        /**
         * 停止目标所有动画
         * @param target 需要停止动画的对象
         * @example
         * // 当对象销毁时停止关联动画
         * onDestroy() {
         *   TweenSet.stop(this.node);
         * }
         */
        public static stop(target: any) {
            Tween.stopAllByTarget(target);
        }
    }

    /**
     * 解析缓动动效数据并生成动画序列
     * @param data 动效配置数据，支持以下格式：
     *            - 对象：单个动效配置
     *            - 一维数组：串行动效序列
     *            - 二维数组：外层并行，内层串行的复合动效
     * @param node 关联的目标节点（动画作用对象）
     * @returns 返回缓动动画集合，可能是单个TweenSet或并行集合数组
     * 
     * @example <caption>基本用法 - 单个动效</caption>
     * const tween = parseTweenData({
     *   duration: 1,
     *   props: { 
     *     position: [100, 200],
     *     opacity: 150
     *   },
     *   easing: 'quadOut'
     * }, node);
     * TweenSet.play(tween);
     * 
     * @example <caption>串行动效 - 一维数组</caption>
     * parseTweenData([
     *   { duration: 0.5, props: { scale: [2, 2] } },
     *   { duration: 1, props: { rotation: 90 } }
     * ], node);
     * 
     * @example <caption>并行动效 - 二维数组</caption>
     * parseTweenData([
     *   [ // 并行组1
     *     { props: { x: 100 }, repeat: 2 },
     *     { props: { angle: 45 }, easing: 'bounceOut' }
     *   ],
     *   [ // 并行组2
     *     { duration: 2, props: { size: [200, 100] } }
     *   ]
     * ], node);
     * 
     * @example <caption>完整配置示例</caption>
     * {
     *   delay: 0.5,       // 延迟时间（秒）
     *   duration: 1.2,    // 动画持续时间
     *   props: {          // 目标属性集合
     *     pos: [100, 0, 0],     // 世界坐标位置
     *     opacity: 200,         // 透明度（0-255）
     *     rotation: [0, 0, 45], // 三维旋转角度
     *     scale: 1.5,           // 缩放比例（支持数字或数组）
     *     size: [80, 120],      // 节点尺寸
     *     anchor: [0.5, 0.5]    // 锚点位置
     *   },
     *   easing: 'elasticOut', // 缓动函数
     *   repeat: 1,            // 重复次数（实际执行 repeat+1 次）
     *   callback: {           // 动画完成回调
     *     type: 'finish',     // 事件类型
     *     args: [true]        // 回调参数
     *   }
     * }
     */
    export function parseTweenData(data: any, node: Node): TweenSet | TweenSet[] {
        if (!data || !node) return null;

        // 处理并行结构（二维数组）
        if (data instanceof Array && data[0] instanceof Array) {
            let parallelGroup: TweenSet[] = [];
            for (let i = 0; i < data.length; i++) {
                // 递归处理每个并行组内的串行动画
                parallelGroup = parallelGroup.concat(parseTweenData(data[i], node));
            }
            return parallelGroup;
        }
        // 处理串行结构（对象或一维数组）
        else {
            const _tween = new TweenSet(node);
            const sequenceData = [].concat(data); // 统一转为数组处理

            for (let i = 0, n = sequenceData.length; i < n; i++) {
                _tween.setTweenData(sequenceData[i]); // 依次添加串行动作
            }
            return _tween;
        }
    }

    /**
     * 解析url传参（支持base64编码参数）
     * @returns 包含所有查询参数的键值对对象
     * @example
     * // 常规URL参数解析
     * // 假设当前URL为 http://example.com?name=test&level=5
     * const args = no.parseUrlArgs();
     * console.log(args.name); // 输出 "test"
     * 
     * // Base64编码参数解析
     * // 假设URL参数为 aG9zdD1sb2NhbGhvc3Q=
     * // 解码后为 host=localhost
     * const config = no.parseUrlArgs();
     * console.log(config.host); // 输出 "localhost"
     */
    export function parseUrlArgs(): any {
        let query = window.location.search.substring(1);
        if (query.indexOf('&') == -1) query = window.atob(query)
        let vars = query.split("&");
        let args = new Object();
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            args[pair[0]] = pair[1];
        }
        return args;
    }

    let _tempPos: Vec3 = new Vec3(); // 复用临时坐标对象以优化性能
    /**
     * 获取或设置节点x坐标（世界坐标系）
     * @param node 目标节点
     * @param x 要设置的x坐标值（可选，不传时返回当前值）
     * @returns 当前/设置后的x坐标
     * @example
     * // 获取玩家x坐标
     * const playerX = no.x(this.playerNode);
     * 
     * // 设置敌人x坐标到屏幕右侧
     * no.x(this.enemyNode, 800);
     * 
     * // 配合缓动动画使用
     * no.tween(this.bulletNode)
     *   .to(0.5, { x: no.x(this.targetNode) })
     *   .start();
     */
    export function x(node: Node, x1?: number): number {
        if (!node) return;
        let { x, y } = node.position;
        if (x1 != undefined) {
            x = x1;
            node.setPosition(x, y);
        }
        return x;
    }

    /**
     * 获取或设置节点y坐标（世界坐标系）
     * @param node 目标节点
     * @param y 要设置的y坐标值（可选，不传时返回当前值）
     * @returns 当前/设置后的y坐标
     * @example
     * // 检测是否超出屏幕上方
     * if (no.y(this.itemNode) > 1280) {
     *   this.recycleItem();
     * }
     * 
     * // 设置跳跃高度
     * no.y(this.characterNode, 500);
     * 
     * // 垂直方向缓动
     * no.tween(this.cloudNode)
     *   .by(2, { y: -200 })
     *   .start();
     */
    export function y(node: Node, y1?: number): number {
        if (!node) return;
        let { x, y } = node.position;
        if (y1 != undefined) {
            y = y1;
            node.setPosition(x, y);
        }
        return y;
    }

    /**
     * 获取或设置节点z坐标（3D坐标系）
     * @param node 目标节点
     * @param z 要设置的z坐标值（可选，不传时返回当前值）
     * @returns 当前/设置后的z坐标
     * @example
     * // 设置3D物体的层级
     * no.z(this.backgroundModel, 100);
     * 
     * // 调整UI元素的显示层级
     * no.z(this.popupNode, 999);
     * 
     * // 创建视差滚动效果
     * update() {
     *   no.z(this.layer1, no.z(this.layer1) + delta * 0.1);
     *   no.z(this.layer2, no.z(this.layer2) + delta * 0.2);
     * }
     */
    export function z(node: Node, z1?: number): number {
        if (!node) return;
        let { x, y, z } = node.position;
        if (z1 != undefined) {
            z = z1;
            node.setPosition(x, y, z);
        }
        return z;
    }
    /**
     * 获取或设置节点在父容器中的渲染顺序（siblingIndex）
     * @param node 目标节点
     * @param index 要设置的顺序索引（0表示最底层，数值越大层级越高）。未提供时返回当前索引
     * @returns 当前/设置后的层级索引
     * @example
     * // 设置按钮为最顶层显示
     * no.siblingIndex(this.btnNode, this.btnNode.parent.children.length - 1);
     * 
     * // 动态调整UI元素层级
     * const currentIndex = no.siblingIndex(this.popupWindow);
     * no.siblingIndex(this.popupWindow, currentIndex + 1);
     * 
     * // 重置子节点顺序为添加顺序
     * parentNode.children.forEach((child, index) => {
     *   no.siblingIndex(child, index);
     * });
     */
    export function siblingIndex(node: Node, index?: number): number {
        if (!node) return;
        if (!node.parent?.['_children']) return 0;
        if (index != undefined) {
            node.setSiblingIndex(index);
            return index;
        }
        let p = node.parent['_children']?.findIndex(a => a.uuid == node.uuid) || 0;
        return p;
    }

    /**
     * 获取或设置节点世界坐标系位置（同时支持2D/3D坐标系）
     * @param node 目标节点
     * @param pos 要设置的三维坐标值（可选，未提供时返回当前坐标的克隆值）
     * @returns 当前/设置后的位置向量（返回新对象避免引用问题）
     * @example
     * // 设置敌人出生位置
     * no.position(this.enemyNode, no.v3(100, 200, 0));
     * 
     * // 获取玩家当前位置
     * const playerPos = no.position(this.playerNode);
     * 
     * // 实现位置缓动动画
     * no.tween(this.itemNode)
     *   .to(1, { position: no.v3(0, 100, 0) })
     *   .start();
     */
    export function position(node: Node, pos?: Vec3 | { x: number, y: number, z?: number }): Vec3 {
        if (!node) return;
        if (pos != undefined) {
            node.setPosition(pos.x, pos.y, pos.z);
        } else {
            return node.position;
        }
    }

    export function worldPosition(node: Node, pos?: Vec3 | { x: number, y: number, z?: number }): Vec3 {
        if (!node) return;
        if (pos != undefined) {
            node.setWorldPosition(pos.x, pos.y, pos.z || 0);
        } else {
            return node.worldPosition;
        }
    }

    /**
     * 获取或设置节点欧拉角旋转（单位：角度制）
     * @param node 目标节点
     * @param r 要设置的三轴旋转角度（可选，未提供时返回当前旋转的克隆值）
     * @returns 当前/设置后的欧拉角向量（返回新对象避免引用问题）
     * @example
     * // 设置3D模型旋转角度
     * no.rotation(this.airplaneModel, no.v3(0, 45, 0)); // Y轴旋转45度
     * 
     * // 实现持续旋转动画
     * update() {
     *   const currentRot = no.rotation(this.windmillNode);
     *   no.rotation(this.windmillNode, no.v3(0, currentRot.y + 1, 0));
     * }
     * 
     * // 重置2D精灵旋转角度
     * no.rotation(this.uiIcon, no.v3(0, 0, 0));
     */
    export function rotation(node: Node, r?: Vec3): Vec3 {
        if (!node) return;
        if (r != undefined) {
            node.setRotationFromEuler(r);
        }
        return node.eulerAngles.clone(); // 返回克隆保证数据安全
    }

    /**
     * 获取或设置节点宽度（需要节点包含UITransform组件）
     * @param node 目标节点
     * @param width 要设置的宽度值（可选，未提供时返回当前宽度）
     * @returns 当前/设置后的宽度值（单位：像素）
     * @example
     * // 设置按钮宽度为200像素
     * no.width(this.startBtn, 200);
     * 
     * // 根据文本内容动态调整宽度
     * const textWidth = this.label.node.getComponent(UITransform).width;
     * no.width(this.backgroundNode, textWidth + 40);
     * 
     * // 获取滚动视图的当前宽度
     * const viewWidth = no.width(this.scrollView.node);
     */
    export function width(node: Node, width?: number): number {
        if (!node || !node.getComponent(UITransform)) return;
        if (width != undefined)
            node.getComponent(UITransform).width = width;
        return node.getComponent(UITransform).width;
    }

    /**
     * 获取或设置节点高度（需要节点包含UITransform组件）
     * @param node 目标节点
     * @param height 要设置的高度值（可选，未提供时返回当前高度）
     * @returns 当前/设置后的高度值（单位：像素）
     * @example
     * // 设置对话框高度为屏幕高度的80%
     * no.height(this.dialogNode, no.winSize().height * 0.8);
     * 
     * // 动态扩展高度适应内容
     * const contentHeight = this.contentNode.getComponent(UITransform).height;
     * no.height(this.scrollContent, contentHeight + 100);
     * 
     * // 获取精灵图标的原始高度
     * const originalHeight = no.height(this.spriteNode);
     */
    export function height(node: Node, height?: number): number {
        if (!node || !node.getComponent(UITransform)) return;
        if (height != undefined)
            node.getComponent(UITransform).height = height;
        return node.getComponent(UITransform).height;
    }

    /**
     * 获取或设置节点尺寸（需要节点包含UITransform组件）
     * @param node 目标节点
     * @param size 要设置的尺寸对象（可选，未提供时返回当前尺寸的克隆）
     * @returns 当前/设置后的尺寸对象（返回新对象避免直接修改）
     * @example
     * // 同时设置宽高尺寸
     * no.size(this.avatarNode, new Size(120, 120));
     * 
     * // 根据图片原始尺寸调整节点
     * const textureSize = this.sprite.spriteFrame.originalSize;
     * no.size(this.imageNode, textureSize);
     * 
     * // 获取当前尺寸并等比放大
     * const currentSize = no.size(this.itemNode);
     * no.size(this.itemNode, currentSize.multiplyScalar(1.5));
     */
    export function size(node: Node, size?: Size | { width: number, height: number }): Size {
        if (!node || !node.getComponent(UITransform)) return;
        if (size != undefined)
            node.getComponent(UITransform).setContentSize(size.width, size.height);
        return node.getComponent(UITransform).contentSize.clone();
    }

    /**
     * 获取或设置节点透明度（自动添加UIOpacity组件）
     * @param node 目标节点
     * @param opacity 要设置的透明度（0-255，可选，未提供时返回当前值）
     * @returns 当前/设置后的透明度值
     * @example
     * // 渐隐效果实现
     * no.tween(this.fadeNode)
     *   .to(1, { opacity: 0 })
     *   .start();
     * 
     * // 半透明状态切换
     * const isTransparent = no.opacity(this.panelNode) < 255;
     * no.opacity(this.panelNode, isTransparent ? 255 : 150);
     * 
     * // 获取文字当前透明度
     * const textAlpha = no.opacity(this.titleLabel.node);
     */
    export function opacity(node: Node, opacity?: number): number {
        if (!node) return;
        let op = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        if (opacity != undefined) op.opacity = opacity;
        return op.opacity;
    }

    /**
     * 获取或设置节点锚点X坐标（基于UITransform组件）
     * @param node 目标节点
     * @param x 锚点X坐标（0-1，可选，未提供时返回当前值）
     * @returns 当前/设置后的锚点X坐标
     * @example
     * // 设置按钮右对齐
     * no.anchorX(this.btnNode, 1);
     * 
     * // 获取文本水平锚点用于居中计算
     * const anchorX = no.anchorX(this.labelNode);
     * this.labelNode.position.x = screenWidth * (0.5 - anchorX);
     */
    export function anchorX(node: Node, x?: number): number {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (x != undefined) t.anchorX = x;
        return t.anchorX;
    }

    /**
     * 获取或设置节点锚点Y坐标（基于UITransform组件）
     * @param node 目标节点
     * @param y 锚点Y坐标（0-1，可选，未提供时返回当前值）
     * @returns 当前/设置后的锚点Y坐标
     * @example
     * // 设置进度条底部对齐
     * no.anchorY(this.progressBar, 0);
     * 
     * // 动态调整弹窗垂直锚点
     * no.anchorY(this.popup, isTop ? 1 : 0.5);
     */
    export function anchorY(node: Node, y?: number): number {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (y != undefined) t.anchorY = y;
        return t.anchorY;
    }

    /**
     * 获取或设置节点锚点（支持同时设置X/Y坐标）
     * @param node 目标节点
     * @param args 参数格式：
     *            - 无参数：返回当前锚点
     *            - 单个数字：同时设置X/Y锚点
     *            - 两个数字：分别设置X/Y锚点
     * @returns 当前/设置后的锚点副本
     * @example
     * // 设置中心锚点
     * no.anchor(this.spriteNode, 0.5);
     * 
     * // 设置左上角锚点
     * no.anchor(this.uiPanel, 0, 1);
     * 
     * // 获取当前锚点用于计算
     * const currentAnchor = no.anchor(this.draggableItem);
     */
    export function anchor(node: Node, ...args: number[]): Vec2 {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (args != undefined && args.length > 0) t.setAnchorPoint(args[0], args[1] == null ? args[0] : args[1]);
        else return t.anchorPoint;
    }

    /**
     * 获取或设置节点的局部坐标系缩放比例
     * @param node 目标节点
     * @param scale 要设置的缩放值（可选，未提供时返回当前值）
     * @returns 当前/设置后的缩放值副本（Vec3类型）
     * @example
     * // 设置节点缩放为2倍
     * no.scale(this.spriteNode, v3(2, 2, 1));
     * 
     * // 获取当前缩放值用于计算
     * const currentScale = no.scale(this.playerNode);
     * 
     * // 配合缓动动画实现缩放效果
     * no.tween(this.popupNode)
     *   .to(0.3, { scale: v3(1.2, 1.2) })
     *   .start();
     * 
     * // 处理空节点情况
     * const nodeScale = no.scale(null); // 返回undefined
     */
    export function scale(node: Node, scale?: Vec3): Vec3 {
        if (!node) return;
        if (scale != undefined)
            node.scale = scale;
        return node.scale.clone();
    }

    /**
     * 获取节点在层级关系中的原始缩放值（不受父节点缩放影响）
     * @param node 目标节点
     * @returns 节点在层级中的原始缩放值（Vec3类型）
     * @example
     * // 获取UI元素的原始缩放
     * const originalScale = no.scaleInHierarchy(this.uiElement);
     * 
     * // 重置节点缩放
     * this.node.scale = no.scaleInHierarchy(this.node);
     * 
     * // 比较世界缩放与原始缩放
     * const worldScale = this.node.worldScale;
     * const localScale = no.scaleInHierarchy(this.node);
     */
    export function scaleInHierarchy(node: Node) {
        return node['_scale'];
    }

    /**
     * 获取节点及其所有激活子节点在世界坐标系中的包围矩形
     * @param node 目标节点
     * @returns 世界坐标系中的包围矩形（Rect类型）
     * @example
     * // 检测玩家与障碍物的碰撞
     * const playerBox = no.boundingBox(this.playerNode);
     * const obstacleBox = no.boundingBox(this.rockNode);
     * if (playerBox.intersects(obstacleBox)) {
     *   this.onCollision();
     * }
     * 
     * // 计算UI容器总尺寸
     * const containerRect = no.boundingBox(this.scrollContent);
     * this.label.string = `尺寸：${containerRect.width.toFixed(0)}x${containerRect.height.toFixed(0)}`;
     * 
     * // 屏幕边缘检测
     * const screenRect = new Rect(0, 0, screen.width, screen.height);
     * if (!screenRect.contains(no.boundingBox(this.enemyNode))) {
     *   this.destroyEnemy();
     * }
     */
    export function boundingBox(node: Node): Rect {
        return node.getComponent(UITransform).getBoundingBoxToWorld();
    }

    /**
     * 解析包含函数定义的JSON字符串（微信小游戏平台不支持函数解析）
     * @param s - 需要解析的JSON字符串，支持包含function定义
     * @returns 解析后的JavaScript对象，包含还原的函数定义
     * @example
     * // 解析带函数的配置数据
     * const config = parse2Json(`{
     *   "name": "武器系统",
     *   "attack": function(base) { return base * 1.5 }
     * }`);
     * const damage = config.attack(100); // 150
     * 
     * // 处理无效JSON字符串
     * parse2Json('{invalid json}'); // 输出错误日志并返回null
     * 
     * // 微信小游戏平台行为差异
     * parse2Json('{"func": function(){}}'); // 微信平台返回普通对象，其他平台保留函数
     */
    export function parse2Json(s: string): any {
        if (s == '') return {};
        if (sys.platform != sys.Platform.WECHAT_GAME) {//微信小游戏平台不支持
            try {
                return JSON.parse(s, function (k, v) {
                    if (v && v.indexOf && v.indexOf('function') > -1) {
                        // return eval("(function(){return " + v + " })()");
                        let FN = Function;
                        return new FN(`return ${v}`)();
                    }
                    return v;
                });
            } catch (e) {
                err('JSON.parse', 'parse2Json', s);
                return null;
            }
        } else return JSON.parse(s);
    }

    /**
     * 序列化包含函数的JSON对象（微信小游戏平台不支持函数序列化）
     * @param json - 需要序列化的对象，可以包含函数定义
     * @returns 序列化后的JSON字符串，函数会被转换为字符串形式
     * @example
     * // 序列化带函数的对象
     * const obj = {
     *   calculate: (a, b) => a + b,
     *   data: [1, 2, 3]
     * };
     * jsonStringify(obj); // 返回'{"calculate":"(a, b) => a + b","data":[1,2,3]}'
     * 
     * // 处理循环引用
     * const circularObj = { a: 1 };
     * circularObj.self = circularObj;
     * jsonStringify(circularObj); // 自动移除循环引用
     * 
     * // 微信平台行为差异
     * jsonStringify({ func: () => {} }); // 微信平台返回'{}'
     */
    export function jsonStringify(json: any): string {
        if (json == null) return '';
        let cache: any[] = [];
        return JSON.stringify(json, function (key, val) {
            if (!WECHAT)//微信小游戏平台不支持
                if (typeof val === 'function') {
                    return val + '';
                }
            if (typeof val === 'object' && val !== null) {
                if (cache.indexOf(val) !== -1) {
                    // 移除
                    return;
                }
                // 收集所有的值
                cache.push(val);
            }
            return val;
        });

    }

    /**
     * 计算阶乘（递归实现，n >= 0）
     * @param n - 要计算的阶数
     * @returns n的阶乘结果
     * @example
     * factorial(5); // 120
     * factorial(0); // 1
     * factorial(10); // 3628800
     */
    export function factorial(n: number): number {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }

    /**
     * 计算组合数C(n, i)（n个元素取i个的组合数）
     * @param n - 元素总数（n >= 0）
     * @param i - 选取数量（i <= n）
     * @returns 组合数计算结果
     * @example
     * combination(5, 2); // 10
     * combination(10, 3); // 120
     * combination(4, 4); // 1
     * 
     * // 参数错误示例
     * combination(3, 5); // 返回NaN（因n-i为负数）
     */
    export function combination(n: number, i: number): number {
        let _1 = factorial(n),
            _2 = factorial(i),
            _3 = factorial(n - i);
        return _1 / _2 / _3;
    }

    /**
     * 检查数据是否需要重置（用于定时/每日重置类数据管理）
     * @param dataKey 数据key（本地缓存中的键名）
     * @param value 重置后的数据值
     * @param time 重置时间间隔（秒）或每日重置时间点（当isInterval=false时）
     * @param isInterval 时间模式：true=间隔时间模式（从当前时间开始计算），false=每日重置模式（基于当天0点计算）。默认false
     * @example
     * // 每日凌晨重置签到状态
     * resetValueCheck('last_sign_time', 0, 86400);
     * 
     * // 每30分钟重置挑战次数
     * resetValueCheck('challenge_count', 5, 1800, true);
     * 
     * // 重置玩家引导状态（每天8点重置）
     * const eightHour = 8 * 60 * 60;
     * resetValueCheck('guide_step', 0, eightHour);
     */
    export function resetValueCheck(dataKey: string, value: any, time: number, isInterval = false) {
        try {
            let now = sysTime.now;
            let lastResetTime = parse2Json(dataCache.getLocal('reset_data_check_time') || '{}');
            let lt = lastResetTime[dataKey];

            if (!lt || now >= lt) {
                dataCache.setLocal(dataKey, value);
                if (isInterval) {
                    lastResetTime[dataKey] = now + time;
                } else {
                    let t = zeroTimestamp() + time;
                    //如果重置时间点已过，则延长到下一天
                    if (t < now) t += 86400;
                    lastResetTime[dataKey] = t;
                }
                dataCache.setLocal('reset_data_check_time', jsonStringify(lastResetTime));
                return true;
            } else {
                return dataCache.getLocal(dataKey) == value;
            }
        } catch (e) {
            no.err('JSON.parse', 'resetValueCheck');
            return false;
        }
    }

    /**
     * 数字精度转换（解决浮点数计算精度问题）
     * @param v 需要处理的数字
     * @param x 保留的小数位数（默认12位）
     * @returns 精确处理后的数字
     * @example
     * float(0.1 + 0.2)          // 0.3
     * float(1.2345678901234)    // 1.234567890123
     * float(Math.PI, 4)         // 3.1416
     * float(2.0000000000001)    // 2
     */
    export function float(v: number, x = 12): number {
        let a = Math.pow(10, 12),
            b = Math.pow(10, 12 - x),
            c = Math.pow(10, x);
        return Math.floor(Math.ceil(v * a) / b) / c;
    }

    /**
     * 从父节点层级链获取组件实例（递归向上查找）
     * @param self 起始节点（搜索起点）
     * @param comp 组件类型（支持类名或组件类）
     * @returns 找到的组件实例，未找到返回null
     * @example
     * // 查找最近的UIManager组件
     * const uiManager = getComponentInParents(this.node, 'UIManager');
     * 
     * // 查找角色控制器组件
     * const controller = getComponentInParents(characterNode, CharacterController);
     * 
     * // 在子弹节点上查找武器组件
     * const weaponComp = getComponentInParents(bullet.node, WeaponComponent);
     */
    export function getComponentInParents<T extends Component>(self: Node, comp: string | typeof Component): T {
        if (typeof comp == 'string') {
            comp = js.getClassByName(comp) as (typeof Component);
        }
        let c = self.getComponent(comp);
        if (c) return c as T;

        if (self.parent) {
            c = self.parent.getComponent(comp);
            if (!c) return getComponentInParents(self.parent, comp);
            else return c as T;
        }
        return null;
    }

    /**
     * 在父节点链中查找指定名称的节点（向上查找）
     * @param self 起始节点（搜索起点）
     * @param nodeName 需要查找的目标节点名称
     * @returns 找到的节点实例，未找到返回null
     * @example
     * // 在UI层级中查找公共父容器
     * const sharedContainer = no.getNodeInParents(this.node, 'SharedUI');
     * 
     * // 查找敌人血条节点
     * const hpBar = no.getNodeInParents(enemyNode, 'EnemyHPBar');
     * 
     * // 在嵌套结构中查找根节点
     * const rootNode = no.getNodeInParents(this.node.parent, 'SceneRoot');
     */
    export function getNodeInParents(self: Node, nodeName: string): Node | null {
        if (self.parent) {
            let c = self.parent.getChildByName(nodeName);
            if (!c) return getNodeInParents(self.parent, nodeName);
            else return c;
        }
        return null;
    }

    /**
     * 递归查找子节点（深度优先搜索）
     * @param self 起始节点（搜索起点）
     * @param nodeName 需要查找的目标节点名称
     * @returns 找到的节点实例，未找到返回null
     * @example
     * // 查找嵌套在多层容器中的按钮
     * const btnAttack = no.getChildByNameRecursion(this.node, 'BtnAttack');
     * 
     * // 在角色装备树中查找特定部件
     * const weaponSlot = no.getChildByNameRecursion(characterNode, 'WeaponSlot');
     * 
     * // 查找场景中的特效节点
     * const fireEffect = no.getChildByNameRecursion(sceneRoot, 'FireEffect');
     */
    export function getChildByNameRecursion(self: Node, nodeName: string): Node | null {
        let c = self.getChildByName(nodeName);
        if (!c) {
            for (let i = 0, n = self.children.length; i < n; i++) {
                c = getChildByNameRecursion(self.children[i], nodeName);
                if (c) break;
            }
        }
        return c;
    }

    /**
     * 基础数据管理类（支持数据变更事件、路径访问、JSON序列化）
     * @example
     * // 基本使用
     * const data = new no.Data();
     * data.onChange(() => console.log('Data changed!'));
     * data.set('player.name', 'Alice');
     * 
     * // 从JSON初始化
     * data.json = '{"score":100,"items":["sword"]}';
     * console.log(data.get('score')); // 100
     * 
     * // 复杂对象操作
     * data.set('config.difficulty', { level: 'hard', enemies: 10 });
     * data.delete('config.difficulty.level');
     */
    export class Data extends Event {
        /** 数据变更事件名称 */
        public static DataChangeEvent = 'data_change_event';

        private _data: any = {};
        private _updateScheduled: boolean = false;
        /** 是否需要更新数据变更事件 */
        public needUpdateDataChangeEvent: boolean = false;

        /** 获取原始数据对象 */
        public get data(): any {
            return this._data;
        }

        /** 
         * 设置完整数据并触发变更事件 
         * @example
         * data.data = { coins: 500, hp: 100 };
         */
        public set data(v: any) {
            this._data = v;
            this.emit(Data.DataChangeEvent, this);
        }

        /** 
         * 获取JSON字符串（自动添加时间戳） 
         * @example
         * // 输出：{"coins":200,"__ut":1625097600000}
         * console.log(data.json);
         */
        public get json(): string {
            let a = clone(this._data);
            a.__ut = sysTime.now;
            return jsonStringify(a);
        }

        /** 
         * 从JSON字符串/对象加载数据 
         * @example
         * // 从字符串加载
         * data.json = '{"level":5}';
         * // 从对象加载
         * data.json = { achievements: ['first_blood'] };
         */
        public set json(v: any) {
            if (v != undefined) {
                try {
                    if (typeof v == 'string')
                        this._data = parse2Json(v);
                    else this._data = v;
                    this.emit(Data.DataChangeEvent, this);
                } catch (e) {
                    no.err('JSON.parse', 'Data.json', js.getClassName(this), v);
                }
            }
        }

        /**
         * 读取数据（支持点路径和数组路径）
         * @param paths 数据路径（支持字符串或数组格式）
         * @example
         * // 获取嵌套数据
         * data.set('player.stats', { hp: 100, mp: 50 });
         * console.log(data.get('player.stats.hp')); // 100
         * 
         * // 使用数组路径
         * console.log(data.get(['player', 'stats', 'mp'])); // 50
         */
        public get(paths?: string | string[]): any {
            if (paths == null || paths == '*') return this._data;
            if (paths instanceof Array) {
                paths = paths.join('.');
            }
            return getValue(this._data, paths);
        }

        /**
         * 写入数据（支持递归设置对象）
         * @param path 数据路径
         * @param value 要设置的值（null值会被忽略）
         * @param recursive 是否递归设置对象属性（默认true）
         * @example
         * // 简单值设置
         * data.set('volume', 0.8);
         * 
         * // 递归设置对象
         * data.set('settings', { audio: { music: true }, graphics: 'high' });
         * 
         * // 禁用递归直接覆盖
         * data.set('inventory', ['sword'], false);
         */
        public set(path: string, value: any, recursive = true) {
            if (recursive && value instanceof Object && value['constructor'] === Object) {
                if (Object.keys(value).length == 0) {
                    setValue(this._data, path, value);
                } else {
                    for (let key in value) {
                        let v = value[key];
                        this.set(path + '.' + key, v);
                    }
                }
            } else {
                setValue(this._data, path, value);
            }
            this._scheduleUpdate();
            return this;
        }

        /**
         * 直接设置键值对（不进行递归处理）
         * @example
         * data.setKV('temp', { x: 10, y: 20 });
         * console.log(data.get('temp.x')); // undefined
         */
        public setKV(k: string, v: any) {
            setValue(this._data, k, v);
            return this;
        }

        /** 延迟更新调度（避免频繁触发变更事件） */
        private _scheduleUpdate(): void {
            if (!this.needUpdateDataChangeEvent || this._updateScheduled) return;

            this._updateScheduled = true;
            // requestAnimationFrame(() => {
            //     this.emit(Data.DataChangeEvent, this);
            //     this._updateScheduled = false;
            // });
            setTimeout(() => {
                this.emit(Data.DataChangeEvent, this);
                this._updateScheduled = false;
            }, 100);
        }

        /**
         * 检查数据路径是否存在
         * @example
         * console.log(data.has('player.name')); // false
         * data.set('player.name', 'Bob');
         * console.log(data.has('player.name')); // true
         */
        public has(paths?: string | string[]): boolean {
            return !!this.get(paths);
        }

        /**
         * 删除指定路径数据
         * @example
         * data.set('temp.value', 100);
         * data.delete('temp.value');
         * console.log(data.get('temp')); // {}
         */
        public delete(path: string): any {
            return deleteValue(this._data, path);
        }

        /** 清空所有数据 */
        public clear(): void {
            this._data = {};
        }

        /**
         * 遍历所有数据键值对
         * @example
         * data.set('a', 1);
         * data.set('b', 2);
         * data.enumerate((k, v) => console.log(k, v)); 
         * // 输出: a 1
         * //      b 2
         */
        public enumerate(handler: (k: string, v: any) => void) {
            for (const key in this._data) {
                handler(key, this._data[key]);
            }
        }

        /**
         * 注册数据变更监听
         * @example
         * data.onChange((d) => {
         *   console.log('New data:', d.data);
         * }, this);
         */
        public onChange(handler: (d?: Data) => void, target?: any): void {
            this.needUpdateDataChangeEvent = true;
            this.on(Data.DataChangeEvent, handler, target);
        }

        /** 移除数据变更监听 */
        public offChange(handler: (d?: Data) => void, target?: any): void {
            this.off(Data.DataChangeEvent, handler, target);
            if (this.isEmpty()) this.needUpdateDataChangeEvent = false;
        }

        /** 手动触发数据变更事件 */
        public triggerChange() {
            this.emit(Data.DataChangeEvent, this);
        }
    }

    /**
     * 状态数据类（用于管理衍生状态数据，自动追踪依赖关系并通过update()更新）
     * 
     * @example <caption>基本用法</caption>
     * // 创建状态实例
     * const status = no.StatusData.new();
     * 
     * // 添加衍生状态（当角色属性变化时需要更新）
     * status.add('attackPower', () => {
     *   return player.strength * 2 + player.weapon.atk;
     * });
     * 
     * // 添加组合状态（依赖多个数据源）
     * status.add('totalScore', () => {
     *   return game.score + game.bonus * 1.5;
     * });
     * 
     * // 当基础数据变化后，手动触发更新
     * player.strength += 10;
     * status.update('attackPower');
     * 
     * // 获取最新状态值
     * console.log(status.get('attackPower'));
     */
    export class StatusData {
        /** 存储计算函数映射表 { [key: string]: () => any } */
        private _map: any = {};
        /** 缓存计算结果 { [key: string]: any } */
        private _data: any = {};

        /** 工厂方法创建实例 */
        public static new() {
            return new StatusData();
        }

        /**
         * 添加/更新状态计算规则
         * @param dataKey 状态键名
         * @param valueFunc 计算函数（需返回状态值）
         * @example
         * // 添加移动速度计算（依赖敏捷属性和装备加成）
         * status.add('moveSpeed', () => {
         *   return (char.agility + char.equipments.shoes.speed) * 0.8;
         * });
         */
        public add(dataKey: string, valueFunc: () => any) {
            this._map[dataKey] = valueFunc;
            this._data[dataKey] = valueFunc();
        }

        /**
         * 获取状态当前值
         * @param key 要获取的状态键名
         * @returns 缓存的状态值
         * @example
         * // 获取实时战斗评分
         * const combatScore = status.get('combatRating');
         */
        public get(key: string) {
            return this._data[key];
        }

        /**
         * 更新指定状态值（重新执行计算函数）
         * @param keys 要更新的键名（支持字符串或数组）
         * @example
         * // 更新单个状态
         * status.update('attackPower');
         * 
         * // 批量更新多个状态
         * status.update(['moveSpeed', 'defenseRate']);
         */
        public update(keys: string | string[]) {
            keys = [].concat(keys);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                if (this._map[key]) {
                    this._data[key] = this._map[key]?.();
                }
            }
        }
    }

    /**
     * 数据缓存类（支持本地存储、JSON配置、全局临时数据管理）
     * 
     * 功能特性：
     * - 本地存储：使用localStorage进行持久化存储，支持自动JSON序列化/反序列化
     * - 配置管理：支持结构化JSON数据存取，支持路径访问（a.b.c格式）
     * - 临时数据：内存级数据存储，生命周期与页面会话一致
     * - 事件通知：数据变更时触发对应事件
     * 
     * @example
     * // 初始化数据缓存实例
     * const cache = new DataCache();
     * 
     * // 设置本地存储前缀（多账户隔离）
     * cache.localPreKey = 'player_001';
     */
    export class DataCache extends EventTarget {
        private _json: Data;    // JSON配置数据存储
        private _tmp: Data;     // 全局临时数据存储
        private _localPreKey: string = '';  // 本地存储前缀（用于多账户隔离）

        constructor() {
            super();
            this._json = new Data();  // 初始化JSON配置存储
            this._tmp = new Data();   // 初始化临时数据存储
        }

        /** 
         * 本地数据前缀（用于多账户数据隔离）
         * @example
         * // 设置玩家专属前缀
         * dataCache.localPreKey = `user_${userId}`;
         * 
         * // 读取当前前缀
         * const currentPrefix = dataCache.localPreKey;
         */
        public get localPreKey(): string {
            return this._localPreKey;
        }

        public set localPreKey(v: string) {
            this._localPreKey = v;
        }

        /**
         * 获取本地存储数据（自动反序列化）
         * @param key - 存储键名（无需包含前缀）
         * @param defaultVal - 当数据不存在时返回的默认值
         * @returns 解析后的数据对象或默认值
         * @example
         * // 获取玩家设置
         * const settings = dataCache.getLocal('game_settings');
         * 
         * // 带默认值的获取
         * const volume = dataCache.getLocal('audio_volume', 0.5);
         */
        public getLocal(key: string, defaultVal?: any): any {
            key = `${this._localPreKey}_${key}`;
            let a = localStorage.getItem(key);
            if (a == '' || a == null || a == undefined || a == 'undefined') return defaultVal;
            try {
                return parse2Json(a);
            } catch (e) {
                no.err('JSON.parse', 'getLocal', key, a);
                return null;
            }
        }

        /**
         * 写入本地存储数据（自动序列化）
         * @param key - 存储键名（无需包含前缀）
         * @param value - 要存储的值（支持对象、数组等可序列化数据）
         * @example
         * // 存储简单值
         * dataCache.setLocal('last_login', Date.now());
         * 
         * // 存储复杂对象
         * dataCache.setLocal('player_state', {
         *   hp: 100,
         *   position: [x, y, z],
         *   inventory: ['sword', 'potion']
         * });
         */
        public setLocal(key: string, value: any): void {
            key = `${this._localPreKey}_${key}`;
            if (value === null || value === undefined || value === 'undefined')
                localStorage.removeItem(key);
            else
                localStorage.setItem(key, jsonStringify(value));
            this.emit(key, value);
        }

        /**
         * 删除指定本地存储项
         * @param key - 要删除的键名（无需包含前缀）
         * @example
         * // 清除单个设置项
         * dataCache.deleteLocal('debug_mode');
         */
        public deleteLocal(key: string) {
            key = `${this._localPreKey}_${key}`;
            localStorage.removeItem(key);
        }

        /**
         * 清空所有本地存储数据（慎用！）
         * @example
         * // 重置玩家所有本地数据
         * dataCache.clearLocal();
         */
        public clearLocal() {
            localStorage.clear();
        }

        /**
         * 获取结构化配置数据（支持路径访问）
         * @param path - 数据路径（支持点分格式或数组格式）
         * @returns 配置数据或undefined
         * @example
         * // 获取嵌套配置
         * const enemyConfig = dataCache.getJSON('game_config.enemies.zombie');
         * 
         * // 使用数组路径
         * const weaponStats = dataCache.getJSON(['equipment', 'weapons', 'sword']);
         */
        public getJSON(path?: string | string[], defaultVal?: any): any {
            const a = this._json.get(path);
            if (a == null) err('配置数据不存在：', path);
            return a ?? defaultVal;
        }

        /**
         * 批量更新配置数据
         * @param json - 要合并的配置对象
         * @example
         * // 初始化游戏配置
         * dataCache.setJSON({
         *   difficulty: {
         *     easy: { enemyCount: 10 },
         *     hard: { enemyCount: 30 }
         *   },
         *   physics: {
         *     gravity: 9.8
         *   }
         * });
         */
        public setJSON(json: Object): void {
            forEachKV(json, (key, value) => {
                this._json.setKV(key, value);
                return false;
            });
        }

        public deleteJSON(key: string): void {
            this._json.delete(key);
        }

        /**
         * 获取全局临时数据值
         * @param key - 临时数据键名
         * @returns 存储的值或undefined
         * @example
         * // 获取临时得分
         * const score = dataCache.getTmpValue('current_score');
         */
        public getTmpValue(key: string): any {
            return this._tmp.get(key);
        }

        /**
         * 设置全局临时数据（非持久化存储）
         * @param key - 临时数据键名
         * @param value - 要存储的值（null表示删除）
         * @example
         * // 存储玩家当前会话得分
         * dataCache.setTmpValue('current_score', 1500);
         * 
         * // 存储临时标记
         * dataCache.setTmpValue('tutorial_complete', true);
         * 
         * // 删除临时数据
         * dataCache.setTmpValue('temp_marker', null);
         */
        public setTmpValue(key: string, value: any): void {
            if (value == null) {
                this._tmp.delete(key);
            } else {
                this._tmp.set(key, clone(value));
            }
            this.emit(key, value);
        }
    }

    /**全局数据缓存单例 */
    export const dataCache = new DataCache();


    /**资源管理 */

    export type AssetPath = { bundle?: string, path?: string, file?: string, type?: typeof Asset };
    export class AssetBundleManager {

        // 远程资源缓存（键：资源路径，值：资源对象）
        private remoteAssetsCache: { [url: string]: { asset: Asset, t: number, ref: number, loading: boolean, cbs: ((sf: SpriteFrame | null) => void)[] } } = {};
        // 资源缓存映射表（键：资源路径，值：资源实例）
        private _cacheAsset: Map<string, Asset> = new Map();
        // 资源引用计数与时间戳（用于资源回收）
        private _cacheAssetRef: { [k: string]: { ref: number, time: number } } = {};
        // TTF字体缓存（键：字体名称，值：字体资源）
        private _ttfFont: { [fontFamily: string]: TTFFont } = {};
        // 资源路径到UUID的映射（用于快速查找）
        private _pathToUuid: Map<string, string> = new Map();
        // 正在加载中的资源列表（键：资源路径，值：加载状态）
        private _loadingAssets: Map<string, number> = new Map();

        /**
         * 获取/设置资源服务器地址
         * @example
         * // 获取当前资源服务器地址
         * const currentServer = assetBundleManager.server;
         * 
         * // 设置远程资源服务器
         * assetBundleManager.server = 'https://cdn.example.com/game-assets/';
         */
        public get server(): string {
            return assetManager.downloader.remoteServerAddress;
        }

        public set server(v: string) {
            assetManager.downloader['_remoteServerAddress'] = v;
        }

        /**
         * 获取所有远程资源包列表
         * @example
         * // 获取所有远程资源包名称
         * const bundles = assetBundleManager.remoteBundles;
         * console.log(bundles); // ['characters', 'scenes', 'effects']
         */
        public get remoteBundles(): readonly string[] {
            return assetManager.downloader.remoteBundles;
        }

        /**
         * 检查是否为远程资源包
         * @param bundleName - 资源包名称
         * @example
         * // 检查角色包是否为远程资源
         * const isRemote = assetBundleManager.isRemoteBundle('characters');
         */
        public isRemoteBundle(bundleName: string): boolean {
            return this.remoteBundles.includes(bundleName);
        }

        /**
         * 获取资源包版本号
         * @param bundleName - 资源包名称
         * @example
         * // 获取主资源包版本
         * const version = assetBundleManager.bundleVer('main');
         * console.log(version); // '1.2.3'
         */
        public bundleVer(bundleName: string): string {
            return assetManager.downloader.bundleVers[bundleName];
        }

        /**
         * 获取完整资源包URL
         * @param bundleName - 资源包名称
         * @example
         * // 获取远程角色包URL
         * const url = assetBundleManager.bundleUrl('characters');
         * // 返回：'https://cdn.example.com/game-assets/remote/characters'
         * 
         * // 获取本地UI包路径
         * const localPath = assetBundleManager.bundleUrl('ui');
         * // 返回：'ui'
         */
        public bundleUrl(bundleName: string): string {
            if (this.isRemoteBundle(bundleName)) {
                return this.server + pathjoin('remote', bundleName);
            }
            return bundleName;
        }

        /**
         * 检查资源是否已缓存
         * @param path - 资源路径
         * @example
         * // 检查玩家模型是否已加载
         * if (assetBundleManager.hasAsset('player/model')) {
         *   // 使用缓存资源...
         * }
         */
        public hasAsset(path: string): boolean {
            return this._pathToUuid.has(path);
        }

        /**
         * 从缓存加载资源（增加引用计数）
         * @param path - 资源路径
         * @returns 资源实例或null
         * @example
         * // 加载UI按钮资源
         * const buttonAsset = assetBundleManager.loadInCache('ui/button');
         * if (buttonAsset) {
         *   const buttonNode = instantiate(buttonAsset);
         *   // 使用完成后需要调用release...
         * }
         * 
         * // 注意：调用方需负责释放资源引用
         */
        public loadInCache(path: string) {
            const uuid = this._pathToUuid.get(path);
            if (uuid) {
                const asset = assetManager.assets.get(uuid);
                asset.addRef();
                return asset;
            }
            return null;
        }

        /**
         * 设置资源加载状态（用于处理并发加载同一资源的情况）
         * @param path 资源路径
         * @example
         * // 在开始加载资源前标记加载状态
         * if (!assetBundleManager.isAssetLoading('characters/hero')) {
         *   assetBundleManager.loadingAsset('characters/hero');
         *   this.loadRemoteAsset('characters/hero', (err, asset) => { ... });
         * }
         */
        public loadingAsset(path: string) {
            this._loadingAssets.set(path, 1);
        }

        /**
         * 检查资源是否正在加载中
         * @param path 资源路径
         * @returns 是否正在加载
         * @example
         * // 避免重复加载正在请求的资源
         * if (assetBundleManager.isAssetLoading('effects/fire')) {
         *   return; // 已有加载中的请求
         * }
         */
        public isAssetLoading(path: string): boolean {
            return this._loadingAssets.has(path);
        }

        /**
         * 标记资源加载完成（无论成功失败都需要调用）
         * @param path 资源路径
         * @example
         * // 在加载回调中始终调用结束标记
         * loadRemoteAsset('bgm/battle', (err, clip) => {
         *   assetBundleManager.assetLoadingEnd('bgm/battle');
         *   // ...处理资源
         * });
         */
        public assetLoadingEnd(path: string) {
            this._loadingAssets.delete(path);
        }

        /**
         * 清空所有缓存资源（切换场景时建议调用）
         * @example
         * // 切换关卡时清理缓存
         * onLevelChange() {
         *   assetBundleManager.clearCachedAssets();
         *   // ...其他清理逻辑
         * }
         */
        public clearCachedAssets() {
            for (const [key, asset] of this._cacheAsset) {
                this.release(asset, true);
            }
            this._cacheAsset.clear();
        }

        public clearBundle(name: string) {
            const bundle = this.getLoadedBundle(name);
            if (bundle == null) return;
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
        }

        /**
         * 顺序预加载多个资源包（支持进度回调）
         * @param paths 需要加载的bundle路径数组
         * @param onProgress 加载进度回调（0-1）
         * @example
         * // 预加载游戏核心资源
         * const bundles = ['base-res', 'characters', 'ui'];
         * assetBundleManager.loadBundles(bundles, (progress) => {
         *   this.loadingBar.progress = progress; // 更新进度条
         * });
         * 
         * // 加载单个bundle
         * assetBundleManager.loadBundles(['dialogue'], null);
         */
        public loadBundles(paths: string[], onProgress: (progress: number) => void): void {
            if (paths == null) {
                onProgress && onProgress(1);
                return;
            }
            this._loadB(paths, 0, onProgress);
        }

        /**
         * 递归加载bundle的内部实现
         * @param paths 所有需要加载的路径数组
         * @param i 当前加载的索引
         * @param callback 进度回调函数
         */
        private _loadB(paths: string[], i: number, callback: (p: number) => void) {
            let p = paths[i];
            let n = paths.length;
            this.loadBundle(p, () => {
                i++;
                callback?.(i / n);
                i < n && this._loadB(paths, i, callback);
            });
        }
        /**
         * 预加载指定资源包内的多个文件资源
         * @param bundleName - 资源包名称（如'characters'、'ui'）
         * @param filePaths - 需要预加载的资源路径数组（相对于资源包的路径）
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 预加载角色包中的纹理和动画资源
         * assetBundleManager.preloadFiles('characters', [
         *   'textures/hero_01',
         *   'animations/attack'
         * ], (p) => {
         *   console.log(`加载进度：${(p * 100).toFixed(1)}%`);
         * });
         * 
         * // 预加载UI包中的多个音效文件
         * assetBundleManager.preloadFiles('ui', [
         *   'sounds/click',
         *   'sounds/notification'
         * ], null);
         */
        public preloadFiles(bundleName: string, filePaths: string[], onProgress?: (progress: number) => void): void {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle == null) {
                this.loadBundle(bundleName, () => {
                    this.preloadFiles(bundleName, filePaths, onProgress);
                });
            } else {
                bundle.preload(filePaths, Asset, (finished, total, item) => {
                    onProgress && onProgress(finished / total);
                }, (e, items) => {
                    if (e) err('preloadFiles', e.message);
                });
            }
        }

        /**
         * 通用预加载方法（支持混合类型资源加载）
         * @param requests - 预加载请求数组，支持以下格式：
         *   - uuid: 资源唯一标识符
         *   - url: 远程资源地址
         *   - path: 本地资源路径（格式：'bundle/path/to/asset'）
         *   - dir: 目录路径（加载整个目录）
         *   - scene: 场景名称
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 同时预加载场景、目录和单个资源
         * assetBundleManager.preloadAny([
         *   { scene: 'Level2' },
         *   { dir: 'models/enemies' },
         *   { path: 'effects/fire' }
         * ], (p) => {
         *   this.loadingLabel.string = `资源加载中 ${p * 100}%`;
         * });
         * 
         * // 预加载远程服务器资源
         * assetBundleManager.preloadAny([
         *   { url: 'https://cdn.example.com/weapons/sword.png' }
         * ], null);
         */
        public preloadAny(requests: {
            uuid?: string,
            url?: string,
            path?: string,
            dir?: string,
            scene?: string
        }[], onProgress: (progress: number) => void): void {
            assetManager.preloadAny(requests, (finished, total, requestItem) => {
                onProgress && onProgress(finished / total);
            }, (e, items) => {
                if (items == null || items.length == 0) {
                    onProgress && onProgress(1);
                    err('preloadAny', requests, e.message);
                }
            });
        }

        /**
         * 预加载指定场景资源
         * @param name - 场景名称（需在构建配置中存在的场景）
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 预加载关卡场景并在完成后跳转
         * assetBundleManager.preloadScene('Level3', (progress) => {
         *   this.progressBar.width = 300 * progress;
         * });
         * 
         * // 静默预加载主菜单场景
         * assetBundleManager.preloadScene('MainMenu', null);
         */
        public preloadScene(name: string, onProgress: (progress: number) => void): void {
            director.preloadScene(name, (finished, total, item) => {
                // 引擎暂不提供精确进度，保留占位符
            }, (err) => {
                if (err) {
                    log('preloadScene', name, err.message);
                } else {
                    onProgress && onProgress(1);
                }
            });
        }
        /**
         * 加载资源包（支持本地/远程资源包）
         * @param name - 资源包名称或远程URL地址
         * @param callback - 加载完成回调函数
         * @param force - 是否强制重新加载（默认false）
         * @example
         * // 加载本地resources包
         * assetBundleManager.loadBundle('resources', (bundle) => {
         *   console.log('Bundle loaded:', bundle.name);
         * });
         * 
         * // 强制重新加载远程包
         * assetBundleManager.loadBundle('https://cdn.example.com/characters', (b) => {
         *   this.loadCharacterAssets();
         * }, true);
         * 
         * // 加载配置表包
         * assetBundleManager.loadBundle('configs', null);
         */
        public loadBundle(name: string, callback?: (bundle: Bundle) => void, force = false): void {
            let bundle = this.getLoadedBundle(name);
            if (bundle != null) {
                if (force) assetManager.removeBundle(bundle);
                else {
                    callback?.(bundle);
                    return;
                }
            }
            const url = this.bundleUrl(name);
            log('load bundle', name, url);
            if (!url) {
                callback?.(null);
                return;
            }
            assetManager.loadBundle(url, { scriptAsyncLoading: false }, (e, b) => {
                log('load bundle end', url, e);
                if (e != null) {
                    err('loadBundle', url, e.message);
                } else {
                    callback?.(b);
                }
            });
        }

        /**
         * 获取已加载的资源包实例
         * @param name - 资源包名称
         * @returns 已加载的资源包对象，未找到返回null
         * @example
         * // 获取已加载的UI包
         * const uiBundle = assetBundleManager.getLoadedBundle('ui');
         * if (uiBundle) {
         *   this.loadUIComponents();
         * }
         */
        public getLoadedBundle(name: string): Bundle {
            const a = assetManager.getBundle(name);
            if (!a) {
                err(`getLoadedBundle 包${name}未加载`);
            }
            return a;
        }

        /**
         * 通用资源加载方法（支持bundle内/远程资源）
         * @param path - 资源路径（支持格式：'bundleName:path/to/asset' 或完整URL）
         * @param type - 资源类型（如SpriteFrame, Prefab等）
         * @param callback - 加载完成回调
         * @example
         * // 加载远程图片
         * assetBundleManager.loadFile('https://example.com/image.png', SpriteFrame, (frame) => {
         *   this.sprite.spriteFrame = frame;
         * });
         * 
         * // 加载bundle内预制体
         * assetBundleManager.loadFile('characters:prefabs/hero', Prefab, (prefab) => {
         *   instantiate(prefab).parent = this.node;
         * });
         * 
         * // 加载本地JSON配置
         * assetBundleManager.loadFile('configs:data/levels', JsonAsset, (json) => {
         *   this.initLevels(json.json);
         * });
         */
        public loadFile(path: string, type: typeof Asset, callback: (asset: Asset) => void): void {
            let p = this.assetPath(path);
            if (p.bundle) {
                this.load(p.bundle, p.path, type, (asset: Asset) => {
                    callback(asset);
                });
            }
            else {
                assetManager.loadAny({ 'url': path }, (e, item) => {
                    if (e) err('loadFile', path, e.message);
                    callback(item);
                });
            }
        }

        /**
         * 加载指定资源包内的文件（自动处理包加载依赖）
         * @param bundleName - 资源包名称（空字符串表示加载远程资源）
         * @param fileName - 资源在包内的路径
         * @param type - 资源类型
         * @param callback - 加载完成回调
         * @example
         * // 加载角色包内的动画资源
         * assetBundleManager.load('characters', 'animations/warrior', AnimationClip, (clip) => {
         *   this.anim.addClip(clip);
         * });
         * 
         * // 直接加载远程音效文件
         * assetBundleManager.load('', 'https://example.com/sound.mp3', AudioClip, (audio) => {
         *   this.playSound(audio);
         * });
         * 
         * // 加载本地包内场景资源
         * assetBundleManager.load('scenes', 'level3', SceneAsset, (scene) => {
         *   director.loadScene(scene);
         * });
         */
        public load(bundleName: string, fileName: string, type: typeof Asset, callback: (asset: Asset) => void): void {
            if (bundleName == null || bundleName == '') {
                assetManager.loadAny({ 'url': fileName, 'type': type }, (err, item) => {
                    if (item == null) {
                        log('load', fileName, err.message);
                    } else {
                        this.addRef(item);
                    }
                    callback?.(item);
                });
            }
            else {
                let bundle = this.getLoadedBundle(bundleName);
                if (bundle != null) {
                    bundle.load(fileName, type, (error, item) => {
                        if (item == null) {
                            err('load', fileName, error.message);
                            evn.emit('load_file_fail');
                        } else if (!isValid(item)) {
                            err('资源被释放', fileName);
                            evn.emit('load_file_fail');
                            item = null;
                        } else {
                            this.addRef(item);
                        }
                        callback?.(item);
                    });
                } else {
                    this.loadBundle(bundleName, () => {
                        this.load(bundleName, fileName, type, callback);
                    });
                }
            }
        }

        /**
         * 加载文本资源文件（支持.txt/.xml/.csv等文本格式）
         * @param path - 资源路径或远程URL地址（格式：'bundle/path/to/file' 或 'http://example.com/data.txt'）
         * @param callback - 加载完成回调函数，接收TextAsset对象
         * @example
         * // 加载本地包内对话文本
         * assetBundleManager.loadText('texts/dialogue', (asset) => {
         *   if (asset) {
         *     const dialogueLines = asset.text.split('\n');
         *     this.showDialogue(dialogueLines);
         *   } else {
         *     console.error('对话文本加载失败');
         *   }
         * });
         * 
         * // 加载远程配置文件
         * const configURL = 'https://example.com/game_config.csv';
         * assetBundleManager.loadText(configURL, (csvAsset) => {
         *   if (csvAsset) {
         *     this.parseConfig(csvAsset.text);
         *   }
         * });
         * 
         * // 加载多语言文本资源
         * const langPath = `localization/${this.currentLang}/ui_text`;
         * assetBundleManager.loadText(langPath, (textAsset) => {
         *   this.uiStrings = JSON.parse(textAsset.text);
         * });
         */
        public loadText(path: string, callback: (item: TextAsset) => void): void {
            this.loadFile(path, TextAsset, callback);
        }

        /**
         * 加载JSON配置文件
         * @param path - JSON文件路径（格式：'bundle/path/to/file' 或远程URL）
         * @param callback - 加载完成回调，接收JsonAsset对象
         * @example
         * // 加载本地游戏配置
         * assetBundleManager.loadJSON('config/game_settings', (asset) => {
         *   if (asset) {
         *     this.difficulty = asset.json.difficultyLevel;
         *     this.enemyCount = asset.json.enemySettings.count;
         *   }
         * });
         * 
         * // 加载远程排行榜数据
         * assetBundleManager.loadJSON('https://api.example.com/leaderboard', (data) => {
         *   this.updateLeaderboard(data?.json);
         * });
         */
        public loadJSON(path: string, callback: (item: JsonAsset) => void): void {
            this.loadFile(path, JsonAsset, callback);
        }

        /**
         * 加载精灵帧资源（适用于UI元素、2D精灵）
         * @param path - 精灵帧路径（格式：'bundle/path/to/spriteFrame'）
         * @param callback - 加载完成回调，接收SpriteFrame对象
         * @example
         * // 加载角色头像
         * assetBundleManager.loadSprite('characters/avatars/hero', (frame) => {
         *   if (frame) {
         *     this.avatar.spriteFrame = frame;
         *   }
         * });
         * 
         * // 加载技能图标
         * assetBundleManager.loadSprite('ui/skill_icons/fireball', (iconFrame) => {
         *   skillButton.getComponent(Sprite).spriteFrame = iconFrame;
         * });
         */
        public loadSprite(path: string, callback: (item: SpriteFrame) => void): void {
            this.loadFile(path, SpriteFrame, callback);
        }

        /**
         * 加载Spine骨骼动画资源
         * @param path - Spine资源路径（格式：'bundle/path/to/spine'）
         * @param callback - 加载完成回调，接收SkeletonData对象
         * @example
         * // 加载角色动画
         * assetBundleManager.loadSpine('spines/characters/warrior', (skeletonData) => {
         *   if (skeletonData) {
         *     const skeleton = this.node.addComponent(sp.Skeleton);
         *     skeleton.skeletonData = skeletonData;
         *     skeleton.setAnimation(0, 'idle', true);
         *   }
         * });
         */
        public loadSpine(path: string, callback: (item: SkeletonData) => void): void {
            this.loadFile(path, SkeletonData, callback);
        }

        /**
         * 加载图集资源（包含多个精灵帧的集合）
         * @param path - 图集路径（格式：'bundle/path/to/atlas'）
         * @param callback - 加载完成回调，接收SpriteAtlas对象
         * @example
         * // 加载UI图集并获取具体精灵帧
         * assetBundleManager.loadAtlas('ui/atlas/main_ui', (atlas) => {
         *   const closeBtnFrame = atlas.getSpriteFrame('close_btn');
         *   this.closeButton.spriteFrame = closeBtnFrame;
         * });
         */
        public loadAtlas(path: string, callback: (item: SpriteAtlas) => void): void {
            this.loadFile(path, SpriteAtlas, callback);
        }

        /**
         * 加载纹理资源（适用于3D模型贴图、背景图等）
         * @param path - 纹理路径（格式：'bundle/path/imgName/texture' 或远程URL）
         * @param callback - 加载完成回调，接收Texture2D对象
         * @example
         * // 加载场景背景纹理
         * assetBundleManager.loadTexture('textures/backgrounds/forest', (texture) => {
         *   this.terrainMaterial.setProperty('mainTexture', texture);
         * });
         * 
         * // 加载远程图片作为动态背景
         * assetBundleManager.loadTexture('https://example.com/dynamic_bg.jpg', (bgTexture) => {
         *   this.bgSprite.spriteFrame = new SpriteFrame(bgTexture);
         * });
         */
        public loadTexture(path: string, callback: (item: Texture2D) => void): void {
            this.loadFile(path, Texture2D, callback);
        }

        /**
         * 加载音频资源（支持mp3/wav等格式）
         * @param path - 音频路径（格式：'bundle/path/to/audio' 或远程URL）
         * @param callback - 加载完成回调，接收AudioClip对象
         * @example
         * // 加载背景音乐
         * assetBundleManager.loadAudio('sounds/bgm_main', (clip) => {
         *   if (clip) {
         *     AudioEngine.playMusic(clip, true);
         *   }
         * });
         * 
         * // 加载远程音效
         * assetBundleManager.loadAudio('https://cdn.example.com/sfx/explosion.mp3', (sfx) => {
         *   this.explosionSound = sfx;
         * });
         */
        public loadAudio(path: string, callback: (item: AudioClip) => void): void {
            this.loadFile(path, AudioClip, callback);
        }

        /**
         * 加载预制体资源（包含节点结构和组件配置）
         * @param path - 预制体路径（格式：'bundle/path/to/prefab'）
         * @param callback - 加载完成回调，接收Prefab对象
         * @example
         * // 实例化UI弹窗预制体
         * assetBundleManager.loadPrefab('ui/popups/settings', (prefab) => {
         *   const popup = instantiate(prefab);
         *   popup.parent = this.canvasNode;
         * });
         */
        public loadPrefab(path: string, callback: (item: Prefab) => void): void {
            this.loadFile(path, Prefab, callback);
        }

        /**
         * 加载动画剪辑资源（包含关键帧动画数据）
         * @param path - 动画路径（格式：'bundle/path/to/animation'）
         * @param callback - 加载完成回调，接收AnimationClip对象
         * @example
         * // 为角色添加攻击动画
         * assetBundleManager.loadAnimationClip('characters/hero/attack', (clip) => {
         *   this.animationComponent.addClip(clip, 'attack');
         *   this.animationComponent.play('attack');
         * });
         */
        public loadAnimationClip(path: string, callback: (item: AnimationClip) => void): void {
            this.loadFile(path, AnimationClip, callback);
        }

        /**
         * 加载材质资源（包含着色器参数配置）
         * @param path - 材质路径（格式：'bundle/path/to/material'）
         * @param callback - 加载完成回调，接收Material对象
         * @example
         * // 更换武器材质
         * assetBundleManager.loadMaterial('materials/weapons/gold', (mat) => {
         *   this.weaponRenderer.setMaterial(0, mat);
         * });
         */
        public loadMaterial(path: string, callback: (item: Material) => void): void {
            this.loadFile(path, Material, callback);
        }

        /**
         * 加载特效资源（包含着色器效果配置）
         * @param path - 特效路径（格式：'bundle/path/to/effect'）
         * @param callback - 加载完成回调，接收EffectAsset对象
         * @example
         * // 应用屏幕后处理特效
         * assetBundleManager.loadEffect('effects/bloom', (effect) => {
         *   this.postProcess.effectAsset = effect;
         * });
         */
        public loadEffect(path: string, callback: (item: EffectAsset) => void): void {
            this.loadFile(path, EffectAsset, callback);
        }

        /**
         * 加载字体资源（支持TTF/位图字体）
         * @param path - 字体路径（格式：'bundle/path/to/font'）
         * @param callback - 加载完成回调，接收Font对象
         * @example
         * // 更换UI字体
         * assetBundleManager.loadFont('fonts/arial', (font) => {
         *   this.label.font = font;
         * });
         */
        public loadFont(path: string, callback: (item: Font) => void): void {
            this.loadFile(path, Font, callback);
        }

        /**
         * 加载二进制数据（适用于自定义数据格式）
         * @param path - 数据路径（格式：'bundle/path/to/buffer'）
         * @param callback - 加载完成回调，接收BufferAsset对象
         * @example
         * // 读取配置文件二进制数据
         * assetBundleManager.loadBuffer('configs/game_data.bin', (buffer) => {
         *   const view = new DataView(buffer.buffer);
         *   this.maxLevel = view.getUint16(0);
         * });
         */
        public loadBuffer(path: string, callback: (item: BufferAsset) => void): void {
            this.loadFile(path, BufferAsset, callback);
        }

        // public loadDragonBonesAtlasAsset(path: string, callback: (item: dragonBones.DragonBonesAtlasAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAtlasAsset, callback);
        // }

        // public loadDragonBonesAsset(path: string, callback: (item: dragonBones.DragonBonesAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAsset, callback);
        // }

        /**
         * 批量加载资源文件（支持进度回调与引用计数管理）
         * @param bundleName - 资源包名称（本地或远程包）
         * @param filePaths - 要加载的资源路径数组（格式：['path/to/file1', 'path/to/file2']）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载成功的资源数组）
         * @example
         * // 加载多个UI纹理和预制体
         * assetBundleManager.loadFiles('ui', [
         *   'textures/btn_play',
         *   'prefabs/player_info',
         *   'animations/character'
         * ], (progress) => {
         *   this.loadingBar.progress = progress;
         * }, (items) => {
         *   if (items) {
         *     this.btnTexture = items[0] as ImageAsset;
         *     this.playerPrefab = items[1] as Prefab;
         *   }
         * });
         * 
         * // 加载远程角色包资源
         * assetBundleManager.loadFiles('characters', [
         *   'hero/body',
         *   'hero/weapon'
         * ], null, (models) => {
         *   this.initCharacter(models);
         * });
         */
        public loadFiles<T extends Asset>(bundleName: string, filePaths: string[], onProgress: (progress: number) => void, onComplete: (items: T[]) => void): void {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                bundle.load<T>(filePaths, (finished, total, requestItem) => {
                    onProgress && onProgress(finished / total);
                }, (err, items) => {
                    if (items == null || items.length == 0) {
                        onComplete && onComplete(null);
                        // log('loadFiles', filePaths, err.message);
                    } else {
                        for (let i = 0; i < items.length; i++) {
                            this.addRef(items[i]);// 增加引用计数防止自动释放
                            // this.loadDepends(items[i]._uuid);
                        }
                        onComplete && onComplete(items);
                    }
                });
            } else {
                this.loadBundle(bundleName, () => {
                    this.loadFiles(bundleName, filePaths, onProgress, onComplete);
                });
            }
        }

        /**
         * 加载并切换场景
         * @param name - 场景名称（需在构建配置中存在的场景）
         * @param callback - 场景加载完成后的回调函数
         * @example
         * // 加载主菜单场景
         * assetBundleManager.loadScene('MainMenu', () => {
         *   console.log('场景切换完成');
         * });
         * 
         * // 带加载过渡的场景切换
         * this.showLoadingScreen();
         * assetBundleManager.loadScene('Level3', () => {
         *   this.hideLoadingScreen();
         * });
         */
        public loadScene(name: string, callback?: () => void): void {
            director.loadScene(name, callback);
        }

        private parseExt(path: string): '.png' | '.jpg' | '.webp' | '.txt' | '.mp3' | '.json' {
            const ext = path.split('.').pop();
            switch (ext) {
                case 'png':
                    return '.png';
                case 'jpg':
                    return '.jpg';
                case 'webp':
                    return '.webp';
                case 'txt':
                    return '.txt';
                case 'mp3':
                    return '.mp3';
                case 'json':
                    return '.json';
            }
            return null;
        }

        /**
         * 从远程服务器加载任意类型资源文件（带缓存机制）
         * @param url - 远程资源完整URL地址
         * @param callback - 加载完成回调函数（成功返回资源实例，失败返回null）
         * @example
         * // 加载远程JSON配置文件
         * assetBundleManager.loadRemoteFile<JsonAsset>('https://cdn.example.com/configs/items.json', (json) => {
         *   if (json) this.initItemConfig(json.json);
         * });
         * 
         * // 加载远程音频文件
         * assetBundleManager.loadRemoteFile<AudioClip>('https://cdn.example.com/sounds/bgm.mp3', (clip) => {
         *   if (clip) audioEngine.playMusic(clip);
         * });
         */
        public loadRemoteFile<T extends Asset>(url: string, callback: (file: T | null) => void) {
            assetManager.loadRemote<T>(url, (err, file) => {
                if (file == null) {
                    log('loadRemoteFile', url, err.message);
                    callback?.(null);
                } else {
                    callback?.(file);
                }
            });
        }

        /**
         * 加载远程文本文件（返回文件内容string）,文件内容不缓存
         * @param url - 文本文件URL地址
         * @param callback - 加载完成回调
         * @example
         * // 加载游戏公告文本
         * assetBundleManager.loadRemoteText('https://cdn.example.com/notice.txt', (str) => {
         *   if (str) this.noticeLabel.string = str;
         * });
         */
        public loadRemoteText(url: string, callback: (text: string) => void) {
            this.loadRemoteFile<TextAsset>(url, (file: TextAsset) => {
                if (file) {
                    callback?.(file.text);
                } else {
                    callback?.('');
                }
            });
        }

        public createSpriteFrameWithTrim(imageAsset: ImageAsset, trimPixels: number = 1): SpriteFrame {
            const spriteFrame = SpriteFrame.createWithImage(imageAsset);
            spriteFrame['_uuid'] = uuid();
            if (spriteFrame && spriteFrame.texture && imageAsset.width > trimPixels * 2 && imageAsset.height > trimPixels * 2) {
                // 裁剪边缘，排除边缘的 trimPixels 像素
                const trimRect = rect(
                    trimPixels,
                    trimPixels,
                    imageAsset.width - trimPixels * 2,
                    imageAsset.height - trimPixels * 2
                );
                spriteFrame.rect = trimRect;
                // 调整原始尺寸，使其与实际显示区域一致
                spriteFrame.originalSize = new Size(trimRect.width, trimRect.height);
            }

            return spriteFrame;
        }

        /**
         * 加载远程图片并转换为SpriteFrame（支持PNG/JPG格式）
         * @param url - 图片文件URL地址
         * @param ext - 文件扩展名（必须指定为.png或.jpg）
         * @param callback - 加载完成回调（返回可直接使用的精灵帧）
         * @example
         * // 加载玩家头像
         * assetBundleManager.loadRemoteImage('https://cdn.example.com/avatars/123.png', '.png', (sf) => {
         *   if (sf) this.avatar.spriteFrame = sf;
         * });
         * 
         * // 加载游戏背景图
         * assetBundleManager.loadRemoteImage('https://cdn.example.com/bg/level1.jpg', '.jpg', (sf) => {
         *   if (sf) this.bgImage.spriteFrame = sf;
         * });
         */
        public loadRemoteImage(url: string, callback: (sf: SpriteFrame | null) => void) {
            if (this.remoteAssetsCache[url]?.loading) {
                this.remoteAssetsCache[url].cbs.push(callback);
                return;
            } else if (this.remoteAssetsCache[url]?.asset?.isValid) {
                this.remoteAssetsCache[url].ref++;
                this.remoteAssetsCache[url].t = sysTime.now;
                callback?.(this.remoteAssetsCache[url].asset as SpriteFrame);
            } else {
                this.remoteAssetsCache[url] = { asset: null, t: 0, ref: 0, loading: true, cbs: [callback] };
                this._loadRemoteImage(url);
            }
        }

        private _loadRemoteImage(url: string) {
            assetManager.loadRemote<ImageAsset>(url, null, (err, file) => {
                let sf = null;
                if (file == null) {
                    log('loadRemoteImage', url, err.message);
                } else {
                    sf = this.createSpriteFrameWithTrim(file, 1);
                    sf.addRef();
                }
                if (!this.remoteAssetsCache[url]) {
                    this.remoteAssetsCache[url] = { asset: null, t: 0, ref: 0, loading: true, cbs: [] };
                }
                this.remoteAssetsCache[url].loading = false;
                let cbs = this.remoteAssetsCache[url].cbs;
                cbs.forEach(cb => cb(sf));
                if (sf) {
                    this.remoteAssetsCache[url].asset = sf;
                    this.remoteAssetsCache[url].ref = cbs.length;
                    this.remoteAssetsCache[url].t = sysTime.now;
                    this.remoteAssetsCache[url].cbs.length = 0;
                } else {
                    delete this.remoteAssetsCache[url];
                }
            });
        }

        /**
         * 放回远程图片
         * @param url - 图片文件URL地址
         */
        public putbackRemoteImage(uuid: string) {
            let info: any;
            for (const key in this.remoteAssetsCache) {
                info = this.remoteAssetsCache[key];
                if (info.asset?.uuid == uuid) {
                    info.ref--;
                    info.t = sysTime.now;
                    break;
                }
            }
        }

        public preloadRemoteImage(url: string, onComplete?: () => void) {
            this.loadRemoteFile(url, onComplete);

        }

        public async loadRemoteFileAsync<T extends Asset>(url: string): Promise<T | null> {
            return new Promise<T>((resolve, reject) => {
                this.loadRemoteFile<T>(url, (file) => {
                    resolve(file);
                });
            });
        }

        public async loadRemoteImageAsync(url: string): Promise<SpriteFrame | null> {
            return new Promise<SpriteFrame | null>(resolve => {
                this.loadRemoteImage(url, (sf) => {
                    resolve(sf);
                });
            });
        }

        public async preloadRemoteImageAsync(url: string): Promise<void> {
            return new Promise<void>(resolve => {
                this.preloadRemoteImage(url, resolve);
            });
        }

        /**
         * 预加载远程图片
         * @param url - 图片文件URL地址
         * @param onComplete - 加载完成回调
         */
        public preloadRemoteImages(urls: string[], onComplete?: () => void) {
            const promises: Promise<Asset>[] = [];
            let url: string;
            for (let i = 0, n = urls.length; i < n; i++) {
                url = urls[i];
                promises.push(this.loadRemoteFileAsync(url));
            }
            Promise.all(promises).then(() => {
                onComplete?.();
            });
        }

        /**
         * 加载远程资源包（支持版本控制和异步加载配置）
         * @param url - 资源包URL地址
         * @param opts - 加载选项 { version?: 版本号, scriptAsyncLoading?: 是否异步加载脚本 }
         * @param callback - 加载完成回调（返回资源包实例）
         * @example
         * // 加载带版本号的角色资源包
         * assetBundleManager.loadRemoteBundle('https://cdn.example.com/bundles/characters', {
         *   version: '1.2.3',
         *   scriptAsyncLoading: true
         * }, (bundle) => {
         *   if (bundle) this.setupCharacters(bundle);
         * });
         * 
         * // 加载基础资源包（无版本控制）
         * assetBundleManager.loadRemoteBundle('https://cdn.example.com/bundles/base', null, (b) => {
         *   if (b) this.preloadBaseAssets();
         * });
         */
        public loadRemoteBundle(url: string, opts?: { version?: string, scriptAsyncLoading?: boolean }, callback?: (bundle: Bundle) => void) {
            assetManager.loadBundle(url, opts, (e, bundle) => {
                if (e) err(e.stack);
                callback?.(bundle);
            });
        }

        private _assetPathCache: { bundle: string, file: string, type: typeof Asset, path: string } = { bundle: '', file: '', type: null, path: '' };
        /**
         * 解析资源路径获取bundle名称、文件名及资源类型
         * @param path - 完整资源路径，格式应为包含assets目录的路径（如：'assets/bundleName/.../fileName.ext'）
         * @returns 包含以下属性的对象:
         *  - bundle: 资源所属bundle名称（当路径不包含有效bundle时返回空）
         *  - file: 文件名（不含扩展名）
         *  - type: 资源类型（根据扩展名自动识别）
         *  - path: 完整资源路径（不含assets前缀和文件扩展名）
         * 
         * @example
         * // 有效路径示例
         * const path1 = 'assets/characters/player/avatar.png';
         * const result1 = assetPath(path1);
         * // 返回: { 
         * //   bundle: 'characters',
         * //   file: 'avatar',
         * //   type: ImageAsset,
         * //   path: 'player/avatar'
         * // }
         * 
         * // 无效路径示例（不包含有效bundle）
         * const path2 = 'assets/invalid_path/test.json';
         * const result2 = assetPath(path2);
         * // 返回: {}
         */
        public assetPath(path: string): AssetPath {
            // 移除路径中的assets前缀并分割路径层级
            path = path.split('/assets/').pop();
            let p = path.split('/');

            this._assetPathCache.bundle = '';
            this._assetPathCache.file = '';
            this._assetPathCache.type = null;
            this._assetPathCache.path = '';
            const bundles: string[] = assetManager['_projectBundles'];
            // 遍历路径层级查找有效bundle名称
            for (let i = 0, n = p.length; i < n; i++) {
                const b = p.shift();
                if (bundles.includes(b)) {
                    this._assetPathCache.bundle = b;
                    break;
                }
            }

            // 未找到有效bundle时返回空对象
            if (!this._assetPathCache.bundle) {
                return this._assetPathCache;
            }

            // 解析文件名和扩展名
            let file = p.pop().split('.');
            let fileType = file.pop();
            this._assetPathCache.file = file.join('.') || fileType;

            // 构建返回对象基础信息
            p[p.length] = this._assetPathCache.file;
            this._assetPathCache.path = p.join('/');

            // 根据文件扩展名确定资源类型
            let s: any;
            if (fileType != null) {
                switch (fileType.toLowerCase()) {
                    case 'json':
                        s = JsonAsset;
                        break;
                    case 'mp3':
                        s = AudioClip;
                        break;
                    case 'png':
                    case 'jpg':
                        s = ImageAsset;
                        break;
                    case 'prefab':
                        s = Prefab;
                        break;
                    case 'atlas':
                        s = SpriteAtlas;
                        break;
                }
                this._assetPathCache.type = s;
            }
            return this._assetPathCache;
        }

        /**
         * 加载指定资源包内的所有文件资源（自动过滤子资源和指定类型）
         * @param bundleName - 要加载的资源包名称（如'characters'、'ui'）
         * @param exceptAssetTypes - 需要排除的资源类型数组（如[AudioClip, TTFFont]）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载的资源数组）
         * @example
         * // 加载整个角色资源包（排除音频和预制体）
         * assetBundleManager.loadAllFilesInBundle(
         *   'characters',
         *   [AudioClip, Prefab],
         *   (p) => console.log(`加载进度：${p * 100}%`),
         *   (items) => console.log('已加载角色资源', items)
         * );
         * 
         * // 加载整个配置包（不排除任何类型）
         * assetBundleManager.loadAllFilesInBundle(
         *   'configs',
         *   null,
         *   null,
         *   (configs) => this.initGameConfig(configs)
         * );
         */
        public loadAllFilesInBundle(bundleName: string, exceptAssetTypes: (typeof Asset | typeof ImageAsset)[], onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                const assetInfos = bundle['_config'].assetInfos._map;
                let requests: any[] = [];
                // 遍历资源包内所有资源信息
                for (const uuid in assetInfos) {
                    const info = assetInfos[uuid];
                    // 过滤条件：排除子资源（@符号）、无构造函数资源、指定排除类型
                    if (!info.path?.endsWith('/texture') && (uuid.includes('@') || !info.ctor)) continue;
                    if (exceptAssetTypes && exceptAssetTypes.includes(info.ctor)) continue;
                    requests[requests.length] = { uuid: uuid };
                }
                this.loadAnyFiles(requests, onProgress, onComplete);
            } else {
                // 如果资源包未加载，先加载资源包再递归调用
                this.loadBundle(bundleName, () => {
                    this.loadAllFilesInBundle(bundleName, exceptAssetTypes, onProgress, onComplete);
                });
            }
        }

        /**
         * 预加载资源包内的所有主资源（自动过滤子资源）
         * @param bundleName - 要预加载的资源包名称
         * @param onProgress - 预加载进度回调（0-1）
         * @example
         * // 预加载整个UI包
         * assetBundleManager.preloadAllFilesInBundle('ui', (p) => {
         *   this.loadingBar.progress = p;
         * });
         * 
         * // 预加载特效包并在完成后显示进入游戏按钮
         * assetBundleManager.preloadAllFilesInBundle('effects', null, () => {
         *   this.startButton.active = true;
         * });
         * 
         * // 预加载字体包（排除TTF字体）
         * assetBundleManager.preloadAllFilesInBundle('fonts', [TTFFont], (p) => {
         *   console.log(`字体预加载进度：${p}`);
         * });
         */
        public preloadAllFilesInBundle(bundleName: string, onProgress?: (progress: number) => void) {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                const assetInfos = bundle['_config'].assetInfos._map;
                let paths: string[] = [];
                // 收集所有有效资源路径（过滤子资源和不受支持的类型）
                for (const uuid in assetInfos) {
                    const a = assetInfos[uuid];
                    if (a.path && !uuid.includes('@') && this.loadTypes.includes(a.ctor.name)) {
                        paths[paths.length] = a.path;
                    }
                }
                // 直接调用资源包的preload方法进行批量预加载
                bundle.preload(paths, Asset, (finished, total, item: any) => {
                    onProgress && onProgress(finished / total);
                }, (e, items) => {
                    if (e) err('preloadFiles', e.message);
                });
            } else {
                // 资源包未加载时先加载资源包
                this.loadBundle(bundleName, () => {
                    this.preloadAllFilesInBundle(bundleName, onProgress);
                });
            }
        }

        /**
         * 加载指定文件夹内的所有资源文件
         * @param folderName - 资源文件夹路径（格式：'assets/bundleName/path/to/folder'）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载的资源数组）
         * @param specialTypes - 指定需要加载的特殊资源类型数组（如只加载[ImageAsset, AudioClip]）
         * @example
         * // 加载角色包中所有模型资源
         * assetBundleManager.loadAllFilesInFolder(
         *   'assets/characters/models',
         *   (p) => console.log(`加载进度：${p * 100}%`),
         *   (items) => this.initCharacters(items),
         *   [Mesh, Material]
         * );
         * 
         * // 加载UI包中某个目录下的所有资源
         * assetBundleManager.loadAllFilesInFolder(
         *   'assets/ui/main_menu',
         *   null,
         *   (items) => this.setupMainMenuUI()
         * );
         */
        public loadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void, specialTypes?: typeof Asset[]) {
            // 解析资源路径获取bundle信息
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                err(`${folderName}没有设置ab包`);
                return;
            }

            // 确保路径以斜杠结尾用于前缀匹配
            p.path += '/';
            let bundle = this.getLoadedBundle(p.bundle);
            const assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];

            // 遍历资源信息表收集符合要求的资源
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                // 处理特殊类型过滤
                if (specialTypes) {
                    if (info.path?.indexOf(p.path) == 0 && specialTypes.includes(info.ctor))
                        requests[requests.length] = { path: info.path, bundle: p.bundle, type: info.ctor };
                    continue;
                }
                // 跳过子资源（如@texture等）
                if (uuid.includes('@')) continue;
                // 匹配路径前缀
                if (info.path?.indexOf(p.path) == 0) {
                    requests[requests.length] = { path: info.path, bundle: p.bundle, type: info.ctor };
                }
            }
            this.loadAnyFiles(requests, onProgress, onComplete);
        }

        /**
         * 预加载指定文件夹内的所有资源文件
         * @param folderName - 资源文件夹路径（格式：'assets/bundleName/path/to/folder'）
         * @param onProgress - 预加载进度回调（0-1）
         * @param onComplete - 预加载完成回调（返回预加载的资源数组）
         * @example
         * // 预加载音效目录资源
         * assetBundleManager.preloadAllFilesInFolder(
         *   'assets/audio/sound_effects',
         *   (p) => this.updateLoadingBar(p),
         *   (items) => this.onSoundEffectsLoaded()
         * );
         * 
         * // 预加载过场动画资源
         * assetBundleManager.preloadAllFilesInFolder(
         *   'assets/cutscenes/intro',
         *   null,
         *   () => this.playIntroCutscene()
         * );
         */
        public preloadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                err(`${folderName}没有设置ab包`);
                return;
            }

            let bundle = this.getLoadedBundle(p.bundle);
            // 获取目录下的所有资源信息
            let infos = bundle.getDirWithPath(p.path);
            let requests: { path: string, bundle: string, type: typeof Asset }[] = [];

            // 过滤子资源并构建请求列表
            for (let i = 0; i < infos.length; i++) {
                let a = infos[i];
                if (a.uuid.indexOf('@') == -1) {
                    requests[requests.length] = { path: a.path, bundle: p.bundle, type: Asset };
                }
            }
            this.loadAnyFiles(requests, onProgress, onComplete);
        }

        /**
         * 通过UUID加载资源（自动管理引用计数）
         * @param uuid - 资源唯一标识符
         * @param callback - 加载完成回调函数
         * @example
         * // 加载预制体资源
         * assetBundleManager.loadByUuid<Prefab>('fcmRqXJITKedlPeuQp13S6', (prefab) => {
         *   if (prefab) {
         *     const node = instantiate(prefab);
         *     this.node.addChild(node);
         *   }
         * });
         * 
         * // 加载纹理资源
         * assetBundleManager.loadByUuid<Texture2D>('2emRwXJITKedlPeuQp13SX', (texture) => {
         *   this.spriteFrame.texture = texture;
         * });
         */
        public loadByUuid<T extends Asset>(uuid: string, callback?: (file: T) => void) {
            if (uuid == '') {
                no.err('uuid 为空')
                return;
            }
            assetManager.loadAny({ 'uuid': uuid }, (e: Error, f: T) => {
                if (e != null) {
                    callback?.(f);
                    err(uuid, e.stack);
                } else {
                    this.addRef(f);//增加引用计数
                    callback?.(f);
                }
            });
        }

        /**
         * 加载单一资源（支持多种加载方式）
         * @param request 加载请求参数:
         *   - url: 完整资源路径（自动解析bundle和路径）
         *   - path: 相对于包的资源路径
         *   - uuid: 资源唯一标识符
         *   - bundle: 资源包名称
         *   - type: 资源类型（自动推断时可省略）
         * @param callback 加载完成回调
         * @example
         * // 通过完整URL加载角色贴图
         * assetBundleManager.loadAny({
         *   url: 'assets/characters/hero/texture.png',
         *   type: ImageAsset
         * }, (image) => {
         *   this.updateCharacterTexture(image);
         * });
         * 
         * // 通过bundle+path加载音效
         * assetBundleManager.loadAny({
         *   bundle: 'audio',
         *   path: 'sfx/explosion',
         *   type: AudioClip
         * }, (clip) => {
         *   this.playSoundEffect(clip);
         * });
         */
        public loadAny<T extends Asset>(request: { url?: string, path?: string, uuid?: string, bundle?: string, type?: typeof Asset }, callback?: (file: T) => void): void {
            if (request.url) {
                const p = this.assetPath(request.url);
                this.load(p.bundle, p.path, p.type, callback);
            } else if (request.bundle && request.path && request.type) {
                this.load(request.bundle, request.path, request.type, callback);
            } else {
                assetManager.loadAny({ uuid: request.uuid }, (e: Error, f: T) => {
                    if (e != null) {
                        err(request.uuid, e.stack);
                    }
                    this.addRef(f);//增加引用计数
                    callback?.(f);
                });
            }
        }

        /**
         * 增加资源引用计数（特殊处理TTF字体资源）
         * @param asset 需要增加引用的资源
         * @example
         * // 加载后手动增加引用
         * assetBundleManager.loadByUuid<Font>('23fRwXJITKedlPeuQp13Sr', (font) => {
         *   this.addRef(font); // 确保字体资源不被自动释放
         * });
         */
        public addRef(asset: Asset): void {
            if (!asset) return;
            if (asset instanceof TTFFont) {
                this._ttfFont[asset._fontFamily] = asset;
            }
            asset.addRef();
            if (asset instanceof SkeletonData) {
                asset.textures.forEach(texture => {
                    texture.addRef();
                });
            }
        }

        /**
         * 减少资源引用计数（延迟0.02秒执行防止同一帧内多次操作）
         * @param asset 需要减少引用的资源
         * @example
         * // 使用完成后安全释放资源
         * onDestroy() {
         *   this.decRef(this.weaponModel); // 递减模型资源引用
         *   this.decRef(this.skillEffect); // 递减特效资源引用
         * }
         */
        public decRef(asset: Asset): void {
            if (!asset) return;
            if (asset.refCount > 0) {
                asset.decRef();
            }
        }

        /**
         * 加载依赖的资源
         * @param uuid 依赖资源的uuid数组
         */
        private loadDepends(uuid: string) {
            return;
            let a: any[] = [];
            let list = assetManager.dependUtil.getDepsRecursively(uuid);
            if (list.length == 0) return;
            list.forEach(uuid => {
                a.push({ uuid: uuid });
            });
            // log('loadDepends', a);
            assetManager.loadAny(a, (e, item) => {
                if (item == null) err(uuid, e.message);
            });
        }

        /**
         * 释放资源（支持通过资源对象、uuid或SpriteFrame进行释放）
         * @param asset - 需要释放的资源对象/资源uuid/SpriteFrame
         * @param force - 是否强制立即释放（默认false采用延迟释放机制）
         * @example
         * // 释放精灵帧资源
         * const sf = this.getComponent(Sprite).spriteFrame;
         * assetBundleManager.release(sf);
         * 
         * // 通过uuid强制立即释放
         * assetBundleManager.release('23fRwXJITKedlPeuQp13Sr', true);
         * 
         * // 释放预制体资源
         * assetBundleManager.release(this.characterPrefab);
         */
        public release(asset: Asset | string, force = false): void {
            if (!asset) return;
            if (asset instanceof SpriteFrame) {
                asset = asset._uuid;
            }
            if (typeof asset == 'string') {
                asset = asset.split('@')[0];
                asset = assetManager.assets.get(asset);
            }
            if (!asset) return;
            if (force) {
                if (asset instanceof SkeletonData) {
                    asset.textures?.forEach(texture => {
                        assetManager.releaseAsset(texture);
                    });
                }
                assetManager.releaseAsset(asset);
            } else {
                scheduleOnce(() => {
                    if (asset instanceof SkeletonData) {
                        asset.textures?.forEach(texture => {
                            texture.decRef();
                        });
                    }
                    (<Asset>asset).decRef();
                }, .02);
            }
        }

        /**
         * 从缓存中获取资源实例
         * @param uuid - 资源唯一标识符
         * @returns 资源实例（可能为null）
         * @example
         * // 获取已缓存的字体资源
         * const font = assetBundleManager.getAssetFromCache('5tH3sK9jQpL2vR8x');
         * if (font) this.label.font = font;
         */
        public getAssetFromCache(uuid: string): Asset {
            return assetManager.assets.get(uuid);
        }

        /**
         * 批量加载多种类型资源（支持混合加载远程/本地资源）
         * @param requests - 加载请求数组，支持以下格式：
         *   - url: 完整远程资源路径（需要带扩展名）
         *   - path: 本地资源路径（格式：'bundle/path/to/asset'）
         *   - uuid: 资源唯一标识符
         *   - bundle: 资源所属包名（当使用path时需要）
         *   - type: 指定资源类型（可选，用于类型断言）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载的资源数组）
         * @example
         * // 混合加载远程图片和本地预制体
         * assetBundleManager.loadAnyFiles([
         *   { 
         *     url: 'https://cdn.example.com/items/sword.png',
         *     type: ImageAsset 
         *   },
         *   {
         *     path: 'characters/hero',
         *     bundle: 'models',
         *     type: Prefab
         *   }
         * ], (progress) => {
         *   console.log(`加载进度：${progress * 100}%`);
         * }, (items) => {
         *   if (items.length === 2) {
         *     this.initHero(items[1] as Prefab);
         *   }
         * });
         * 
         * // 通过uuid加载特定资源
         * assetBundleManager.loadAnyFiles([
         *   { uuid: '5tH3sK9jQpL2vR8x' } // 字体资源
         * ], null, (fonts) => {
         *   this.applyGlobalFont(fonts[0]);
         * });
         */
        public loadAnyFiles(requests: { 'url'?: string, 'path'?: string, 'uuid'?: string, 'bundle'?: string, 'type'?: typeof Asset | typeof ImageAsset }[], onProgress?: (progress: number) => void, onComplete?: (items: Asset[]) => void) {
            if (requests.length == 0) {
                onProgress?.(1);
                onComplete?.([]);
                return;
            }
            assetManager.loadAny(requests, (finished, total, requestItem) => {
                onProgress && onProgress(finished / total);
            }, (e, items) => {
                if (e) {
                    onProgress && onProgress(1);
                    onComplete?.([]);
                    err('loadAnyFiles', requests, e.stack);
                } else {
                    items = [].concat(items);
                    for (let i = 0; i < items.length; i++) {
                        this.addRef(items[i]);
                    }
                    onComplete?.(items);
                }
            });
        }

        /**
         * 内部方法：单文件加载封装为Promise
         * @param request - 单个加载请求参数
         * @returns Promise包装的加载结果
         * @example
         * // 在async函数中使用
         * const asset = await assetBundleManager._loadAnyFile({
         *   path: 'ui/popups/settings',
         *   bundle: 'interface'
         * });
         */
        private _loadAnyFile(request: { 'url'?: string, 'path'?: string, 'uuid'?: string, 'bundle'?: string, 'type'?: typeof Asset }) {
            return new Promise<Asset>(resolve => {
                this.loadAny(request, item => {
                    resolve(item);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 通过资源路径获取资源UUID
         * @param path - 资源路径（格式：'assets/bundleName/path/to/asset.ext'）
         * @returns 资源唯一标识符或null
         * @example
         * // 获取角色预制体的UUID
         * const uuid = assetBundleManager.getUuidFromPath('assets/characters/hero/prefab.prefab');
         * // 可能返回：'5tH3sK9jQpL2vR8x'
         * 
         * // 获取不存在的资源路径UUID
         * const invalidUuid = assetBundleManager.getUuidFromPath('invalid/path');
         * // 返回：null
         */
        public getUuidFromPath(path: string): string | null {
            let a = this.assetPath(path);
            return this.getLoadedBundle(a.bundle)?.getInfoWithPath(a.path, a.type)?.uuid;
        }

        /**
         * 通过UUID获取资源完整URL地址
         * @param uuid - 资源唯一标识符
         * @returns 可用于远程访问的资源URL
         * @example
         * // 获取角色贴图的下载地址
         * const url = assetBundleManager.getUrlWithUuid('5tH3sK9jQpL2vR8x');
         * // 返回：'https://cdn.example.com/remote/characters/hero/texture.png'
         */
        public getUrlWithUuid(uuid: string): string {
            return assetManager.utils.getUrlWithUuid(uuid);
        }

        /**
         * 根据资源UUID查找所属资源包名称
         * @param uuid - 资源唯一标识符
         * @returns 资源包名称（未找到返回undefined）
         * @example
         * // 查找音效资源所属包
         * const bundleName = assetBundleManager.getBundleNameByUuid('7kL9mN2oPqR4sT6u');
         * // 可能返回：'sound-effects'
         */
        public getBundleNameByUuid(uuid: string): string {
            const bundles = assetManager.bundles;
            let name: string;
            bundles.forEach((bundle, key) => {
                if (bundle.getAssetInfo(uuid)) name = bundle.name;
            });
            return name;
        }

        /**
         * 获取资源包版本号（需资源包已加载）
         * @param bundleName - 资源包名称
         * @returns 当前加载的版本号字符串
         * @example
         * // 获取UI包版本号
         * const version = assetBundleManager.getBundleVersion('ui');
         * // 可能返回：'1.2.3'
         */
        public getBundleVersion(bundleName: string): string {
            return assetManager.downloader.bundleVers[bundleName];
        }

        /**
         * 自动释放远程资源（引用计数为0且超过60秒未使用）
         */
        public autoReleaseRemoteAssets() {
            setInterval(() => {
                let now = sysTime.now;
                let info: any;
                for (const key in this.remoteAssetsCache) {
                    info = this.remoteAssetsCache[key];
                    if (!info.asset?.isValid) {
                        log('autoReleaseRemoteAssets', key, 'not valid')
                        delete this.remoteAssetsCache[key];
                        continue;
                    }
                    if (now - info.t > 10) {
                        if (info.ref <= 0) {
                            log('autoReleaseRemoteAssets', key);
                            (info.asset as SpriteFrame).texture.destroy();
                            info.asset.destroy();
                            info.asset = null;
                            delete this.remoteAssetsCache[key];
                        }
                    }
                }
            }, 10000);
        }

        public releaseRemoteAssets() {
            let asset: Asset;
            for (const key in this.remoteAssetsCache) {
                asset = this.remoteAssetsCache[key].asset;
                if (asset?.isValid) {
                    asset.decRef();
                }
                if (asset.refCount == 0) {
                    assetManager.releaseAsset(asset);
                }
            }
            this.remoteAssetsCache = {};
        }

        /**
         * 释放所有已加载资源（慎用，会清空所有缓存）
         * @example
         * // 切换场景时彻底清理资源
         * onSceneChange() {
         *   assetBundleManager.clear();
         *   // ...其他清理逻辑
         * }
         */
        public clear(all: boolean = false) {
            this._cacheAsset.forEach(asset => {
                this.release(asset, true);
            });
            this._cacheAsset.clear();
            this._pathToUuid.clear();
            this._loadingAssets.clear();
            this.releaseRemoteAssets();
            if (all) {
                assetManager.releaseAll();
            }
        }

        public clearFontCache() {
            for (const key in this._ttfFont) {
                this.release(this._ttfFont[key], true);
            }
            this._ttfFont = {};
        }

        /**
         * 检查指定路径的资源是否存在于资源包中
         * @param path - 资源路径（格式：'assets/bundleName/path/to/resource'）
         * @returns 资源是否存在
         * @example
         * // 检查角色纹理是否存在
         * if (assetBundleManager.has('assets/characters/hero/texture.png')) {
         *   this.loadCharacterTexture();
         * }
         * 
         * // 验证配置文件是否存在
         * const hasConfig = assetBundleManager.has('assets/configs/game_settings.json');
         */
        public has(path: string) {
            const p = this.assetPath(path);
            let bundle = this.getLoadedBundle(p.bundle);
            if (bundle != null) {
                return bundle['_config'].paths.has(p.path);
            } else {
                err(`assetBundleManager [has]:${p.bundle}未加载`, path);
                return false;
            }
        }

        /**
         * 从缓存获取纹理或创建新纹理（自动缓存管理）
         * @param img - 图像资源对象
         * @returns 关联的Texture2D对象
         * @example
         * // 获取或创建角色贴图纹理
         * assetBundleManager.loadAny({url: 'assets/characters/hero.png'}, (image) => {
         *   const texture = assetBundleManager.getCachedTexture(image);
         *   this.sprite.texture = texture;
         * });
         */
        public getCachedTexture(img: ImageAsset): Texture2D | null {
            const uuid = img._uuid;
            let texture = this.getCachedAsset<Texture2D>(uuid);
            if (!texture) {
                texture = new Texture2D();
                texture.image = img;
                this.cacheAsset(uuid, texture);
            }
            return texture;
        }

        /**
         * 获取缓存的资源对象
         * @param k - 资源唯一标识符（uuid或url）
         * @returns 缓存的资源实例
         * @example
         * // 获取缓存的音效资源
         * const clip = assetBundleManager.getCachedAsset<AudioClip>('sfx/explosion');
         * audioSource.playOneShot(clip);
         */
        public getCachedAsset<T>(k: string): T {
            return this._cacheAsset.get(k) as T;
        }

        /**
         * 缓存资源对象（支持自定义键名）
         * @param k - 资源唯一标识符（uuid或自定义键名）
         * @param asset - 要缓存的资源对象
         * @example
         * // 缓存网络加载的纹理
         * assetBundleManager.loadRemoteImage('https://example.com/bg.jpg', '.jpg', (sf) => {
         *   assetBundleManager.cacheAsset('remote_bg', sf.texture);
         * });
         */
        public cacheAsset(k: string, asset: any) {
            this._cacheAsset.set(k, asset);
        }

        /**
         * 清理缓存资源并释放引用
         * @param k - 要清理的资源标识符
         * @example
         * // 清理过期的场景资源
         * onSceneUnload() {
         *   assetBundleManager.cleanCacheAsset('scene1_bg_texture');
         *   assetBundleManager.cleanCacheAsset('23fRwXJITKedlPeuQp13Sr');
         * }
         */
        public cleanCacheAsset(k: string) {
            let asset = this._cacheAsset.get(k);
            if (asset) {
                no.assetBundleManager.decRef(asset);
                this._cacheAsset.delete(k);
                this._cacheAsset.delete(asset._uuid);
            }
        }

        /**
         * 缓存纹理资源并初始化引用计数
         * @param image - 需要缓存的Texture2D纹理对象
         * @example
         * // 缓存新加载的纹理资源
         * assetBundleManager.loadRemoteImage('https://example.com/icon.png', '.png', (sf) => {
         *   if (sf.texture) assetBundleManager.cacheImage(sf.texture);
         * });
         */
        public cacheImage(image: Texture2D) {
            this.cacheAsset(image._uuid, image);
            this._cacheAssetRef[image._uuid] = { ref: 0, time: sysTime.now };
            this.releaseUnuseImage();
        }

        /**
         * 检查指定uuid的图片是否已缓存
         * @param uuid - 资源唯一标识符
         * @returns 是否存在于缓存中
         * @example
         * // 检查角色头像是否已缓存
         * if (!assetBundleManager.hasImage('char_avatar_123')) {
         *   this.loadCharacterAvatar();
         * }
         */
        public hasImage(uuid: string): boolean {
            return !!this.getCachedAsset(uuid);
        }

        /**
         * 获取图集JSON配置信息（用于动态图集操作）
         * @param uuid - 图集资源uuid
         * @returns 图集JSON配置
         * @example
         * // 获取UI图集配置信息
         * const atlasConfig = assetBundleManager.getCachedAtlasJson('ui_atlas_01');
         * if (atlasConfig) this.parseAtlas(atlasConfig);
         */
        public getCachedAtlasJson(uuid: string) {
            return this.getCachedAsset(uuid);
        }

        /**
         * 从缓存获取纹理并增加引用计数
         * @param uuid - 纹理资源uuid
         * @returns Texture2D对象或null
         * @example
         * // 获取缓存纹理并设置给精灵
         * const texture = assetBundleManager.getTextureFromCache('item_icon_456');
         * if (texture) this.itemSprite.spriteFrame.texture = texture;
         */
        public getTextureFromCache(uuid: string): Texture2D | null {
            const image = this.getCachedAsset<Texture2D>(uuid);
            if (!image) return null;

            let a = this._cacheAssetRef[image._uuid];
            a.ref++;
            a.time = sysTime.now;
            return image;
        }

        /**
         * 通过缓存纹理创建精灵帧（自动关联纹理）
         * @param uuid - 纹理资源uuid
         * @returns 新创建的SpriteFrame对象
         * @example
         * // 动态创建技能图标精灵帧
         * const sf = assetBundleManager.createSpriteFrameFromCache('skill_icon_789');
         * if (sf) this.skillButton.spriteFrame = sf;
         */
        public createSpriteFrameFromCache(uuid: string): SpriteFrame | null {
            const t = this.getTextureFromCache(uuid);
            if (!t) return null;
            const s = new SpriteFrame();
            s._uuid = uuid;
            s.texture = t;
            return s;
        }

        /**
         * 减少缓存图片的引用计数（当引用为0且超时后会被自动释放）
         * @param uuid - 纹理资源uuid
         * @example
         * // 在节点销毁时减少引用
         * onDestroy() {
         *   assetBundleManager.deRefCachedImage('player_equip_tex');
         * }
         */
        public deRefCachedImage(uuid: string) {
            let a = this._cacheAssetRef[uuid];
            if (!a) return;
            a.ref--;
            a.time = sysTime.now;
            this.releaseUnuseImage();
        }

        /**
         * 获取缓存图片的详细信息（引用计数和缓存时间）
         * @param uuid - 纹理资源uuid
         * @returns 包含引用计数和缓存时间的对象
         * @example
         * // 调试特定纹理的缓存状态
         * const info = assetBundleManager.getCachedImageInfo('boss_texture');
         * console.log(`引用次数：${info.ref} 缓存时间：${Date.now() - info.time}ms`);
         */
        public getCachedImageInfo(uuid: string) {
            return this._cacheAssetRef[uuid];
        }

        /**
         * 显示所有缓存的图片信息（用于调试）
         * @example
         * // 在控制台查看当前所有缓存的图片状态
         * assetBundleManager.showCachedImage();
         * // 输出示例：
         * // <<<<<<<<缓存的Image
         * //     uuid: skill_icon_123,
         * //     ref: 2,
         * //     time: 45000
         * // >>>>>>>> 
         */
        public showCachedImage() {
            const now = sysTime.now;
            for (const uuid in this._cacheAssetRef) {
                const a = this._cacheAssetRef[uuid];
                console.log(`
                    <<<<<<<<缓存的Image
                        uuid: ${uuid},
                        ref: ${a.ref},
                        time: ${now - a.time}
                    >>>>>>>>
                    `);
            }
        }

        /**
         * 自动释放未使用的图片资源（引用计数为0且超过60秒未使用）
         * @private 内部维护用，通常不需要手动调用
         * @example
         * // 在定时任务中自动清理
         * setInterval(() => {
         *   assetBundleManager['releaseUnuseImage']();
         * }, 30000);
         */
        private releaseUnuseImage() {
            const now = sysTime.now;
            for (const k in this._cacheAssetRef) {
                const a = this._cacheAssetRef[k];
                if (a.ref < 1 && now - a.time > 60) {
                    warn('释放未使用的图片资源', k);
                    this.removeCachedImage(k);
                }
            }
        }

        /**
         * 强制移除指定缓存图片（立即释放资源）
         * @param uuid - 要移除的纹理资源uuid
         * @example
         * // 手动释放不再需要的大图资源
         * assetBundleManager.removeCachedImage('scene_bg_high_quality');
         * 
         * // 在场景切换时清理资源
         * onSceneChange() {
         *   assetBundleManager.removeCachedImage('previous_scene_textures');
         * }
         */
        public removeCachedImage(uuid: string) {
            // 注意：这里显式调用destroy可能导致重复释放，具体取决于引擎管理方式
            // this._cacheAsset[uuid]?.destroy();
            this._cacheAsset.delete(uuid);
            delete this._cacheAssetRef[uuid];
            this.release(uuid, true);
        }

        private loadTypes: string[] = ['Texture2D', 'Prefab', 'JsonAsset'];

        /**
         * 加载目录下所有资源并放入缓存中（支持预制体/纹理/JSON类型）
         * @param folder - 资源目录路径（格式：'assets/bundleName/path/to/folder'）
         * @param onComplete - 加载完成回调
         * @example
         * // 加载UI目录下的所有资源到缓存
         * assetBundleManager.loadFolderFilesToCache('assets/ui/main_menu', () => {
         *   console.log('主菜单资源已缓存完成');
         *   this.showMainMenu();
         * });
         * 
         * // 加载角色包中的配置目录
         * assetBundleManager.loadFolderFilesToCache('assets/characters/configs');
         */
        public loadFolderFilesToCache(folder: string, onComplete?: () => void) {
            const p = this.assetPath(folder);
            no.log('loadFolderFilesToCache', p);
            if (p.bundle) {
                const bundle = this.getLoadedBundle(p.bundle),
                    infos = bundle.getDirWithPath(p.path),
                    base = 'db://' + bundle.base.replace(this.server + 'remote', 'assets');
                let requests: { path?: string, uuid?: string }[] = [];
                for (let i = 0; i < infos.length; i++) {
                    const a = infos[i];
                    if (a.uuid.indexOf('@') == -1 && this.loadTypes.includes(a.ctor.name)) {
                        requests[requests.length] = { path: a.path, uuid: a.uuid };
                    }
                }
                this.loadAnyFiles(requests, null, items => {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item instanceof Prefab) {
                        } else if (item instanceof Texture2D) {
                            this.cacheImage(item);
                        } else if (item instanceof JsonAsset) {
                            this.cacheAsset(item._uuid, item.json);
                        }
                    }
                    onComplete?.();
                });
            }
        }

        /**
         * 加载指定资源包内的所有预制体资源
         * @param bundleName - 要加载的资源包名称
         * @param onComplete - 加载完成回调
         * @example
         * // 加载特效包中的所有预制体
         * assetBundleManager.loadAllPrefabsInBundle('effects', () => {
         *   this.initializeSpecialEffects();
         * });
         * 
         * // 加载NPC预制体后实例化
         * assetBundleManager.loadAllPrefabsInBundle('npcs', () => {
         *   const npcPrefab = assetBundleManager.getAssetFromCache('npc_01');
         *   this.spawnNPC(instantiate(npcPrefab));
         * });
         */
        public loadAllPrefabsInBundle(bundleName: string, onComplete?: () => void) {
            const bundle = this.getLoadedBundle(bundleName),
                assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                if (info.ctor?.name == 'Prefab')
                    requests[requests.length] = info.path;
            }
            bundle.load(requests, onComplete);
        }

        /**
         * 加载指定资源包内的所有图片资源
         * @param bundleName - 要加载的资源包名称
         * @param type - 图片资源类型（Texture2D: 纹理对象 / SpriteFrame: 精灵帧 / ImageAsset: 原始图片数据）
         * @param onComplete - 加载完成回调
         * @example
         * // 加载UI包中的所有纹理
         * assetBundleManager.loadAllImagesInBundle('ui', 'Texture2D', () => {
         *   this.updateAllUITextures();
         * });
         * 
         * // 加载角色包中的精灵帧
         * assetBundleManager.loadAllImagesInBundle('characters', 'SpriteFrame', () => {
         *   this.setupCharacterPortraits();
         * });
         * 
         * // 加载原始图片数据用于处理
         * assetBundleManager.loadAllImagesInBundle('gallery', 'ImageAsset', () => {
         *   this.processImageData();
         * });
         */
        public loadAllImagesInBundle(bundleName: string, type: 'Texture2D' | 'SpriteFrame' | 'ImageAsset', onComplete?: () => void) {
            const bundle = this.getLoadedBundle(bundleName),
                assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                if (info.ctor?.name == type)
                    requests[requests.length] = info.path;
            }
            bundle.load(requests, onComplete);
        }

        /**
         * 根据资源类型名称获取对应的资源类定义
         * @param typeName - 资源类型名称（不区分大小写）
         * @returns 对应的资源类构造函数，未找到时返回null
         * @example
         * // 获取纹理资源类
         * const textureType = assetBundleManager.getAssetTypeByName('texture2d');
         * // textureType === Texture2D
         * 
         * // 动态加载预制体资源
         * const prefabType = assetBundleManager.getAssetTypeByName('Prefab');
         * assetBundleManager.loadAny({ path: 'ui/popup', bundle: 'interface', type: prefabType }, (prefab) => {
         *   instantiate(prefab).parent = this.node;
         * });
         */
        public getAssetTypeByName(typeName: string): typeof Asset | typeof ImageAsset {
            switch (typeName.toLowerCase()) {  // 添加小写转换增强容错性
                case 'imageasset':
                    return ImageAsset;
                case 'texture2d':
                    return Texture2D;
                case 'prefab':
                    return Prefab;
                case 'jsonasset':
                    return JsonAsset;
                default:
                    return null;
            }
        }

        /**
         * 预加载所有配置的远程资源包（自动处理依赖关系）
         * @param cb - 全部加载完成后的回调函数
         * @example
         * // 游戏启动时预加载所有远程包
         * assetBundleManager.preloadRemoteBundles(() => {
         *   this.showMainMenu();
         * });
         * 
         * // 关卡加载前预加载资源
         * onLevelStart(levelId) {
         *   assetBundleManager.remoteBundles = [`level_${levelId}_assets`];
         *   assetBundleManager.preloadRemoteBundles(() => this.initLevel());
         * }
         * 
         * // 带进度显示的预加载
         * assetBundleManager.preloadRemoteBundles(() => {
         *   console.log('所有远程资源加载完成');
         * });
         */
        public preloadRemoteBundles(cb?: () => void) {
            const bundles = this.remoteBundles.slice();  // 创建副本避免原数组被修改
            if (!bundles.length) return cb?.();

            log('开始预加载远程包', bundles);
            this.loadBundles(bundles, (progress) => {
                // 可在此处添加进度更新逻辑
                if (progress >= 1) {
                    log('预加载远程包完成');
                    cb?.();
                }
            });
        }
    }

    /**全局资源管理器 */
    export const assetBundleManager = new AssetBundleManager();

    /**
     * 资源加载管理器（处理resources包内资源的加载和缓存）
     * @example
     * // 初始化游戏时预加载核心资源
     * resourcesLoader.preloadFiles(['textures/icon', 'sounds/click'], (p) => {
     *   console.log(`预加载进度: ${p * 100}%`);
     * });
     * 
     * // 动态加载角色预制体
     * resourcesLoader.load('characters/hero', Prefab, (prefab) => {
     *   if (prefab) instantiate(prefab).parent = this.node;
     * });
     */
    class ResourcesLoader {
        /** 资源路径到UUID的映射缓存 */
        private _pathToUuid: Map<string, string> = new Map();
        /** 正在加载中的资源记录（用于防止重复加载） */
        private _loadingAssets: Map<string, number> = new Map();

        /**
         * 预加载多个资源文件
         * @param filePaths - 需要预加载的资源路径数组（格式：'textures/icon'）
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 预加载界面所需资源
         * resourcesLoader.preloadFiles([
         *   'ui/main/button',
         *   'ui/main/bg',
         *   'fonts/main_font'
         * ], (progress) => {
         *   this.loadingBar.progress = progress;
         * });
         */
        public preloadFiles(filePaths: string[], onProgress?: (progress: number) => void): void {
            resources.preload(filePaths, Asset, (finished, total, item) => {
                onProgress && onProgress(finished / total);
            }, (e, items) => {
                if (e) err('preloadFiles', e.message);
            });
        }

        /**
         * 异步加载指定资源（自动处理缓存和引用计数）
         * @param path - 资源路径（格式：'db://assets/resources/textures/icon' 或 'textures/icon'）
         * @param type - 资源类型（支持引擎所有Asset派生类型）
         * @param onComplete - 加载完成回调（失败时返回null）
         * @example
         * // 加载音效资源
         * resourcesLoader.load('sounds/explosion', AudioClip, (clip) => {
         *   if (clip) audioSource.playOneShot(clip);
         * });
         * 
         * // 加载JSON配置
         * resourcesLoader.load('configs/level1', JsonAsset, (jsonAsset) => {
         *   if (jsonAsset) this.levelConfig = jsonAsset.json;
         * });
         * 
         * // 加载失败处理
         * resourcesLoader.load('invalid/path', Texture2D, (texture) => {
         *   if (!texture) this.showErrorToast('资源加载失败');
         * });
         */
        public load(path: string, type: typeof Asset, onComplete: (asset: Asset) => void) {
            const uuid = this._pathToUuid.get(path);
            if (uuid) {
                const asset = assetManager.assets.get(uuid);
                asset.addRef();
                return onComplete?.(asset);
            };

            // 防止重复加载
            if (this._loadingAssets.has(path)) {
                warn(`资源 ${path} 正在加载中，请勿重复请求`);
                return;
            }
            this._loadingAssets.set(path, 1);

            // 转换资源路径格式
            const p = path.replace('db://assets/resources/', '');
            resources.load(p, type, null, (e, asset) => {
                if (e) {
                    err('resources.load', path, e.stack);
                    return onComplete?.(null);
                }

                // 缓存路径到UUID的映射
                this._pathToUuid.set(path, asset._uuid);
                asset.addRef(); // 增加引用计数防止自动释放
                onComplete?.(asset);
                this.assetLoadingEnd(path);
            });
        }

        /**
         * 从缓存中立即获取已加载的资源（不会触发异步加载）
         * @param path - 资源路径
         * @param type - 资源类型
         * @returns 已缓存的资源实例或null
         * @example
         * // 快速获取已加载的纹理
         * const texture = resourcesLoader.loadInCache('effects/fire', Texture2D);
         * if (texture) this.sprite.texture = texture;
         */
        public loadInCache(path: string, type: typeof Asset) {
            const uuid = this._pathToUuid.get(path);
            if (uuid) {
                const asset = assetManager.assets.get(uuid);
                asset.addRef();
                return asset;
            }
            return null;
        }

        /**
         * 检查指定资源是否正在加载中
         * @param path - 资源路径
         * @returns 是否处于加载状态
         * @example
         * // 防止重复加载
         * if (!resourcesLoader.isAssetLoading('ui/popup')) {
         *   resourcesLoader.load('ui/popup', Prefab, this.showPopup.bind(this));
         * }
         */
        public isAssetLoading(path: string): boolean {
            return this._loadingAssets.has(path);
        }

        /**
         * 标记资源加载完成（内部维护用）
         * @param path - 资源路径
         * @example
         * // 在自定义加载流程中手动标记
         * customLoader.load('model', (model) => {
         *   resourcesLoader.assetLoadingEnd('characters/model');
         * });
         */
        public assetLoadingEnd(path: string) {
            this._loadingAssets.delete(path);
        }
    }
    /**resources包资源加载器 */
    export const resourcesLoader = new ResourcesLoader();

    /** 
     * 对象缓存池系统（支持节点和资源缓存）
     * @example
     * // 缓存敌人预制体
     * const enemy = cachePool.reuse<Prefab>('enemy_prefab');
     * if (!enemy) {
     *     assetBundleManager.loadAny({url: 'assets/enemy.prefab'}, (p) => {
     *         cachePool.recycle('enemy_prefab', p);
     *     });
     * }
     * 
     * // 缓存网络请求数据
     * cachePool.recycle('player_data', apiResponse, false);
     */
    export class CachePool {
        private cacheMap: Map<string, { o: any, t: number }[]>;
        private checkDuration = 60000;
        constructor() {
            this.cacheMap = new Map<string, any[]>();
            setInterval(() => {
                this.checkClear();
            }, this.checkDuration / 2);
        }

        /**
         * 从缓存池获取可重用对象
         * @param type 缓存类型标识符（如：'bullet_node'/'enemy_prefab'）
         * @returns 缓存对象或null
         * @example
         * // 获取子弹节点
         * const bullet = cachePool.reuse<Node>('bullet_node');
         * if (bullet) this.fireBullet(bullet);
         */
        public reuse<T>(type: string): T | null {
            if (!this.cacheMap.has(type)) return null;
            let a = this.cacheMap.get(type).pop();
            if (!a) return null;
            return a.o as T;
        }

        /**
         * 回收对象到缓存池
         * @param type 缓存类型标识符
         * @param object 要回收的对象（支持节点/资源/普通对象）
         * @param canRelease 是否允许自动释放（设为false可长期保留重要资源）
         * @param changeParent 是否重置父节点（解决节点树残留问题）
         * @example
         * // 回收敌人节点
         * onEnemyDie(enemy: Node) {
         *     cachePool.recycle('enemy_node', enemy, true, false);
         * }
         * 
         * // 回收临时纹理资源
         * cachePool.recycle('temp_texture', texture, false);
         */
        public recycle(type: string, object: any, canRelease = true, changeParent = true): void {
            if (type == null || type == '') {
                log(`${object.name}未指定回收类型，不做回收处理，直接销毁`);
                this._clear(object);
                return;
            }
            if (!this.cacheMap.has(type)) this.cacheMap.set(type, []);
            if (object instanceof Node) {
                if (changeParent)
                    object.parent = null;
                visible(object, false);
            }
            let a = this.cacheMap.get(type) || [];
            let have = false;
            for (let i = 0, n = a.length; i < n; i++) {
                let b = a[i];
                if ((object._uuid && b.o._uuid == object._uuid) || (object._uuid && b.o._uuid == object._uuid)) {
                    have = true;
                    break;
                }
            }
            if (have) return;
            a.push({
                o: object,
                t: sysTime.now + (canRelease ? 0 : 999999)
            });
            this.cacheMap.set(type, a);
        }

        /**
         * 获取指定类型可用缓存数量
         * @param type 缓存类型标识符
         * @example
         * // 检查子弹缓存是否充足
         * if (cachePool.canReuseNumber('bullet') < 10) {
         *     this.preloadBullets();
         * }
         */
        public canReuseNumber(type: string): number {
            return (this.cacheMap.get(type) || []).length;
        }

        /**
         * 清空所有缓存（切换场景时建议调用）
         * @example
         * // 切换关卡时清理
         * onLevelChange() {
         *     cachePool.clearAll();
         * }
         */
        public clearAll(): void {
            let types = MapKeys2Array(this.cacheMap);
            let n = types.length;
            for (let i = 0; i < n; i++) {
                this.clear(types[i]);
            }
        }

        /**
         * 清理指定类型缓存
         * @param type 缓存类型标识符
         * @example
         * // 清理过期的对话缓存
         * cachePool.clear('dialogue_data');
         */
        public clear(type: string): void {
            let arr = this.cacheMap.get(type);
            if (!arr) return;
            this.cacheMap.delete(type);
            for (let i = arr.length - 1; i >= 0; i--) {
                let a = arr[i];
                this._clear(a.o);
            }
        }

        /** 内部清理方法 */
        private _clear(obj: any): void {
            if (obj instanceof Node) obj.destroy();
            else if (obj instanceof Asset) assetBundleManager.release(obj);
            else obj = null;
        }

        /** 定时检查过期缓存 */
        private checkClear() {
            let t = timestamp();
            let types = MapKeys2Array(this.cacheMap);
            for (let j = 0; j < types.length; j++) {
                let type = types[j];
                let arr = this.cacheMap.get(type) || [];
                for (let i = arr.length - 1; i >= 0; i--) {
                    let a = arr[i];
                    if (t - a.t >= this.checkDuration) {
                        arr.splice(i, 1);
                        this._clear(a.o);
                    }
                }
                if (arr.length == 0) this.cacheMap.delete(type);
            }
        }
    }
    /**全局缓存池,适用于非节点数据或节点的父节点不固定的情况，如果是节点且其父节点固定，用全局缓存池会导致dc增加 */
    export const cachePool = new CachePool();

    /** 
     * 红点管理类 
     * @example
     * // 初始化红点系统
     * hintCenter.onHint('mail', (count, type) => {
     *   this.updateMailRedDot(count);
     * }, this);
     * 
     * // 设置任务红点数量
     * hintCenter.setHint('dailyTask', 3);
     * 
     * // 设置带时间戳的红点（明天12点触发）
     * hintCenter.setHintTimestamp('activity', Date.now() + 86400000);
     */
    class HintCenter extends Event {
        /** 存储红点类型与对应数值 */
        private data: Map<string, number> = new Map<string, number>();
        /** 子类型到主类型的映射表 */
        private sub2Main: { [subType: string]: string } = {};
        /** 主类型到子类型的映射表 */
        private main2Subs: { [mainType: string]: string[] } = {};
        /** 时间戳触发记录 */
        private timestampHit: object = new Object();

        constructor() {
            super();
            // 每2秒检查一次时间戳触发
            setInterval(() => {
                this.checkHint();
            }, 2000);
        }

        /**
         * 设置红点状态
         * @param type 红点类型标识
         * @param v 红点显示数量（0为隐藏）
         * @example
         * // 设置邮件红点数量
         * hintCenter.setHint('mail', 5);
         * 
         * // 清除成就红点
         * hintCenter.setHint('achievement', 0);
         */
        public setHint(type: string, v: number) {
            v = float(v, 0);
            this.data.set(type, v);
            this.checkHintType(type);
        }

        /**
         * 设置主红点状态（直接设置不检查子类型）
         * @param type 主红点类型
         * @param v 红点显示数量
         * @example
         * // 强制设置主界面红点
         * hintCenter.setMainHint('mainUI', 1);
         */
        public setMainHint(type: string, v: number): void {
            v = float(v, 0);
            this.data.set(type, v);
            this.emit(type, v, type);
        }

        /**
         * 修改红点数值（增量方式）
         * @param type 红点类型
         * @param v 变化量（可正负）
         * @example
         * // 增加未读邮件
         * hintCenter.changeHint('mail', 1);
         * 
         * // 减少任务数量
         * hintCenter.changeHint('quest', -1);
         */
        public changeHint(type: string, v: number): void {
            v = float(v, 0);
            let a = this.getHintValue(type) || 0;
            a += v;
            if (a < 0) a = 0;
            this.setHint(type, a);
        }

        /**
         * 添加子类型关联关系
         * @param type 主红点类型
         * @param subTypes 子类型或子类型数组
         * @example
         * // 将任务子类型关联到主任务红点
         * hintCenter.addSubType('taskMain', ['dailyTask', 'achievementTask']);
         */
        public addSubType(type: string, subTypes: string | string[]): void {
            subTypes = [].concat(subTypes);
            for (let i = 0, n = subTypes.length; i < n; i++) {
                const subType = subTypes[i];
                if (this.sub2Main[subType] == type) return;
                if (!this.data.has(type))
                    this.data.set(type, 0);
                this.sub2Main[subType] = type;
                if (this.main2Subs[type] == null) this.main2Subs[type] = [];
                no.addToArray(this.main2Subs[type], subType);
            }
        }

        /**
         * 移除子类型关联
         * @param type 主红点类型
         * @param subType 要移除的子类型
         * @example
         * // 移除过期的活动子类型
         * hintCenter.removeSubType('activity', 'xmasEvent');
         */
        public removeSubType(type: string, subType: string): void {
            delete this.sub2Main[subType];
            no.removeFromArray(this.main2Subs[type], subType);
        }

        /**
         * 监听红点状态变化
         * @param type 要监听的红点类型
         * @param func 回调函数 function(count: number, type: string)
         * @param target 监听目标
         * @example
         * // 监听邮件红点变化
         * hintCenter.onHint('mail', (count, type) => {
         *   this.mailIcon.redDot = count > 0;
         * }, this);
         */
        public onHint(type: string, func: Function, target: any): void {
            this.on(type, func, target);
            if (this.data.has(type)) {
                this.checkHintType(type);
            }
        }

        /**
         * 移除指定目标的所有红点监听
         * @param target 要移除的监听目标
         * @example
         * // 在界面销毁时移除监听
         * onDestroy() {
         *   hintCenter.offHint(this);
         * }
         */
        public offHint(target: any): void {
            this.targetOff(target);
        }

        /**
         * 设置时间戳触发的红点
         * @param type 红点类型
         * @param time 触发时间戳（单位：毫秒）
         * @example
         * // 设置整点刷新红点
         * const nextHour = Date.now() + 3600000 - (Date.now() % 3600000);
         * hintCenter.setHintTimestamp('hourlyRefresh', nextHour);
         */
        public setHintTimestamp(type: string, time: number): void {
            if (time < timestamp()) {
                return;
            } else {
                if (this.timestampHit[type] == null || this.timestampHit[type] > time)
                    this.timestampHit[type] = time;
            }
        }

        /**
         * 获取指定红点的当前数值
         * @param type 红点类型
         * @returns 当前红点数值（不存在返回null）
         * @example
         * // 检查背包红点状态
         * const count = hintCenter.getHintValue('backpack');
         * if (count > 0) this.showBagRedDot();
         */
        public getHintValue(type: string): number {
            if (this.data.has(type)) return this.data.get(type);
            return null;
        }

        /** 定时检查时间戳触发 */
        private checkHint(): boolean {
            forEachKV(this.timestampHit, (type, value) => {
                if (value <= timestamp()) {
                    this.setHint(type, 1);
                    delete this.timestampHit[type];
                }
                return false;
            });
            return true;
        }

        /** 触发红点状态更新 */
        private checkHintType(type: string) {
            const mainType = this.sub2Main[type];
            if (!mainType || mainType != type) {
                this.emit(type, this.getHintValue(type) || 0, type);
            }
            if (!mainType) return;

            const subTypes = this.main2Subs[mainType];
            let n = 0;
            if (subTypes) {
                let b: number[] = [];
                for (let i = 0, m = subTypes.length; i < m; i++) {
                    const a = this.getHintValue(subTypes[i]);
                    if (a != null) b.push(a);
                }
                if (b.length > 0) {
                    n = b.reduce((a, b) => a + b);
                    this.data.set(mainType, n);
                } else {
                    n = this.data.get(mainType) || 0;
                }
            }
            this.emit(mainType, n, mainType);
        }

        /**
         * 清空所有红点数据
         * @example
         * // 用户登出时重置
         * onLogout() {
         *   hintCenter.clear();
         * }
         */
        public clear() {
            this.data.clear();
            this.timestampHit = {};
        }
    }
    /**全局红点管理器 */
    export const hintCenter = new HintCenter();

    let units = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",];
    /**用科学计数格式表示的字符串 */
    export class ScientificString {
        /** 系数（1 ≤ |系数| < 10） */
        private _coefficient: number = 0;
        /** 指数（10的幂次） */
        public index: number = 0;

        /**
         * 构造科学计数法字符串
         * @param v - 初始化值（支持数字/字符串/已有科学计数对象）
         * @example
         * // 从对象初始化
         * new ScientificString({_coefficient: 1.5, index: 3}); // 1.5E3
         * // 从数字初始化
         * new ScientificString(2500); // 2.5E3
         * // 从字符串初始化
         * new ScientificString("3.6E8"); // 3.6E8
         */
        constructor(v?: string | number | { _coefficient: number, index: number }) {
            v = v || 0;
            if (v['_coefficient'] !== undefined) {
                this._coefficient = v['_coefficient'];
                this.index = v['index'];
            }
            else
                this.value = String(v);
        }

        /** 新建零值科学计数对象 */
        public static get new(): ScientificString {
            return new ScientificString(0);
        }

        /**
         * 设置数值（自动解析为科学计数格式）
         * @example
         * // 设置普通数字
         * ss.value = 1234; // 转换为1.234E3
         * // 设置科学计数字符串
         * ss.value = "5.67E+5"; // 转换为5.67E5
         */
        public set value(v: string | number) {
            if (v == null) return;
            if (typeof v == 'number') {
                v = String(v);
            }
            if (v != null && v != '') {
                v = v.toUpperCase();
                if (!v.includes('E')) {
                    v = Number(v).toExponential().toUpperCase();
                }
                let e = v.split('E');
                this._coefficient = Number(e[0]);
                this.index = Number(e[1]);
            }
        }

        /** 获取科学计数法字符串表示 */
        public get value(): string {
            return `${this._coefficient}E${this.index}`;
        }

        /**
         * 链式设置值
         * @example
         * new ScientificString().setValue("2.5E3").add(100);
         */
        public setValue(v: string | number): ScientificString {
            this.value = v;
            return this;
        }

        /** 获取/设置系数（设置时会自动调整指数） */
        public get coefficient(): number {
            return this._coefficient;
        }

        public set coefficient(v: number) {
            if (v == 0 || v == null) {
                this._coefficient = 0;
                this.index = 0;
            } else {
                let e = v.toExponential().toUpperCase().split('E');
                this._coefficient = Number(e[0]);
                this.index += Number(e[1]);
            }
        }

        /**
         * 创建副本
         * @example
         * const original = new ScientificString("3E8");
         * const copy = original.clone; // 独立副本
         */
        public get clone(): ScientificString {
            let a = ScientificString.new;
            a._coefficient = this.coefficient;
            a.index = this.index;
            return a;
        }

        /**
         * 复制到目标对象
         * @param other - 目标科学计数对象（将被覆盖）
         * @example
         * const source = new ScientificString("1.2E5");
         * const target = new ScientificString();
         * source.cloneTo(target); // target变为1.2E5
         */
        public cloneTo(other: ScientificString) {
            if (other == null) return;
            this._coefficient = other._coefficient;
            this.index = other.index;
        }

        /**
         * 加法运算（支持链式调用）
         * @param other - 要相加的值（科学计数对象/数字/字符串）
         * @returns 当前对象的新值
         * @example
         * // 实例方法使用
         * const a = new ScientificString("1.2E3");
         * a.add("3E2").toString(); // 结果："1.5E3"
         * 
         * // 链式调用
         * new ScientificString(5e4).add(2.5e3).add("1E5"); // 结果："1.525E5"
         */
        public add(other: ScientificString | number | string): ScientificString {
            if (other == null) return this;
            if (other instanceof ScientificString) {
                this.coefficient = add(this._coefficient, other._coefficient * Math.pow(10, other.index - this.index));
            } else {
                other = new ScientificString(other);
                this.add(other);
            }
            return this;
        }

        /**
         * 静态加法运算（适合快速计算）
         * @param s1 - 被加数字符串
         * @param s2 - 加数字符串
         * @param out - 可选输出对象（避免重复创建对象）
         * @returns 计算结果的新实例
         * @example
         * // 直接计算两个科学计数字符串的和
         * ScientificString.add("2.5E3", "1.2E4").toString(); // 结果："1.45E4"
         * 
         * // 复用输出对象
         * const result = new ScientificString();
         * ScientificString.add("3E8", "5E7", result); // result值为3.5E8
         */
        public static add(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let sc2 = new ScientificString(s2);
            out.add(sc2);
            return out;
        }

        /**
         * 减法运算（支持链式调用）
         * @param other - 要相减的值（科学计数对象/数字/字符串）
         * @returns 当前对象的新值
         * @example
         * // 实例方法使用
         * new ScientificString("5E3").minus("2E3").toString(); // 结果："3E3"
         * 
         * // 混合类型计算
         * new ScientificString(1e5).minus(25000).toString(); // 结果："7.5E4"
         */
        public minus(other: ScientificString | number | string): ScientificString {
            if (other == null) return this;
            if (other instanceof ScientificString) {
                this.coefficient = minus(this._coefficient, other._coefficient * Math.pow(10, other.index - this.index));
            } else {
                other = new ScientificString(other);
                this.minus(other);
            }
            return this;
        }

        /**
         * 静态减法运算
         * @param s1 - 被减数字符串
         * @param s2 - 减数字符串
         * @param out - 可选输出对象
         * @returns 计算结果的新实例
         * @example
         * // 计算能量差值
         * ScientificString.minus("1.5E6", "7.5E5").toString(); // 结果："7.5E5"
         */
        public static minus(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let s = new ScientificString(s2);
            out.minus(s);
            return out;
        }

        /**
         * 乘法运算（支持链式调用）
         * @param other - 要相乘的值（科学计数对象/数字/字符串）
         * @returns 当前对象的新值
         * @example
         * // 计算面积
         * new ScientificString("2.5E3").mul("3E2").toString(); // 结果："7.5E5"
         * 
         * // 连续相乘
         * new ScientificString(2).mul(1e3).mul("4E2"); // 结果："8E5"
         */
        public mul(other: ScientificString | number | string): ScientificString {
            if (other == null) return this;
            if (other instanceof ScientificString) {
                this.coefficient = mutiply(this._coefficient, other._coefficient);
                this.index += other.index;
            } else {
                other = new ScientificString(other);
                this.mul(other);
            }
            return this;
        }

        /**
         * 静态乘法运算
         * @param s1 - 被乘数字符串
         * @param s2 - 乘数字符串
         * @param out - 可选输出对象
         * @returns 计算结果的新实例
         * @example
         * // 计算功率（电压×电流）
         * ScientificString.mul("2.2E3", "1.5E3").toString(); // 结果："3.3E6"
         */
        public static mul(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let s = new ScientificString(s2);
            out.mul(s);
            return out;
        }

        /**
         * 除法运算（支持链式调用）
         * @param other - 要相除的值（科学计数对象/数字/字符串）
         * @returns 当前对象的新值
         * @example
         * // 计算密度
         * new ScientificString("6E3").div("2E1").toString(); // 结果："3E2"
         * 
         * // 混合类型计算
         * new ScientificString(1e6).div(2e2).toString(); // 结果："5E3"
         */
        public div(other: ScientificString | number | string): ScientificString {
            if (other == null) return this;
            if (other instanceof ScientificString) {
                this.coefficient = divide(this._coefficient, other._coefficient);
                this.index -= other.index;
            } else {
                other = new ScientificString(other);
                this.div(other);
            }
            return this;
        }

        /**
         * 静态除法运算
         * @param s1 - 被除数字符串
         * @param s2 - 除数字符串
         * @param out - 可选输出对象
         * @returns 计算结果的新实例
         * @example
         * // 计算速度（距离/时间）
         * ScientificString.div("1.5E3", "5E0").toString(); // 结果："3E2"
         */
        public static div(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let s = new ScientificString(s2);
            out.div(s);
            return out;
        }

        /**
         * 值比较（支持与多种类型比较）
         * @param other - 比较对象（支持科学计数对象/数字/字符串）
         * @returns 负值：当前对象小于比较对象，0：等于，正值：当前对象大于比较对象
         * @example
         * // 比较两个科学计数对象
         * const a = new ScientificString("1.5E3");
         * const b = new ScientificString("2E3");
         * a.compareTo(b); // 返回-0.5
         * 
         * // 与数字直接比较
         * new ScientificString("3E5").compareTo(250000); // 返回0.5
         * 
         * // 与字符串比较
         * new ScientificString("5E8").compareTo("1E9"); // 返回-0.5
         */
        public compareTo(other: ScientificString | string | number): number {
            if (other == null) return 1;
            if (!(other instanceof ScientificString))
                other = new ScientificString(other);
            if (this.index == other.index) {
                return this.coefficient - other.coefficient;
            } else {
                return this.index > other.index ? 1 : -1;
            }
        }

        /**
         * 静态值比较方法（适合快速比较两个字符串值）
         * @param s1 - 科学计数字符串1（格式如"1.2E3"）
         * @param s2 - 科学计数字符串2（格式如"1.5E3"）
         * @returns 负值：s1 < s2，0：等于，正值：s1 > s2
         * @example
         * // 直接比较两个字符串值
         * ScientificString.compareTo("3.6E8", "3.6E8"); // 返回0
         * ScientificString.compareTo("2E5", "3E5"); // 返回-1
         */
        public static compareTo(s1: string, s2: string): number {
            if (s1 == null) return -1;
            if (s2 == null) return 1;
            let e1 = new ScientificString(s1),
                e2 = new ScientificString(s2);
            return e1.compareTo(e2);
        }

        /** 
         * 带单位的格式化值（自动处理千分位单位）
         * @example
         * new ScientificString(1500).unitValue;   // "1500"
         * new ScientificString(15000).unitValue;  // "15k" 
         * new ScientificString(1.5e6).unitValue;  // "1.5m"
         * new ScientificString(3e9).unitValue;    // "3b"
         * new ScientificString(5e12).unitValue;   // "5A"
         */
        public get unitValue(): string {
            if (this.index < 3) {
                return `${this.numberValue}`;
            }
            let a = floor(this.index / 3),
                b = this.index % 3,
                u: string;
            if (a < 4) {
                u = ["k", "m", "b"][a - 1];
            } else {
                u = this.getUnit(a - 3);
            }
            return `${floor(mutiply(this._coefficient, Math.pow(10, b + 2))) / 100}${u}`;
        }

        /**
         * 递归生成单位字符串（内部使用）
         * @param a - 单位层级（每26个字母进位）
         * @returns 组合单位字符串
         * @example
         * getUnit(1) => "A"
         * getUnit(26) => "Z"
         * getUnit(27) => "AA"
         * getUnit(28) => "AB"
         */
        private getUnit(a: number): string {
            let u: string;
            let len = units.length;
            a -= 1;
            if (a < len)
                u = units[a];
            else {
                let c = floor(a / len);
                u = units[a % len];
                u = this.getUnit(c) + u;
            }
            return u;
        }

        /** 
         * 获取原始数值（将科学计数转换为普通数字）
         * @example
         * new ScientificString("1.5E3").numberValue; // 1500
         * new ScientificString("3E8").numberValue;   // 300000000
         */
        public get numberValue(): number {
            return mutiply(this._coefficient, Math.pow(10, this.index));
        }

        /**
         * 带单位字符串格式化（支持自定义单位体系）
         * @param units - 自定义单位数组（需按单位量级顺序排列）
         * @param step - 单位换算步进值（默认每3位进一个单位，如千/百万等）
         * @param digits - 保留小数位数（默认2位）
         * @returns 格式化后的字符串 如：1.23AA / 4.56万
         * @example
         * // 使用中文单位体系
         * new ScientificString(12345).toUnitString(["", "万", "亿"], 4); // "1.23万"
         * 
         * // 使用自定义游戏单位
         * new ScientificString(1e6).toUnitString(["K", "M", "B"], 3); // "1.00M"
         * 
         * // 处理极小数值
         * new ScientificString(123).toUnitString(["千"], 3, 0); // "123"
         */
        public toUnitString(units: string[], step = 3, digits = 2): string {
            if (this.index < step) {
                return `${float(mutiply(this._coefficient, Math.pow(10, this.index)), digits)}`;
            }
            let a = floor(this.index / step),
                b = this.index % step,
                u: string = units[a - 1];
            return `${float(mutiply(this._coefficient, Math.pow(10, b)), digits)}${u}`;
        }

        /**
         * 取负值到一个新的ScientificString（保持原对象不变）
         * @returns 新的负值ScientificString实例
         * @example
         * // 转换正值
         * new ScientificString(1500).toNegative().toString(); // "-1.5E3"
         * 
         * // 链式调用
         * new ScientificString(2e5).add(3e4).toNegative();
         */
        public toNegative(): ScientificString {
            let a = this.clone;
            a._coefficient = -Math.abs(a._coefficient);
            return a;
        }

        /**
         * 取正值到一个新的ScientificString（保持原对象不变）
         * @returns 新的正值ScientificString实例
         * @example
         * // 确保数值为正
         * new ScientificString(-5e3).toPositive().toString(); // "5E3"
         * 
         * // 处理用户输入
         * const userInput = new ScientificString("-3.2E4");
         * const safeValue = userInput.toPositive();
         */
        public toPositive(): ScientificString {
            let a = this.clone;
            a._coefficient = Math.abs(a._coefficient);
            return a;
        }

        /**
         * 静态方法快速转换单位字符串（使用内置单位体系）
         * @param v - 要转换的数值（支持数字/科学计数字符串）
         * @returns 自动单位转换后的字符串
         * @example
         * // 快速转换数值
         * ScientificString.toUnitString(2500); // "2.5k"
         * 
         * // 转换科学计数
         * ScientificString.toUnitString("3.6E8"); // "360M"
         */
        public static toUnitString(v: string | number): string {
            const a = new ScientificString(v);
            return a.unitValue;
        }
    }

    export function scientificString(v: number | string): ScientificString {
        return new ScientificString(v);
    }

    /** 
     * 关系查询引擎（支持多条件组合查询和嵌套查询）
     * @example
     * // 初始化查询引擎
     * const query = RelationQuery.new;
     * 
     * // 简单查询示例
     * query.select('userTable where id==1001', {userTable});
     * 
     * // 复杂嵌套查询示例
     * query.select('orderTable[userId,price] where createTime>="2024-01" and status in (1,3) or (productTable.category=="电子产品")', tables);
     */
    export class RelationQuery {

        /** 条件表达式缓存（提升重复条件解析性能） */
        private expMap: Map<string, { k: string, symbol: string, v: any }>;
        /** 当前查询的表数据集 */
        private _tableDatas: any;

        /** 工厂方法创建新实例 */
        public static get new(): RelationQuery {
            return new RelationQuery();
        }

        /** 初始化条件解析缓存 */
        constructor() {
            this.expMap = new Map<string, { k: string, symbol: string, v: any }>();
        }

        /**
         * 单表查询（自动处理单条/多条结果）
         * @param expression 查询表达式
         *   格式：'表名[字段1,字段2] where 条件'
         *   条件支持：==, !=, >, <, >=, <=, ?= (包含), in (集合)
         *   示例：'userTable[id,name] where age>18 and dept in (技术部,市场部)'
         * @param tableDatas 表数据对象 {表名: 数据表}
         * @returns 查询结果（单条数据直接返回对象，多条返回数组）
         * 
         * @example
         * // 查询用户表中管理员用户
         * select('adminUsers where role=="admin"', {adminUsers: userData});
         * 
         * // 带字段筛选的查询
         * select('products[name,price] where stock>0', productTables);
         */
        public select(expression: string, tableDatas: any): any {
            let a = this.selectList(expression, tableDatas) || [];
            return a.length <= 1 ? a[0] : a;
        }

        /**
         * 执行查询并始终返回数组结果
         * @param expression 查询表达式
         * @param tableDatas 表数据集合
         * @returns 查询结果数组（即使只有单条结果）
         * 
         * @example
         * // 获取所有库存大于100的商品
         * selectList('products where stock>100', {products});
         * 
         * // 多条件组合查询
         * selectList('orders where status==1 and totalPrice>=500', {orders});
         */
        public selectList(expression: string, tableDatas: any): any[] {
            this._tableDatas = tableDatas;
            expression = this.parseBrackets(expression);
            let arr = [];
            let exps = expression.split(' where ');
            let table = exps[0].split('.');
            let tableData = tableDatas[table[0]];

            // 处理WHERE条件
            if (exps[1]) {
                let query = exps[1];
                let queryies = this.parseOr(query);
                forEachKV(tableData, (key, value) => {
                    if (this.checkConditions(value, queryies))
                        arr.push(value);
                    return false;
                });
            } else { // 无WHERE条件全表扫描
                forEachKV(tableData, (key, value) => {
                    arr.push(value);
                    return false;
                });
            }

            // 处理字段选择
            if (table[1] != null && arr.length >= 1) {
                let b = [];
                for (let i = 0; i < arr.length; i++) {
                    b.push(this.getQueryValue(arr[i], table[1]));
                }
                return b;
            } else if (table[1] == null) {
                return arr;
            }
        }

        /** 从数据对象中提取指定字段（支持多字段选择） */
        private getQueryValue(tableData: any, keys: string): any {
            keys = keys.replace(new RegExp('\\[|\\]', 'g'), '');
            let a = keys.split(',');
            if (a.length == 1) return tableData[a[0]];
            let b: any = {};
            for (let i = 0; i < a.length; i++) {
                b[a[i]] = tableData[a[i]];
            }
            return b;
        }

        /** 解析OR逻辑条件组 */
        private parseOr(str: string): string[][] {
            let queryies: string[][] = [];
            let ands = str.split(' or ');
            for (let i = 0; i < ands.length; i++) {
                queryies.push(this.parseAnd(ands[i]));
            }
            return queryies;
        }

        /** 解析AND逻辑条件组 */
        private parseAnd(str: string): string[] {
            return str.split(' and ');
        }

        /** 处理括号嵌套查询（支持多层嵌套） */
        private parseBrackets(exp: string): string {
            if (!exp.includes('(') && !exp.includes(')')) return exp;
            let i1 = exp.indexOf('('),
                i2 = exp.lastIndexOf(')');
            let sub = exp.substring(i1 + 1, i2);
            let a = this.select(sub, this._tableDatas);
            return exp.replace(exp.substring(i1, i2 + 1), String(a));
        }

        /** OR条件判断（任一条件组满足即返回true） */
        private checkConditions(d: any, conditions: string[][]): boolean {
            if (conditions != null) {
                let n = conditions.length;
                for (let i = 0; i < n; i++) {
                    let condition = conditions[i];
                    if (this.check(d, condition)) return true;
                }
                return false;
            } else {
                return true;
            }
        }

        /** AND条件判断（所有条件必须同时满足） */
        private check(d: any, conditions: string[]): boolean {
            let n = conditions.length;
            for (let i = 0; i < n; i++) {
                let condition = conditions[i];
                let exp = this.condition2Express(condition);

                let b: boolean;
                switch (exp.symbol) {
                    case '==':
                        b = d[exp.k] == exp.v;
                        break;
                    case '!=':
                        b = d[exp.k] != exp.v;
                        break;
                    case '>=':
                        b = d[exp.k] >= exp.v;
                        break;
                    case '<=':
                        b = d[exp.k] <= exp.v;
                        break;
                    case '>':
                        b = d[exp.k] > exp.v;
                        break;
                    case '<':
                        b = d[exp.k] < exp.v;
                        break;
                    case '?=':
                        b = (d[exp.k] as string).includes(exp.v);
                        break;
                    case 'in':
                        b = (exp.v.split(',')).includes(d[exp.k]);
                        break;
                }
                if (!b) return false;
            }
            return true;
        }

        /** 将条件字符串解析为结构化对象（带缓存优化） */
        private condition2Express(condition: string): { k: string, symbol: string, v: any } {
            if (this.expMap.has(condition)) return this.expMap.get(condition);

            let r = { k: '', symbol: '', v: null };
            condition = condition.trim();
            // 解析各种比较运算符
            if (condition.includes('==')) {
                r.symbol = '==';
                let a = condition.split('==');
                r.k = a[0].trim();
                r.v = a[1].trim();
            } else if (condition.includes('!=')) {
                r.symbol = '!=';
                let a = condition.split('!=');
                r.k = a[0].trim();
                r.v = a[1].trim();
            } else if (condition.includes('>=')) {
                r.symbol = '>=';
                let a = condition.split('>=');
                r.k = a[0].trim();
                r.v = Number(a[1].trim());
            } else if (condition.includes('<=')) {
                r.symbol = '<=';
                let a = condition.split('<=');
                r.k = a[0].trim();
                r.v = Number(a[1].trim());
            } else if (condition.includes('>')) {
                r.symbol = '>';
                let a = condition.split('>');
                r.k = a[0].trim();
                r.v = Number(a[1].trim());
            } else if (condition.includes('<')) {
                r.symbol = '<';
                let a = condition.split('<');
                r.k = a[0].trim();
                r.v = Number(a[1].trim());
            } else if (condition.includes('?=')) { // 字符串包含判断
                r.symbol = '?=';
                let a = condition.split('?=');
                r.k = a[0].trim();
                r.v = a[1].trim();
            } else if (condition.includes('in')) { // 集合包含判断
                r.symbol = 'in';
                let a = condition.split('in');
                r.k = a[0].trim();
                r.v = a[1].trim();
            }
            this.expMap.set(condition, r);
            return r;
        }
    }

    /**
     * 轻量级内存数据库（支持多表CRUD操作）
     * @example
     * // 初始化数据库
     * const db = new Database();
     * 
     * // 创建用户表并插入数据
     * db.setTable('users', {
     *   1001: { name: 'Alice', level: 5 },
     *   1002: { name: 'Bob', level: 3 }
     * });
     */
    class Database {
        private _tables: any;

        constructor() {
            this._tables = new Object();
        }

        /**
         * 创建/重置数据表
         * @param name - 表名称（需唯一）
         * @param data - 表数据（默认为空对象）
         * @example
         * // 创建空订单表
         * db.setTable('orders');
         */
        public setTable(name: string, data = {}) {
            this._tables[name] = data;
        }

        /**
         * 多表联合查询
         * @param tableNames - 要查询的表名数组
         * @param expression - RelationQuery查询表达式
         * @returns 查询结果（单条对象或多条数组）
         * @example
         * // 查询用户等级大于3的玩家
         * const result = db.select(['users'], 'users where level>3');
         * 
         * // 多表联合查询
         * db.select(['users', 'items'], 'users[id,name] where items.ownerId==users.id');
         */
        public select(tableNames: string[], expression: string): any {
            let datas = {};
            for (let i = 0; i < tableNames.length; i++) {
                datas[tableNames[i]] = this._tables[tableNames[i]];
            }
            return RelationQuery.new.select(expression, datas);
        }

        /**
         * 插入单条数据
         * @param tableName - 目标表名
         * @param id - 数据主键（支持字符串/数字）
         * @param value - 要插入的数据
         * @returns 更新后的整张表数据
         * @example
         * // 添加新用户
         * db.insert('users', 1003, { name: 'Charlie', level: 1 });
         */
        public insert(tableName: string, id: string | number, value: any): any {
            this._tables[tableName] = this._tables[tableName] || {};
            this._tables[tableName][id] = value;
            return this._tables[tableName];
        }

        /**
         * 删除单条数据
         * @param tableName - 目标表名
         * @param id - 要删除的数据主键
         * @returns 被删除的数据（不存在时返回null）
         * @example
         * // 删除ID为1002的用户
         * const deletedUser = db.delete('users', 1002);
         */
        public delete(tableName: string, id: string | number): any {
            if (!this._tables[tableName]) return null;
            let a = this._tables[tableName][id];
            delete this._tables[tableName][id];
            return a;
        }

        /**
         * 更新数据字段
         * @param tableName - 目标表名
         * @param path - 数据路径（支持点语法或数组）
         * @param value - 要更新的值
         * @returns 更新后的整张表数据
         * @example
         * // 更新用户等级
         * db.update('users', '1001.level', 6);
         * 
         * // 使用数组路径更新嵌套数据
         * db.update('players', ['1001', 'skills', 'fireball'], 3);
         */
        public update(tableName: string, path: string | string[], value: any): any {
            if (!this._tables[tableName]) return null;
            if (typeof path == 'string')
                setValue(this._tables[tableName], path, value);
            else setValuePath(this._tables[tableName], path, value);
            return this._tables[tableName];
        }
    }
    /** 数据库单例 */
    export const database = new Database();

    /**
     * HTTP请求工具类（支持GET/POST方法）
     * @example
     * // 初始化带认证的请求实例
     * const http = new HttpRequest('Bearer xxxxx');
     * 
     * // 发送GET请求
     * http.get('https://api.example.com/data').then(console.log);
     * 
     * // 发送带参数的POST请求
     * http.post('https://api.example.com/user', { name: 'John', age: 25 });
     */
    export class HttpRequest {
        /** 授权令牌（用于身份验证） */
        private Authorization: string;

        /**
         * 创建HTTP请求实例
         * @param author - 认证令牌（如JWT/Bearer Token）
         * @example
         * // 使用OAuth令牌初始化
         * const authHttp = new HttpRequest('OAuth xyz123');
         */
        constructor(author: string) {
            this.Authorization = author;
        }

        /**
         * 基础请求方法（内部使用）
         * @param type - 请求类型 GET/POST
         * @param url - 请求地址
         * @param data - 请求数据（POST时使用）
         * @param cb - 回调函数
         * @private
         * 
         * @remark
         * 状态码处理逻辑：
         * - 200-399: 尝试解析JSON数据
         * - 0: 服务器无响应（返回'no_server'）
         * - 其他状态: 直接返回错误
         */
        private httpRequest(type: string, url: string, data: string | object, cb?: (v: any) => void): void {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                    var response = xhr.responseText;
                    try {
                        let a = parse2Json(response);
                        cb?.(a);
                    } catch (e) {
                        no.err('JSON.parse', 'httpRequest', response);
                        cb?.(null);
                    }
                } else if (xhr.readyState == 4 && xhr.status == 0) {
                    cb?.('no_server');
                }
            };
            xhr.open(type, url, true);
            if (type == 'POST') {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
            xhr.setRequestHeader('Authorization', this.Authorization);
            xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
            if (typeof data == 'object') {
                data = jsonStringify(data);
            }
            xhr.send(data);
        }

        /**
         * 发送GET请求
         * @param url - 请求地址（可包含查询参数）
         * @returns Promise包装的响应数据
         * @example
         * // 带查询参数的请求
         * http.get('https://api.example.com/search?keyword=test');
         * 
         * // 处理错误响应
         * http.get('invalid_url').catch(err => console.error('请求失败:', err));
         */
        public get(url: string): Promise<any> {
            return new Promise<any>(resolve => {
                this.httpRequest("GET", url, null, (v: any) => {
                    resolve(v);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 发送POST请求
         * @param url - 请求地址
         * @param data - 请求数据（支持对象或JSON字符串）
         * @returns Promise包装的响应数据
         * @example
         * // 发送表单数据
         * http.post('/api/login', { username: 'admin', password: '123' });
         * 
         * // 发送JSON字符串
         * http.post('/api/log', '{"action": "click", "time": 1620000000}');
         */
        public post(url: string, data: string | object): Promise<any> {
            return new Promise<any>(resolve => {
                this.httpRequest("POST", url, data, (v: any) => {
                    resolve(v);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }
    }

    /**
     * 节流控制器（用于限制函数执行频率）
     * @example
     * // 按钮点击节流（2秒内只响应一次）
     * const throttle = Throttling.ins();
     * async onClick() {
     *   if(await throttle.wait(2)) {
     *     // 执行点击逻辑
     *   }
     * }
     * 
     * // 全局滚动事件节流
     * window.addEventListener('scroll', () => {
     *   Throttling.ins().wait(0.5).then(allow => {
     *     if(allow) updateScrollPosition();
     *   });
     * });
     */
    export class Throttling {
        /** 冷却状态标记 */
        private isCd: boolean = false;
        /** 节流持续时间（单位：秒） */
        private duration: number = 1;

        /**
         * 获取节流器实例（单例模式）
         * @param c - 可选上下文对象，用于绑定实例
         * @example
         * // 获取组件级单例
         * Throttling.ins(this);
         */
        public static ins(c?: any): Throttling {
            if (c != null) {
                c['Throttling_instance'] = c['Throttling_instance'] || new Throttling();
                return c['Throttling_instance'];
            }
            return new Throttling();
        }

        /**
         * 等待节流冷却
         * @param duration - 节流持续时间（秒）
         * @param firstWait - 是否立即进入冷却（默认false立即返回）
         * @returns Promise<boolean> 是否允许执行
         * @example
         * // 首次立即执行后续节流
         * await throttle.wait(1, true);
         */
        public async wait(duration: number, firstWait = false): Promise<boolean> {
            if (this.isCd) {
                return false;
            } else {
                this.duration = duration * 1000;
                if (firstWait)
                    await this.setCd();
                else
                    this.setCd();

                return true;
            }
        }

        /** 设置冷却计时器 */
        private async setCd() {
            const it = this;
            it.isCd = true;
            return new Promise<void>(resolve => {
                setTimeout(() => {
                    it.isCd = false;
                    resolve();
                }, this.duration);
            }).catch(e => {
                console.error('节流器错误:', e);
            });
        }
    }

    /** 
     * 绘制图形的类型枚举
     * @example
     * // 创建线段时使用
     * const lineType = GraphicsType.Line;
     * 
     * // 创建圆形时使用
     * const circleType = GraphicsType.Circle;
     */
    export enum GraphicsType {
        /** 线*/
        Line = 'line',
        /** 圆弧*/
        Arc = 'arc',
        /** 椭圆*/
        Ellipse = 'ellipse',
        /** 圆*/
        Circle = 'circle',
        /** 矩形*/
        Rect = 'rect',
        /** 贝赛尔曲线*/
        Bezier = 'bezier'
    };

    /** 
     * 绘制图形路径的通用数据结构
     * @example
     * // 创建矩形数据示例
     * const rectData: GraphicsData = {
     *   points: [10, 10],      // 起始坐标
     *   size: [100, 50],       // 宽高
     *   radius: 5,             // 圆角半径
     *   fillColor: '#FF0000',  // 填充颜色
     *   stroke: true           // 启用描边
     * };
     */
    export type GraphicsData = {
        /** 坐标点集合（不同图形含义不同）：
         * - 矩形/贝塞尔曲线：起始坐标或控制点坐标
         * - 线：路径点坐标
         * - 圆/椭圆/圆弧：中心点坐标 */
        points: number[],
        /** 半径配置：
         * - 矩形：圆角半径 [左上, 右上, 右下, 左下]
         * - 椭圆：[x轴半径, y轴半径]
         * - 圆/圆弧：单一数值 */
        radius?: number[] | number,
        /** 尺寸（仅矩形使用）：[宽度, 高度] */
        size?: number[],
        /** 弧度范围（仅圆弧使用）：[起始角度, 结束角度]（单位：弧度） */
        startEndAngles?: number[],
        /** 绘制方向：true=逆时针，false=顺时针（默认） */
        counterclockwise?: boolean,
        /** 线条宽度（像素） */
        lineWidth?: number,
        /** 填充颜色（十六进制格式） */
        fillColor?: string,
        /** 描边颜色（十六进制格式） */
        strokeColor?: string,
        /** 是否填充图形 */
        fill?: boolean,
        /** 是否描边图形 */
        stroke?: boolean,
        /** 是否闭合路径 */
        close?: boolean,
    };

    const _createGraphicLineDataCache: GraphicsData = { points: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建线段路径数据
     * @param d 线段配置参数
     * @param d.points 线段路径点数组（至少需要2个点）
     * @param d.lineWidth 线宽（默认0）
     * @param d.strokeColor 描边颜色
     * @param d.fillColor 填充颜色
     * @returns 线段图形数据
     * @example
     * // 创建红色线段
     * const line = createGraphicLineData({
     *   points: [new Vec2(0,0), new Vec2(100,100)],
     *   lineWidth: 2,
     *   strokeColor: '#FF0000'
     * });
     */
    export function createGraphicLineData(points: Vec2[] | { x: number, y: number }[], lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicLineDataCache.points = [];
        _createGraphicLineDataCache.lineWidth = 0;
        _createGraphicLineDataCache.strokeColor = '';
        _createGraphicLineDataCache.fillColor = '';
        for (let i = 0; i < points.length; i++) {
            _createGraphicLineDataCache.points[_createGraphicLineDataCache.points.length] = points[i].x;
            _createGraphicLineDataCache.points[_createGraphicLineDataCache.points.length] = points[i].y;
        }
        _createGraphicLineDataCache.lineWidth = lineWidth || 0;
        _createGraphicLineDataCache.strokeColor = strokeColor;
        _createGraphicLineDataCache.fillColor = fillColor;
        return _createGraphicLineDataCache;
    }

    const _createGraphicArcDataCache: GraphicsData = { points: [], radius: [], startEndAngles: [], counterclockwise: false, lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制圆弧路径的数据
     * @param d 圆弧配置参数
     * @param d.center 圆心坐标
     * @param d.radius 圆弧半径（像素）
     * @param d.startAngle 起始角度（单位：弧度）
     * @param d.endAngle 结束角度（单位：弧度）
     * @param d.lineWidth 线宽（默认0）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @param d.counterclockwise 绘制方向（默认false顺时针）
     * @returns 圆弧图形数据
     * @example
     * // 创建红色半圆弧（90度到270度）
     * const arc = createGraphicArcData({
     *   center: new Vec2(100, 100),
     *   radius: 50,
     *   startAngle: Math.PI/2,
     *   endAngle: Math.PI*1.5,
     *   lineWidth: 2,
     *   strokeColor: '#FF0000'
     * });
     * 
     * // 创建填充扇形（闭合路径）
     * const sector = createGraphicArcData({
     *   center: new Vec2(200, 200),
     *   radius: 80,
     *   startAngle: 0,
     *   endAngle: Math.PI/3,
     *   fillColor: '#FFA500',
     *   close: true
     * });
     */
    export function createGraphicArcData(center: Vec2, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicArcDataCache.points = [center.x, center.y];
        _createGraphicArcDataCache.radius = [radius];
        _createGraphicArcDataCache.startEndAngles = [startAngle, endAngle];
        _createGraphicArcDataCache.counterclockwise = counterclockwise || false;
        _createGraphicArcDataCache.lineWidth = lineWidth || 0;
        _createGraphicArcDataCache.strokeColor = strokeColor;
        _createGraphicArcDataCache.fillColor = fillColor;
        return _createGraphicArcDataCache;
    }

    const _createGraphicEllipseDataCache: GraphicsData = { points: [], radius: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制椭圆路径的数据
     * @param d 椭圆配置参数
     * @param d.center 椭圆中心坐标
     * @param d.rx X轴半径（像素）
     * @param d.ry Y轴半径（像素）
     * @param d.lineWidth 线宽（默认0）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @returns 椭圆图形数据
     * @example
     * // 创建蓝色描边椭圆
     * const ellipse = createGraphicEllipseData({
     *   center: new Vec2(150, 150),
     *   rx: 100,
     *   ry: 60,
     *   lineWidth: 3,
     *   strokeColor: '#0000FF'
     * });
     * 
     * // 创建填充绿色椭圆
     * const filledEllipse = createGraphicEllipseData({
     *   center: new Vec2(300, 200),
     *   rx: 80,
     *   ry: 80,
     *   fillColor: '#00FF00'
     * });
     */
    export function createGraphicEllipseData(center: Vec2, rx: number, ry: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicEllipseDataCache.points = [center.x, center.y];
        _createGraphicEllipseDataCache.radius = [rx, ry];
        _createGraphicEllipseDataCache.lineWidth = lineWidth || 0;
        _createGraphicEllipseDataCache.strokeColor = strokeColor;
        _createGraphicEllipseDataCache.fillColor = fillColor;
        return _createGraphicEllipseDataCache;
    }

    const _createGraphicCircleDataCache: GraphicsData = { points: [], radius: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制圆路径的数据
     * @param center 
     * @param r 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createGraphicCircleData(center: Vec2, r: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicCircleDataCache.points = [center.x, center.y];
        _createGraphicCircleDataCache.radius = [r];
        _createGraphicCircleDataCache.lineWidth = lineWidth || 0;
        _createGraphicCircleDataCache.strokeColor = strokeColor;
        _createGraphicCircleDataCache.fillColor = fillColor;
        return _createGraphicCircleDataCache;
    }

    const _createGraphicRectDataCache: GraphicsData = { points: [], size: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制矩形路径的数据
     * @param d.x 矩形左上角X坐标
     * @param d.y 矩形左上角Y坐标
     * @param d.width 矩形宽度
     * @param d.height 矩形高度
     * @param d.lineWidth 线宽（0表示不描边）
     * @param d.strokeColor 描边颜色（十六进制字符串 如#FF0000）
     * @param d.fillColor 填充颜色（十六进制字符串 如#00FF00）
     * @returns 矩形图形数据
     * @example
     * // 创建红色边框矩形
     * const rect = createGraphicRectData({
     *   x: 100, y: 200,
     *   width: 300, height: 150,
     *   lineWidth: 2,
     *   strokeColor: '#FF0000'
     * });
     * 
     * // 创建填充蓝色矩形
     * const filledRect = createGraphicRectData({
     *   x: 50, y: 50,
     *   width: 200, height: 200,
     *   fillColor: '#0000FF'
     * });
     */
    export function createGraphicRectData(x: number, y: number, width: number, height: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicRectDataCache.points = [x, y];
        _createGraphicRectDataCache.size = [width, height];
        _createGraphicRectDataCache.lineWidth = lineWidth || 0;
        _createGraphicRectDataCache.strokeColor = strokeColor;
        _createGraphicRectDataCache.fillColor = fillColor;
        return _createGraphicRectDataCache;
    }

    const _createGraphicRoundRectDataCache: GraphicsData = { points: [], size: [], radius: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制圆角矩形路径的数据
     * @param d.x 矩形左上角X坐标
     * @param d.y 矩形左上角Y坐标
     * @param d.width 矩形宽度
     * @param d.height 矩形高度 
     * @param d.r 圆角半径（单位：像素）
     * @param d.lineWidth 线宽（0表示不描边）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @returns 圆角矩形图形数据
     * @example
     * // 创建绿色圆角矩形
     * const roundRect = createGraphicRoundRectData({
     *   x: 150, y: 150,
     *   width: 200, height: 100,
     *   r: 15,
     *   lineWidth: 3,
     *   strokeColor: '#00FF00'
     * });
     * 
     * // 创建填充橙色圆角矩形
     * const filledRound = createGraphicRoundRectData({
     *   x: 300, y: 300,
     *   width: 150, height: 150,
     *   r: 20,
     *   fillColor: '#FFA500'
     * });
     */
    export function createGraphicRoundRectData(x: number, y: number, width: number, height: number, r: number, lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        _createGraphicRoundRectDataCache.points = [x, y];
        _createGraphicRoundRectDataCache.size = [width, height];
        _createGraphicRoundRectDataCache.radius = [r];
        _createGraphicRoundRectDataCache.lineWidth = lineWidth || 0;
        _createGraphicRoundRectDataCache.strokeColor = strokeColor;
        _createGraphicRoundRectDataCache.fillColor = fillColor;
        return _createGraphicRoundRectDataCache;
    }

    const _createGraphicBezierDataCache: GraphicsData = { points: [], lineWidth: 0, strokeColor: '', fillColor: '' };
    /**
     * 创建绘制贝塞尔曲线路径的数据
     * @param d.points 控制点坐标数组（格式说明）：
     *   - 2个点：起点 + 终点（直线）
     *   - 3个点：二次贝塞尔曲线（起点 + 控制点 + 终点）
     *   - 4个点：三次贝塞尔曲线（起点 + 控制点1 + 控制点2 + 终点）
     * @param d.lineWidth 线宽（0表示不描边）
     * @param d.strokeColor 描边颜色（十六进制）
     * @param d.fillColor 填充颜色（十六进制）
     * @returns 贝塞尔曲线图形数据
     * @example
     * // 创建二次贝塞尔曲线
     * const quadCurve = createBezierData({
     *   points: [
     *     new Vec2(100, 100),  // 起点
     *     new Vec2(200, 50),   // 控制点
     *     new Vec2(300, 100)   // 终点
     *   ],
     *   lineWidth: 2,
     *   strokeColor: '#FF00FF'
     * });
     * 
     * // 创建三次贝塞尔曲线
     * const cubicCurve = createBezierData({
     *   points: [
     *     new Vec2(50, 200),
     *     new Vec2(150, 100),
     *     new Vec2(250, 300),
     *     new Vec2(350, 200)
     *   ],
     *   lineWidth: 3,
     *   strokeColor: '#00FFFF'
     * });
     */
    export function createBezierData(points: Vec2[] | { x: number, y: number }[], lineWidth?: number, strokeColor?: string, fillColor?: string): GraphicsData {
        let ps: number[] = [];
        for (let i = 0; i < points.length; i++) {
            ps[ps.length] = points[i].x;
            ps[ps.length] = points[i].y;
        }
        _createGraphicBezierDataCache.points = ps;
        _createGraphicBezierDataCache.lineWidth = lineWidth || 0;
        _createGraphicBezierDataCache.strokeColor = strokeColor;
        _createGraphicBezierDataCache.fillColor = fillColor;
        return _createGraphicBezierDataCache;
    }

    const _getGraphicUVInWorldCache: { minX: number, minY: number, maxX: number, maxY: number } = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    /**
     * 计算自定义图形在屏幕空间中的UV范围（归一化坐标，左上角为原点）
     * @param cx 图形中心点x（本地坐标系）
     * @param cy 图形中心点y（本地坐标系）
     * @param width 图形宽度（像素）
     * @param height 图形高度（像素）
     * @param graphicsNode 图形节点（用于坐标系转换）
     * @returns [minU, minV, maxU, maxV] UV坐标范围数组
     * @example
     * // 计算按钮控件在屏幕中的UV范围
     * const buttonUV = getGraphicUVInWorld(0, 0, 200, 50, buttonNode);
     * // 结果可能为：[0.3, 0.8, 0.5, 0.85] 表示占据屏幕横向30%-50%，纵向80%-85%区域
     */
    export function getGraphicUVInWorld(cx: number, cy: number, width: number, height: number, graphicsNode: Node): { minX: number, minY: number, maxX: number, maxY: number } {
        _getGraphicUVInWorldCache.minX = 0;
        _getGraphicUVInWorldCache.minY = 0;
        _getGraphicUVInWorldCache.maxX = 0;
        _getGraphicUVInWorldCache.maxY = 0;
        let worldSize = view.getVisibleSize();
        // 世界坐标系原点为左下角，需要转换为左上角为原点的UV坐标系
        let p1 = graphicsNode.getComponent(UITransform).convertToWorldSpaceAR(v3(cx - width / 2, cy - height / 2));
        let p2 = graphicsNode.getComponent(UITransform).convertToWorldSpaceAR(v3(cx + width / 2, cy + height / 2));
        _getGraphicUVInWorldCache.minX = p1.x / worldSize.width;
        _getGraphicUVInWorldCache.minY = 1 - p2.y / worldSize.height;
        _getGraphicUVInWorldCache.maxX = p2.x / worldSize.width;
        _getGraphicUVInWorldCache.maxY = 1 - p1.y / worldSize.height;
        return _getGraphicUVInWorldCache;
    }

    /**
     * 字符串转字节数组（ASCII编码）
     * @param str 输入字符串
     * @returns Uint8Array字节数组
     * @example
     * string2Bytes("Hello"); // 返回 Uint8Array [72, 101, 108, 108, 111]
     * @note 仅支持ASCII字符，中文等Unicode字符请使用TextEncoder
     */
    export function string2Bytes(str: string): Uint8Array {
        const buffer = new ArrayBuffer(str?.length || 0);
        const bytes = new Uint8Array(buffer);

        if (str) {
            let chars = str.split('');
            for (let i = 0; i < chars.length; i++) {
                bytes[i] = chars[i].charCodeAt(0);
            }
        }

        return bytes;
    }

    /**
     * 字节数组转字符串（ASCII解码）
     * @param bytes Uint8Array字节数组
     * @returns 原始字符串
     * @example
     * bytes2String(new Uint8Array([72, 101, 108, 108, 111])); // 返回 "Hello"
     * @note 仅支持ASCII字符，中文等Unicode字符请使用TextDecoder
     */
    export function bytes2String(bytes: Uint8Array): string {
        let sArr: string[] = [];
        for (let i = 0; i < bytes?.length; i++) {
            sArr[sArr.length] = String.fromCharCode(bytes[i]);
        }
        return sArr.join('');
    }

    /**
     * 字符串转ArrayBuffer（ASCII编码）
     * @param str 输入字符串
     * @returns ArrayBuffer二进制数据
     * @example
     * const buf = string2ArrayBuffer("test");
     * new Uint8Array(buf); // 返回 [116, 101, 115, 116]
     * @see string2Bytes 类似功能的不同返回格式
     */
    export function string2ArrayBuffer(str: string): ArrayBuffer {
        const buffer = new ArrayBuffer(str?.length || 0);
        const bytes = new Uint8Array(buffer);

        if (str) {
            let chars = str.split('');
            for (let i = 0; i < chars.length; i++) {
                bytes[i] = chars[i].charCodeAt(0);
            }
        }

        return buffer;
    }

    /**
     * ArrayBuffer转字符串（ASCII解码）
     * @param buffer 要转换的二进制数据
     * @returns 解码后的字符串
     * @example
     * const buf = new Uint8Array([72, 101, 108, 108, 111]).buffer;
     * arrayBuffer2String(buf); // 返回 "Hello"
     */
    export function arrayBuffer2String(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        return bytes2String(bytes);
    }

    /**
     * Uint8Array转ArrayBuffer（数据复制）
     * @param bytes 要转换的Uint8Array数组
     * @returns 新的ArrayBuffer对象
     * @example
     * const bytes = new Uint8Array([1, 2, 3]);
     * const buffer = Uint8Array2ArrayBuffer(bytes);
     * buffer.byteLength; // 3
     */
    export function Uint8Array2ArrayBuffer(bytes: Uint8Array): ArrayBuffer {
        const arraybuffer = new ArrayBuffer(bytes.length);
        const view = new Uint8Array(arraybuffer);
        view.set(bytes);
        return arraybuffer;
    }

    /**
     * ArrayBuffer转Uint8Array（创建视图）
     * @param buffer 要转换的二进制数据
     * @returns 新的Uint8Array视图
     * @example
     * const buffer = new ArrayBuffer(4);
     * const bytes = ArrayBuffer2Uint8Array(buffer);
     * bytes.length; // 4
     */
    export function ArrayBuffer2Uint8Array(buffer: ArrayBuffer): Uint8Array {
        return new Uint8Array(buffer);
    }

    function testArrayBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer): boolean {
        const len1 = buffer1.byteLength;
        const len2 = buffer2.byteLength;
        const view1 = new Uint8Array(buffer1);
        const view2 = new Uint8Array(buffer2);

        if (len1 !== len2) {
            return false;
        }

        for (let i = 0; i < len1; i++) {
            if (view1[i] === undefined || view1[i] !== view2[i]) {
                return false;
            }
        }
        return true;
    }

    ////////////////////////////////////给richtext添加bbcode start///////////////////////

    /**
     * 给富文本添加BBCode标签
     * @param text 原始富文本内容
     * @param tags BBCode标签配置数组（当使用重载1时）
     * @param tag 单个标签名（当使用重载2时）
     * @param value 标签属性值，支持多种格式：
     * - 数字/字符串：直接作为属性值（如 size=24）
     * - 对象：单个键值对（如 {key:'color',value:'#ff0000'}）
     * - 对象数组：多个键值对（如 [{key:'size',value:24}, {key:'color',value:'blue'}]）
     * @returns 添加BBCode后的富文本字符串
     * @example
     * // 添加多个标签
     * addBBCode('Hello', [
     *   { tag: 'b' }, // 加粗
     *   { tag: 'color', value: '#ff0000' } // 红色
     * ]); // 返回 '<b><color=#ff0000>Hello</color></b>'
     * 
     * // 添加单个带数值属性的标签
     * addBBCode('Text', 'size', 24); // 返回 '<size=24>Text</size>'
     * 
     * // 添加复杂属性配置
     * addBBCode('World', 'style', [
     *   { key: 'font', value: 'Arial' },
     *   { key: 'outline', value: 2 }
     * ]); // 返回 '<style font=Arial outline=2>World</style>'
     * 
     * // 添加换行标签
     * addBBCode('Line1\nLine2', 'br'); // 返回 'Line1<br/>Line2'
     */
    export function addBBCode(text: string, tags: { tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[] }[]): string;
    /**
     * 给富文本添加单个BBCode标签
     * @param text 原始富文本内容
     * @param tag 要添加的标签名称
     * @param value 标签属性值（可选）
     * @returns 添加BBCode后的富文本字符串
     */
    export function addBBCode(text: string, tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[]): string;
    export function addBBCode(text: string, tags: string | { tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[] }[], props?: number | string | { key: string, value: any } | { key: string, value: any }[]): string {
        if (tags == 'br') return `${text}<br/>`;
        if (tags instanceof Array) {
            let a = text;
            for (let i = 0; i < tags.length; i++) {
                let t = tags[i];
                a = addBBCode(a, t.tag, t.value);
            }
            return a;
        } else {
            const tagFormat = '<{tag}{props}>{content}</{tag}>';
            const propFormat = '{key}={value}';

            if (props) {
                if (typeof props == 'number' || typeof props == 'string') {
                    return no.formatString(tagFormat, { tag: tags, props: `=${props}`, content: text });
                }

                let ps: string[] = [''];
                props = [].concat(props);
                for (let i = 0; i < props.length; i++) {
                    ps[ps.length] = no.formatString(propFormat, props[i]);
                }

                return no.formatString(tagFormat, { tag: tags, props: ps.join(' '), content: text });
            } else
                return no.formatString(tagFormat, { tag: tags, props: '', content: text });
        }
    }
    ////////////////////////////////////给richtext添加bbcode end///////////////////////

    /**
     * 创建点击事件配置对象
     * @param target 事件响应组件和函数所在节点
     * @param comp 事件响应组件（支持组件类或组件名字符串）
     * @param handler 响应事件函数名
     * @returns 配置好的事件处理器对象
     * @example
     * // 创建按钮点击事件配置
     * const event = createClickEvent(this.node, 'MenuUI', 'onStartClick');
     * 
     * // 使用组件类创建事件配置
     * createClickEvent(playerNode, PlayerComponent, 'onJump');
     */
    export function createClickEvent(target: Node, comp: typeof Component | string, handler: string): EventHandler {
        let a = new EventHandler();
        a.target = target;
        if (typeof comp == 'string') {
            a.component = comp;
            a._componentId = js._getClassId(js.getClassByName(comp));
        } else {
            a.component = js.getClassName(comp);
            a._componentId = js._getClassId(comp);
        }
        a.handler = handler;
        return a;
    }

    /**
     * 给按钮组件添加点击事件
     * @param btn 需要添加点击事件的按钮组件
     * @param target 事件响应组件和函数所在节点
     * @param comp 事件响应组件（支持组件类或组件名字符串）
     * @param handler 响应事件函数名
     * @param exclusive 是否独占模式，默认true（清空已有事件）
     * @example
     * // 添加独占式点击事件（替换所有现有事件）
     * addClickEventsToButton(playBtn, this.node, GameCtrl, 'onPlayClick');
     * 
     * // 添加非独占式点击事件（保留已有事件）
     * addClickEventsToButton(menuBtn, uiNode, 'MenuManager', 'showMainMenu', false);
     */
    export function addClickEventsToButton(btn: Button, target: Node, comp: typeof Component | string, handler: string, exclusive = true) {
        if (!btn?.clickEvents) return;
        let a = createClickEvent(target, comp, handler);
        if (exclusive)
            btn.clickEvents = [a];
        else {
            let b = true;
            for (let i = 0, n = btn.clickEvents.length; i < n; i++) {
                let ce = btn.clickEvents[i];
                if (ce.target.uuid == a.target.uuid && (ce._componentName == a._componentName || ce._componentId == a._componentId) && ce.handler == a.handler) {
                    b = false;
                    break;
                }
            }
            b && (btn.clickEvents[btn.clickEvents.length] = a);
        }
    }

    /**
     * 给开关组件添加选中状态变更事件
     * @param toggle 需要添加事件的开关组件
     * @param target 事件响应组件和函数所在节点
     * @param comp 事件响应组件（支持组件类或组件名字符串）
     * @param handler 响应事件函数名
     * @param exclusive 是否独占模式，默认true（清空已有事件）
     * @example
     * // 添加独占式开关事件
     * addCheckEventsToToggle(soundToggle, settingsNode, 'AudioManager', 'onSoundToggle');
     * 
     * // 添加非独占式开关事件（保留已有事件）
     * addCheckEventsToToggle(vibrationToggle, this.node, SettingsPanel, 'updateVibration', false);
     */
    export function addCheckEventsToToggle(toggle: Toggle, target: Node, comp: typeof Component | string, handler: string, exclusive = true) {
        if (!toggle?.checkEvents) return;
        let a = createClickEvent(target, comp, handler);
        if (exclusive)
            toggle.checkEvents = [a];
        else {
            let b = true;
            for (let i = 0, n = toggle.checkEvents.length; i < n; i++) {
                let ce = toggle.checkEvents[i];
                if (ce.target.uuid == a.target.uuid && (ce._componentName == a._componentName || ce._componentId == a._componentId) && ce.handler == a.handler) {
                    b = false;
                    break;
                }
            }
            b && (toggle.checkEvents[toggle.checkEvents.length] = a);
        }
    }

    /**
     * SP加密算法1.0版本 - 加密方法
     * @param b 需要加密的原始数据（支持字符串或对象）
     * @returns 加密后的Base64格式字符串
     * @example
     * // 加密字符串
     * const encrypted = SPEncrypt1_0_Encrypt1('hello123'); 
     * // 加密对象（会自动序列化）
     * const encryptedObj = SPEncrypt1_0_Encrypt1({user: 'admin', score: 100});
     */
    export function SPEncrypt1_0_Encrypt1(b: any) {
        if (b == null) return '';
        b = ToUTF8(b); // 转换为UTF-8字节数组
        // 生成固定加密密钥（1e8的整数形式）
        for (var e = Math.floor(1e8 * 1),
            // 计算需要分割的4字节块数量
            d = (b.length >> 2) + (0 < b.length % 4 ? 1 : 0),
            c = [], a = 0; a < d; a++)
            // 将4个字节组合为32位整数并进行异或加密
            (c[a] = b[4 * a] | (b[4 * a + 1] << 8) | (b[4 * a + 2] << 16) | (b[4 * a + 3] << 24)), (c[a] ^= e);
        c[d] = e; // 在数据末尾附加加密密钥
        // 将加密后的32位整数重新拆分为字节数组
        b = [];
        for (a = 0; a <= d; a++)
            (b[4 * a] = c[a] & 255),          // 取最低8位
                (b[4 * a + 1] = (c[a] >> 8) & 255),  // 次低8位
                (b[4 * a + 2] = (c[a] >> 16) & 255), // 次高8位 
                (b[4 * a + 3] = (c[a] >> 24) & 255); // 最高8位
        return bytes2String(b); // 转换为Base64字符串
    }

    /**
     * 将字符串转换为UTF-8字节数组
     * @param str 需要转换的原始字符串
     * @returns UTF-8编码的字节数组
     * @example
     * // 返回 [97, 98, 99]
     * ToUTF8('abc');
     * 
     * // 处理中文返回多字节数组
     * ToUTF8('中文'); // 返回 [228, 184, 173, 230, 150, 135]
     */
    export function ToUTF8(str: string) {
        if (str == null) return [];
        var result = new Array();
        var k = 0;
        // 逐个字符处理编码
        for (var i = 0; i < str.length; i++) {
            var j = encodeURI(str[i]); // URI编码处理特殊字符
            if (j.length == 1) { // ASCII字符直接转换
                result[k++] = j.charCodeAt(0);
            } else { // 处理多字节编码（如中文）
                var bytes = j.split('%'); // 分割编码单元
                for (var l = 1; l < bytes.length; l++) { // 跳过第一个空元素
                    result[k++] = parseInt('0x' + bytes[l]); // 16进制转十进制
                }
            }
        }
        return result;
    }


    /**
     * 智能拼接路径片段（自动处理斜杠和反斜杠）
     * @param args 路径片段数组（支持空值过滤）
     * @returns 规范化拼接后的路径字符串
     * @example
     * // 基本路径拼接
     * pathjoin('user', 'documents/', 'reports//2024'); // "user/documents/reports/2024"
     * 
     * // 处理混合斜杠和空值
     * pathjoin('C:\\projects', '\\src\\', '\\utils'); // "C/projects/src/utils"
     * 
     * // 处理空字符串参数
     * pathjoin('', 'temp', ''); // "temp"
     */
    export function pathjoin(...args: string[]) {
        let a: string[] = [];
        for (let i = 0, l = args.length; i < l; i++) {
            if (args[i])
                // 统一处理路径片段：移除首尾的斜杠/反斜杠，并清理结尾的路径分隔符
                a[a.length] = args[i].replace('/', '').replace('\\', '').replace(/(\/|\\\\)$/, "");
        }
        return a.join('/');
    }

    /**
     * 从完整路径中提取文件名（支持不同操作系统路径格式）
     * @param path 文件路径字符串
     * @returns 纯文件名（包含扩展名）
     * @example
     * // 基本文件名提取
     * getFileName('downloads/report.pdf'); // "report.pdf"
     * 
     * // 处理Windows路径
     * getFileName('C:\\Users\\docs\\note.txt'); // "note.txt"
     * 
     * // 处理以斜杠结尾的路径
     * getFileName('temp/cache/'); // "cache"
     */
    export function getFileName(path: string): string {
        // 统一处理不同操作系统的路径分隔符，并获取最后一部分
        return path.substring(path.lastIndexOf('/') + 1);
    }

    /**
     * 单例模式基类（需继承使用）
     * @remarks
     * 通过继承实现具体单例类，需在子类中实现clear方法
     * @example
     * // 创建配置管理器单例
     * class ConfigManager extends SingleObject {
     *   private _configs: Map<string, any> = new Map();
     * 
     *   static getInstance() {
     *     return this.instance() as ConfigManager;
     *   }
     * 
     *   // 实现清理逻辑
     *   clear() {
     *     this._configs.clear();
     *   }
     * }
     * //单例扩展：在instance方法中传入不同的key，可以实现不同的单例实例
     */
    export class SingleObject {
        /** 单例表 */
        private static _insMap: { [key: string]: { [key: string]: SingleObject } } = {};

        private static get objectName() {
            return this['_singleObjectName'];
        }

        /**
         * 获取单例实例（需在子类中包装此方法）
         * @returns 单例实例
         */
        protected static instance(): SingleObject;
        protected static instance(key: string): SingleObject
        protected static instance(key?: string): SingleObject {
            key = key || '_';
            const name = this.objectName;
            if (!this._insMap[name]) this._insMap[name] = {};
            if (!this._insMap[name][key]) this._insMap[name][key] = new this();
            return this._insMap[name][key];
        }

        /**
         * 销毁单例实例
         * @param key 实例key
         */
        public static destroy(key?: string) {
            key = key || '_';
            const name = this.objectName;
            if (this._insMap[name]) {
                this._insMap[name][key]?.clear();
                this._insMap[name][key] = null;
            }
        }

        public static destroyAll() {
            const name = this.objectName;
            if (this._insMap[name]) {
                const keys = Object.keys(this._insMap[name]);
                for (let i = 0, n = keys.length; i < n; i++) {
                    this.destroy(keys[i]);
                }
            }
        }

        /** 
         * 清理单例数据（由管理器调用）
         * @remarks
         * 子类需重写此方法实现具体清理逻辑
         */
        public clear() { }
    }

    /**
     * 单例对象生命周期管理器
     * @remarks
     * 统一管理所有注册的单例对象，提供批量清理功能
     * @example
     * // 注册单例类
     * SingleObjectManager.register(ConfigManager);
     * 
     * // 游戏切换场景时清理所有单例
     * SingleObjectManager.clear();
     */
    export class SingleObjectManager {
        /** 已注册的单例类列表 */
        private static _singleObjects: { [key: string]: Function[] } = {};

        /**
         * 注册需要管理的单例类
         * @param singleObject - 继承自SingleObject的类
         */
        public static register(type: string, singleObject: Function) {
            if (!this._singleObjects[type]) this._singleObjects[type] = [];
            this._singleObjects[type].push(singleObject);
        }

        /**
         * 清理所有注册的单例实例
         * @remarks
         * 遍历所有注册的单例类，调用其clear方法并重置实例
         */
        public static clear(type: string) {
            const arr = this._singleObjects[type];
            if (arr) {
                for (let i = 0, n = arr.length; i < n; i++) {
                    arr[i]['destroyAll']?.();
                }
            }
        }

        /**
         * 清理所有注册的单例实例
         * @remarks
         * 遍历所有注册的单例类，调用其clear方法并重置实例
         */
        public static clearAll() {
            for (const key in this._singleObjects) {
                this.clear(key);
            }
        }
    }

    /**
     * 判断目标是否可用（支持Cocos对象有效性检测）
     * @param target - 需要检测的对象（支持普通对象和Cocos对象）
     * @returns 对象是否可用（对于Cocos对象会检测引擎有效性）
     * @example
     * // 检测普通对象
     * checkValid({}); // 返回true
     * 
     * // 检测已销毁的节点
     * const node = new Node();
     * node.destroy();
     * checkValid(node); // 返回false
     * 
     * // 检测非Cocos对象
     * checkValid(null); // 返回false
     */
    export function checkValid(target: any): boolean {
        if (target == undefined || target == null) return false;
        if (target instanceof CCObject) return isValid(target, true);
        return true;
    }

    /**
     * 安全赋值方法（自动检测目标有效性）
     * @param target - 赋值目标对象（支持组件或普通对象）
     * @param data - 需要赋值的键值对对象
     * @example
     * // 安全设置组件属性
     * setValueSafely(myComponent, {
     *   progress: 0.5,
     *   label: 'Loading...',
     *   visible: true
     * });
     * 
     * // 安全设置普通对象属性
     * const userData = { name: 'John' };
     * setValueSafely(userData, {
     *   age: 30,
     *   email: 'john@example.com'
     * });
     * 
     * // 对无效目标不执行操作
     * setValueSafely(null, { value: 100 }); // 静默失败
     */
    export function setValueSafely(target: Component | any, data: { [k: string]: any }) {
        if (!checkValid(target)) return;
        for (const key in data) {
            target[key] = data[key];
        }
    }

    /**
     * 网络速度计算工具类（支持实时速率和剩余时间计算）
     * @example
     * // 文件下载进度监控
     * const speedMonitor = new NetworkSpeed();
     * 
     * // 每1秒更新一次进度
     * setInterval(() => {
     *   const progress = getDownloadProgress();
     *   const result = speedMonitor.calculateNetworkSpeedAndRemainSeconds(progress.loaded, progress.total);
     *   if (result) {
     *     console.log(`当前速度：${NetworkSpeed.formatNetworkSpeed(result[0])}/s 剩余时间：${result[1]}秒`);
     *   }
     * }, 1000);
     */
    export class NetworkSpeed {
        /** 存储最近一次的加载数据 [已加载字节数, 时间戳] */
        private _lastLoaded: number[];

        constructor() {
            this._lastLoaded = [0];
        }

        /**
         * 计算实时网速和剩余时间
         * @param loaded - 当前已加载的字节数
         * @param total - 总需要加载的字节数
         * @returns [当前网速(B/s), 预计剩余秒数] 或 null（当数据不足时）
         * @example
         * // 首次调用返回null（需要基准数据）
         * speedMonitor.calculateNetworkSpeedAndRemainSeconds(1024, 10240); // null
         * 
         * // 第二次调用（间隔1秒以上）返回有效数据
         * setTimeout(() => {
         *   const res = speedMonitor.calculateNetworkSpeedAndRemainSeconds(2048, 10240);
         *   // res可能为 [1024, 8] 表示1024B/s，剩余8秒
         * }, 1500);
         */
        public calculateNetworkSpeedAndRemainSeconds(loaded: number, total: number): number[] {
            const now = sys.now();
            if (this._lastLoaded[0] == 0) { // 初始化基准数据
                this._lastLoaded[0] = loaded;
                this._lastLoaded[1] = now;
                return null;
            }

            // 计算时间差（秒）
            const t = (now - this._lastLoaded[1]) / 1000;
            if (t < 1) return null; // 时间间隔不足1秒不计算

            let result: number[] = [];
            const sub = (loaded - this._lastLoaded[0]) / t; // 计算字节/秒

            result[0] = sub; // 当前网速
            result[1] = Math.ceil((total - loaded) / sub); // 剩余时间（向上取整）

            // 更新基准数据
            this._lastLoaded[0] = loaded;
            this._lastLoaded[1] = now;

            return result;
        }

        /**
         * 格式化网速显示（自动转换单位）
         * @param v - 原始字节数
         * @param unit - 单位体系（默认['B', 'KB', 'MB']）
         * @returns 格式化后的字符串（保留两位小数）
         * @example
         * NetworkSpeed.formatNetworkSpeed(1024); // "1KB"
         * NetworkSpeed.formatNetworkSpeed(1536); // "1.5KB"
         * NetworkSpeed.formatNetworkSpeed(3145728); // "3MB"
         * 
         * // 使用自定义单位
         * NetworkSpeed.formatNetworkSpeed(2048, ['B', 'KiB']); // "2KiB"
         */
        public static formatNetworkSpeed(v: number, unit = ['B', 'KB', 'MB']): string {
            let i = 0, s: string = '';
            while (true) {
                // 当数值小于1024或达到最大单位时停止转换
                if (v < 1024 || i == (unit.length - 1)) {
                    s = Math.floor(v * 100) / 100 + unit[i]; // 保留两位小数
                    break;
                }
                v /= 1024;
                i++;
            }
            return s;
        }
    }

    /**
     * 设置节点可渲染标志（通过调整节点位置实现）
     * @param node - 要操作的节点
     * @param v - 是否可渲染（true=显示，false=隐藏到屏幕外）
     * @returns 当前是否可渲染
     * @example
     * // 隐藏UI面板
     * visible(uiNode, false);
     * 
     * // 显示游戏角色
     * visible(playerNode, true);
     */
    export function visible(node: Node, v?: boolean): boolean {
        if (!checkValid(node)) return false;
        if (v != undefined && node.active != v) {
            node.active = v;
        }
        return node.active;

        // 通过修改节点X坐标实现隐藏（保留原始坐标用于恢复）
        if (node['__origin_x__'] == null) {
            node['__origin_x__'] = no.x(node);
        }

        if (v != undefined) {
            node['yj_need_render'] = v;
            if (v) {
                if (!node.active) node.active = true;
            }
            if (!EDITOR) {
                // 将节点移动到屏幕外实现隐藏（20000像素）
                no.x(node, !v ? 20000 : node['__origin_x__']);
                // 处理输入阻断组件
                const blockInputEvents = node.getComponent(BlockInputEvents);
                if (blockInputEvents)
                    blockInputEvents.enabled = v;
                // 处理自定义按钮组件
                const btn = node.getComponent(Button);
                if (btn) btn.interactable = v;
            }
            node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }
        return node['yj_need_render'] !== false;
    }

    /**
     * 通过透明度设置节点可渲染标志（不触发生命周期方法）
     * @param node - 要操作的节点
     * @param v - 是否可渲染（true=显示，false=完全透明）
     * @returns 当前是否可渲染
     * @example
     * // 隐藏滚动列表项
     * visibleByOpacity(listItem, false);
     * 
     * // 显示缓存对象
     * visibleByOpacity(cachedNode, true);
     */
    export function visibleByOpacity(node: Node, v?: boolean): boolean {
        if (!checkValid(node)) return false;

        if (v != undefined) {
            node['yj_need_render'] = v;
            const uiopacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
            // 保存原始透明度用于恢复
            if (node['yj_origin_opacity'] == null)
                node['yj_origin_opacity'] = uiopacity.opacity || 255;

            if (!v) {
                uiopacity.opacity = 0;
            } else {
                uiopacity.opacity = node['yj_origin_opacity'];
                if (!node.active) node.active = true;
            }

            if (!EDITOR) {
                const blockInputEvents = node.getComponent(BlockInputEvents);
                if (blockInputEvents)
                    blockInputEvents.enabled = v;

                const btn = node.getComponent(Button);
                if (btn) btn.interactable = v;
            }
            node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }
        return node['yj_need_render'] !== false;
    }

    /**
     * 设置节点层级激活状态（控制交互和渲染）
     * @param node - 要操作的节点
     * @param v - 是否激活
     * @example
     * // 禁用弹窗交互
     * visibleByActiveInHierarchy(popupNode, false);
     * 
     * // 启用对象池对象
     * visibleByActiveInHierarchy(poolObject, true);
     */
    export function visibleByActiveInHierarchy(node: Node, v: boolean) {
        if (!checkValid(node)) return;
        const blockInputEvents = node.getComponentsInChildren(BlockInputEvents);
        if (blockInputEvents)
            for (let i = 0; i < blockInputEvents.length; i++) {
                blockInputEvents[i].enabled = v;
            }
        const btn = node.getComponent(Button);
        if (btn) btn.interactable = v;
        if (!v) {
            if (node['__origin_x__'] == null) {
                node['__origin_x__'] = no.x(node);
            }
            no.x(node, 20000);
        } else {
            if (!node.active) node.active = true;
            if (node['__origin_x__'] !== null) {
                no.x(node, node['__origin_x__']);
            }
        }
        node['_activeInHierarchy'] = v;
        // 激活或禁用节点的组件
        runCompActiveFunc(node, v);
    }

    // 定义一个函数runCompActiveFunc，用于激活或禁用节点的组件
    function runCompActiveFunc(node: Node, isActive: boolean) {
        if (!checkValid(node)) return;
        // 获取节点的组件数组
        const comps = node.components;
        // 根据isActive的值确定要调用的函数名
        const funcName = isActive ? 'onEnable' : 'onDisable';
        // 遍历组件数组，调用相应的函数
        for (let i = 0, n = comps.length; i < n; i++) {
            const comp = comps[i];
            if (comp['__proto__'].__classname__.indexOf('cc.') == 0) continue;
            if (comp[funcName]) {
                comp[funcName]();
            }
        }
        // 获取节点的子节点数组
        const children = node.children;
        // 遍历子节点数组，递归调用runCompActiveFunc函数
        for (let i = 0; i < children.length; i++) {
            runCompActiveFunc(children[i], isActive);
        }
    }


    /**
     * 节点包围盒类（增强计算包含子节点的包围盒）
     * 获取节点包围盒通常用UITransform.getBoundingBoxToWorld()，
     * 如果计算不准确（需要包含动态子节点时），可用本类
     * 
     * @example
     * // 创建包围盒实例
     * const bbox = NodeBoundingBox.new(myNode);
     * 
     * // 动态添加子节点后更新包围盒
     * myNode.addChild(newChild);
     * bbox.onAddChild(newChild);
     */
    export class NodeBoundingBox {
        private _targetNode: Node;
        private _rect: Rect;

        /**
         * @param targetNode - 需要计算包围盒的目标节点
         */
        constructor(targetNode: Node) {
            this._targetNode = targetNode;
            this._rect = targetNode.getComponent(UITransform).getBoundingBox();
            this._rect.center = v2();
        }

        /** 工厂方法创建新实例 */
        public static new(targetNode: Node): NodeBoundingBox {
            return new NodeBoundingBox(targetNode);
        }

        /**
         * 当添加子节点时更新包围盒
         * @param child - 新增的子节点
         * @example
         * // 动态添加子节点后手动更新
         * const newChild = instantiate(prefab);
         * parentNode.addChild(newChild);
         * bbox.onAddChild(newChild);
         */
        public onAddChild(child: Node) {
            this.updateRect(no.size(child), no.position(child));
        }

        /**
         * 获取节点自身坐标系下的原始包围盒（不包含子节点）
         * @returns 原始包围盒矩形
         * @example
         * // 获取节点初始包围盒
         * const originRect = bbox.getOriginRect();
         */
        public getOriginRect(): Rect {
            return this._rect.clone();
        }

        /**
         * 获取父坐标系下的包围盒（包含所有子节点）
         * @returns 父节点坐标系中的包围盒
         * @example
         * // 计算在父容器中的实际占位区域
         * const rectInParent = bbox.getRect();
         * console.log(`位置：${rectInParent.x},${rectInParent.y} 尺寸：${rectInParent.width}x${rectInParent.height}`);
         */
        public getRect(): Rect {
            let r = this._rect.clone(),
                pos = no.position(this._targetNode);
            r.x += pos.x;
            r.y += pos.y;
            return r;
        }

        /**
         * 获取世界坐标系下的包围盒（包含所有子节点）
         * @returns 世界坐标系中的包围盒
         * @example
         * // 检测与其他节点的世界坐标碰撞
         * const worldRect1 = bbox1.getRectToWorld();
         * const worldRect2 = bbox2.getRectToWorld();
         * if (worldRect1.intersects(worldRect2)) {
         *   console.log('发生碰撞');
         * }
         */
        public getRectToWorld(): Rect {
            let r = this._rect.clone();
            const pos = no.nodeWorldPosition(this._targetNode);
            r.x += pos.x;
            r.y += pos.y;
            return r;
        }

        private updateRect(size: Size, pos: { x: number, y: number, z: number }) {
            const xMin = pos.x - size.width / 2,
                xMax = xMin + size.width,
                yMin = pos.y - size.height / 2,
                yMax = yMin + size.height;
            this._rect.xMin = Math.min(this._rect.xMin, xMin);
            this._rect.xMax = Math.max(this._rect.xMax, xMax);
            this._rect.yMin = Math.min(this._rect.yMin, yMin);
            this._rect.yMax = Math.max(this._rect.yMax, yMax);
        }

        /**
         * 静态方法快速获取父坐标系包围盒（适合一次性计算）
         * @param targetNode - 目标节点
         * @returns 父节点坐标系中的包围盒
         * @example
         * // 快速获取单个节点的包围盒
         * const rect = NodeBoundingBox.getRect(spriteNode);
         */
        public static getRect(targetNode: Node): Rect {
            const children = targetNode.children;
            let rect = targetNode.getComponent(UITransform).getBoundingBox(),
                targetNodePos = no.position(targetNode);
            rect.center = v2();
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const size = no.size(child), pos = no.position(child);
                const xMin = pos.x - size.width / 2,
                    xMax = xMin + size.width,
                    yMin = pos.y - size.height / 2,
                    yMax = yMin + size.height;
                rect.xMin = Math.min(rect.xMin, xMin);
                rect.xMax = Math.max(rect.xMax, xMax);
                rect.yMin = Math.min(rect.yMin, yMin);
                rect.yMax = Math.max(rect.yMax, yMax);
            }
            rect.x += targetNodePos.x;
            rect.y += targetNodePos.y;
            return rect;
        }

        /**
         * 静态方法快速获取世界坐标系包围盒（适合一次性计算）
         * @param targetNode - 目标节点
         * @returns 世界坐标系中的包围盒
         * @example
         * // 快速获取UI元素的世界坐标范围
         * const worldRect = NodeBoundingBox.getRectToWorld(uiElement);
         * if (worldRect.contains(touchPos)) {
         *   console.log('点击在元素范围内');
         * }
         */
        public static getRectToWorld(targetNode: Node): Rect {
            let rect = this.getRect(targetNode),
                pos = v3(rect.center.x, rect.center.y);
            targetNode.parent.getComponent(UITransform).convertToWorldSpaceAR(pos, pos);
            rect.center.x = pos.x;
            rect.center.y = pos.y;
            return rect;
        }
    }

    /**
     * 检查材质是否包含指定属性
     * @param material - 要检查的材质实例
     * @param techniqueIdx - 技术索引（从0开始）
     * @param passIdx - 通道索引（从0开始）
     * @param propertyKey - 要检查的属性名称
     * @returns 是否包含该属性
     * @example
     * // 检查材质是否包含_BaseColor属性
     * const hasColor = materialHasProperty(myMaterial, 0, 0, '_BaseColor');
     */
    export function materialHasProperty(material: Material, techniqueIdx: number, passIdx: number, propertyKey: string): boolean {
        return material.effectAsset.techniques[techniqueIdx]?.passes[passIdx]?.properties[propertyKey] !== undefined;
    }

    /**
     * 调试用-将对象挂载到window对象
     * @param key - 挂载到window的属性名
     * @param obj - 要挂载的对象
     * @example
     * // 在调试模式下暴露玩家数据到全局
     * addToWindowForDebug('playerData', playerComponent.data);
     */
    export function addToWindowForDebug(key: string, obj: any) {
        if (DEBUG) {
            window[key] = obj;
        }
    }

    /**
     * 获取字符串字节长度（中文按2字节计算）
     * @param v - 要计算的字符串
     * @returns 字节总长度
     * @example
     * // 返回 7 (中文3字*2 + 英文1字)
     * getStringByteLength('测试a');
     */
    export function getStringByteLength(v: string): number {
        let len = 0;
        for (let i = 0, n = v.length; i < n; i++) {
            v.charCodeAt(i) < 256 ? (len += 1) : (len += 2)
        }
        return len
    }

    /**
     * 按字节长度裁剪字符串
     * @param v - 原始字符串
     * @param maxLen - 最大允许字节长度
     * @param chinese2 - 是否中文按2字节计算（默认true）
     * @returns 裁剪后的字符串
     * @example
     * // 返回 '测试te'（总长度6字节）
     * cutString('测试test', 6);
     */
    export function cutString(v: string, maxLen: number, chinese2 = true): string {
        let len = 0, s: string[] = [];
        for (let i = 0, n = v.length; i < n; i++) {
            v.charCodeAt(i) < 256 ? (len += 1) : (len += 2)
            if (len <= maxLen) {
                s[s.length] = v[i];
            } else break;
        }
        return s.join('');
    }

    /**
     * 将分隔字符串转换为数字数组
     * @param v - 要转换的字符串，如 '1,2,3,4'
     * @param split - 分隔符（默认逗号）
     * @returns 转换后的数字数组
     * @example
     * // 返回 [10, 20, 30]
     * stringToNumberArray('10|20|30', '|');
     */
    export function stringToNumberArray(v: string, split = ','): number[] {
        const a = v.split(split);
        let b: number[] = [];
        for (let i = 0; i < a.length; i++) {
            b[b.length] = Number(a[i]);
        }
        return b;
    }

    /**
     * 主动触发垃圾回收（兼容微信小游戏和Web平台）
     * @remark
     * - 微信小游戏平台调用wx.triggerGC()
     * - 其他平台调用sys.garbageCollect()
     * @example
     * // 在加载新场景前触发GC
     * GC();
     * 
     * // 处理大量临时对象后触发
     * processTemporaryData();
     * GC();
     */
    export function GC() {
        warn('触发GC，进行垃圾回收');
        if (sys.platform == sys.Platform.WECHAT_GAME)
            window['wx']?.triggerGC();
        else
            sys.garbageCollect();
    }

    /**
     * 创建基础UI节点（默认添加UITransform组件）
     * @param name 节点名称（可选）
     * @param components 需要预添加的组件列表（支持组件类或组件名）
     * @returns 配置好的节点对象
     * @example
     * // 创建带Sprite和Button组件的节点
     * const node = newNode('MenuButton', [Sprite, 'YJButton']);
     * 
     * // 创建仅带UITransform的空白节点
     * const container = newNode('ScrollContent');
     */
    export function newNode(name?: string, components?: typeof Component[] | string[]): Node {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        n.addComponent(UITransform);
        if (components) {
            for (let i = 0; i < components.length; i++) {
                n.addComponent(components[i] as any);
            }
        };
        return n;
    }

    /**
     * 创建组件节点
     * @param name 节点名称
     * @param components 需要预添加的组件列表（支持组件类或组件名）
     * @returns 配置好的节点对象
     */
    export function newComponentNode(name: string, components: typeof Component[] | string[]): Node {
        const n = new Node(name);
        if (components) {
            for (let i = 0; i < components.length; i++) {
                n.addComponent(components[i] as any);
            }
        };
        return n;
    }

    /**
     * 构建敏感词DFA字典树（基于确定性有限自动机算法）
     * @param words 敏感词列表 
     * @returns DFA字典树结构
     * @example
     * // 构建游戏聊天敏感词库
     * const dfa = createSensitiveWordDFA(['外挂', '代练', '充值']);
     * 
     * // 构建政治敏感词库
     * const politicsDFA = createSensitiveWordDFA(await loadSensitiveWords());
     */
    export function createSensitiveWordDFA(words: string[]): any {
        const root: any = {};
        for (let i = 0; i < words.length; i++) {
            let node = root;
            let word = words[i];
            for (let j = 0; j < word.length; j++) {
                let char = word[j];
                node[char] = node[char] || {};
                node = node[char];
            }
            node.isEnd = true; // 标记敏感词结尾节点
        }
        return root;
    }

    /**
     * 使用DFA字典树检测敏感词
     * @param text 待检测文本内容
     * @param dfa 已构建的DFA字典树
     * @returns 检测到的敏感词数组（无敏感词时返回空数组）
     * @example
     * // 检测用户输入
     * const badWords = searchSensitiveWordDFA(userInput, dfa);
     * if(badWords.length > 0) showWarning(badWords);
     * 
     * // 过滤聊天内容
     * const filtered = searchSensitiveWordDFA(chatMessage, gameDFA)
     *            .reduce((s, w) => s.replace(w, '**'), chatMessage);
     */
    export function searchSensitiveWordDFA(text: string, dfa: any): string[] {
        let strs: string[] = [];
        for (let j = 0, n = text.length; j < n - 1; j++) {
            const ch1 = text[j];
            if (!dfa[ch1]) {
                continue;
            }
            let node = dfa[ch1];
            for (let i = j + 1; i < n; i++) {
                const ch = text[i];
                if (!node[ch]) {
                    continue;
                }
                node = node[ch];
                if (node.isEnd) {
                    strs[strs.length] = text.substring(j, i + 1);
                    j = i; // 跳过已检测部分
                    break;
                }
            }
        }
        return strs;
    }

    /**
     * 获取原型对象或原型属性
     * @param target 目标对象/类（可以是实例对象或类构造函数）
     * @param propertyKey （可选）要获取的原型属性名
     * @returns 原型对象 | 原型属性值 | undefined
     * @example
     * // 获取数组原型
     * const arrayProto = getPrototype([]);
     * 
     * // 获取数组的push方法
     * const pushMethod = getPrototype([], 'push');
     */
    export function getPrototype(target: any, propertyKey?: string) {
        let a: any;
        if (target) {
            if (target instanceof Function) {
                a = getClassPrototype(target);
            } else {
                a = Object.getPrototypeOf(target);
            }
        }
        if (propertyKey != null) return a?.[propertyKey];
        return a;
    }

    /**
     * 在原型对象上添加/覆盖属性
     * @param target 目标对象/类（实例对象或类构造函数）
     * @param properties 要添加的属性键值对
     * @example
     * // 给所有数组添加自定义方法
     * setPrototype(Array, {
     *   sum() { return this.reduce((a,b) => a + b, 0); }
     * });
     * [1,2,3].sum(); // 6
     */
    export function setPrototype(target: any, properties: { [k: string]: any }) {
        if (target) {
            if (target instanceof Function) {
                setClassPrototype(target, properties);
            } else {
                const a = Object.getPrototypeOf(target);
                js.mixin(a, properties);
            }
        }
    }

    /**
     * 获取类的原型对象或原型属性
     * @param clazz 类构造函数
     * @param propertyKey （可选）要获取的原型属性名
     * @returns 类的原型对象 | 原型属性值 | undefined
     * @example
     * // 获取Array类的原型
     * const arrayProto = getClassPrototype(Array);
     * 
     * // 获取Date类的now方法
     * const nowMethod = getClassPrototype(Date, 'now');
     */
    export function getClassPrototype(clazz: any, propertyKey?: string) {
        const a = clazz?.prototype;
        if (propertyKey != null) return a?.[propertyKey];
        return a;
    }

    /**
     * 在类的原型上添加/覆盖属性
     * @param clazz 类构造函数
     * @param properties 要添加的属性键值对
     * @example
     * // 为所有字符串添加前缀方法
     * setClassPrototype(String, {
     *   prefix(p: string) { return p + this; }
     * });
     * 'world'.prefix('hello '); // 'hello world'
     */
    export function setClassPrototype(clazz: any, properties: { [k: string]: any }) {
        if (clazz) {
            js.mixin(clazz.prototype, properties);
        }
    }

    /**
     * 检测目标对象的原型属性是否等于指定值
     * @param target 目标对象/类
     * @param propertyKey 要检测的原型属性名
     * @param val 要比较的值
     * @returns 是否相等
     * @example
     * // 检查数组的concat方法
     * isPrototypeEquals([], 'concat', Array.prototype.concat); // true
     * 
     * // 检查自定义类方法
     * class Player {}
     * setClassPrototype(Player, { hp: 100 });
     * isPrototypeEquals(Player, 'hp', 100); // true
     */
    export function isPrototypeEquals(target: any, propertyKey: string, val: any) {
        return getPrototype(target, propertyKey) == val;
    }

    /**
     * 在编辑器模式下获取资源（仅在Cocos Creator编辑器环境下可用）
     * @example
     * // 获取场景中使用的纹理资源信息
     * const textureInfo = await EditorMode.getAssetInfo('fcmR3XnlRK6QHYdTQxFc1S');
     * 
     * // 批量加载角色图集资源
     * const atlases = await EditorMode.loadSpriteAtlas(['characters/hero.plist', 'characters/enemy.plist']);
     */
    export namespace EditorMode {

        /**
         * 获取资源信息（支持跨包查询）
         * @param param 资源标识符，可以是uuid/url/path
         * @returns 资源信息对象（包含uuid、路径、类型等元数据）
         * @example
         * // 通过uuid查询
         * const info = await EditorMode.getAssetInfo('fcmR3XnlRK6KdTQxFc1S');
         * 
         * // 通过路径查询
         * const sceneInfo = await EditorMode.getAssetInfo('db://assets/resources/scenes/Main.fire');
         */
        export async function getAssetInfo(param: string) {
            return Editor.Message.request('asset-db', 'query-asset-info', param);
        }

        /**
         * 获取资源元数据（包含导入选项、依赖关系等）
         * @param url 资源url（格式：db://assets/...）
         * @returns 资源元数据对象
         * @example
         * // 获取预制体的元数据
         * const meta = await EditorMode.getAssetMeta('db://assets/resources/prefabs/Player.prefab');
         */
        export async function getAssetMeta(url: string) {
            return Editor.Message.request('asset-db', 'query-asset-meta', url);
        }

        /**
         * 获取指定类型的所有资源信息
         * @param ccType 资源类型标识，支持：'cc.SpriteFrame' | 'cc.AudioClip' | 'cc.Prefab' 等
         * @returns 符合类型的所有资源信息数组
         * @example
         * // 获取所有预制体资源
         * const prefabs = await EditorMode.getAssetInfosByCCType('cc.Prefab');
         */
        export async function getAssetInfosByCCType(ccType: string) {
            return Editor.Message.request('asset-db', 'query-assets', { ccType: ccType });
        }

        /**
         * 获取所有Asset Bundle配置信息
         * @returns 包含所有Asset Bundle信息的数组
         * @example
         * // 获取所有资源包信息
         * const bundles = await EditorMode.getBundleInfos();
         * console.log('当前项目包含的包:', bundles.map(b => b.name));
         */
        export async function getBundleInfos() {
            return Editor.Message.request('asset-db', 'query-assets', { isBundle: true });
        }

        /**
         * 获取所有Asset Bundle名称
         * @returns 资源包名称数组
         * @example
         * // 列出所有资源包名称
         * const bundleNames = await EditorMode.getBundleNames();
         * console.log('资源包列表:', bundleNames);
         */
        export async function getBundleNames() {
            return getBundleInfos().then(infos => {
                let names = [];
                for (let i = 0, n = infos.length; i < n; i++) {
                    names.push(infos[i].name);
                }
                return names;
            });
        }

        /**
         * 根据资源UUID获取完整资源路径
         * @param uuid 资源唯一标识符
         * @returns 格式为'bundleName/path/to/asset'的资源路径
         * @example
         * // 获取角色预制体路径
         * const path = await EditorMode.getAssetUrlByUuid('fcmR3XnlRK6KdTQxFc1S');
         * console.log('资源路径:', path); // 输出：'resources/prefabs/Player'
         */
        export async function getAssetUrlByUuid(uuid: string) {
            return Promise.all([getAssetInfo(uuid), getBundleNames()]).then(([info, bundleNames]) => {
                const url: string = info.path.replace('ad://assets/', '');
                const a: string[] = url.split('/')
                let bundleName = null;
                for (let i = 0, n = a.length; i < n; i++) {
                    if (bundleNames.includes(a[i])) {
                        bundleName = a[i];
                        break;
                    }
                }
                return bundleName ? `${bundleName}${url.split(bundleName)[1]}` : url;
            });
        }

        /**
         * 根据资源路径获取UUID
         * @param url 资源路径（格式：'bundleName/path/to/asset'）
         * @returns 资源唯一标识符
         * @example
         * // 获取主场景的UUID
         * const uuid = await EditorMode.getAssetUuidByUrl('resources/scenes/Main');
         */
        export async function getAssetUuidByUrl(url: string) {
            return getAssetInfo(url).then(info => {
                return info?.uuid;
            });
        }

        /**
         * 通用资源加载方法
         * @param url 资源路径（格式：'bundleName/path/to/asset'）
         * @returns 加载完成的资源对象
         * @example
         * // 加载SpriteFrame
         * const texture = await EditorMode.loadAnyFile<cc.SpriteFrame>('resources/textures/icon');
         */
        export async function loadAnyFile<T extends Asset>(url: string) {
            const uuid = await getAssetUuidByUrl(url);
            console.log('loadAnyFile', uuid);
            if (!uuid) {
                return null;
            }
            return new Promise<T>(resolve =>
                assetBundleManager.loadByUuid<T>(uuid, asset => resolve(asset))
            ).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 批量加载图集资源
         * @param urls 图集路径或路径数组（支持.plist或图集资源路径）
         * @returns 加载完成的图集资源数组
         * @example
         * // 加载多个图集
         * const atlases = await EditorMode.loadSpriteAtlas([
         *   'ui/atlas/common',
         *   'ui/atlas/equipment'
         * ]);
         */
        export async function loadSpriteAtlas(urls: string | string[]) {
            let requests: any[] = [];
            urls = [].concat(urls);
            for (let i = 0, n = urls.length; i < n; i++) {
                let info = await getAssetInfo(urls[i]);
                if (!info)
                    log('query-asset-info url无效', urls[i]);
                else {
                    requests[requests.length] = { 'uuid': info.uuid };
                }
            }
            if (!requests.length) {
                return [];
            }

            return new Promise<any>(resolve => {
                assetBundleManager.loadAnyFiles(requests, null, items => {
                    resolve(items);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 获取指定文件夹下特定类型的资源信息
         * @param folderUrl 文件夹路径（格式：'bundleName/path/to/folder'）
         * @param ccType 资源类型标识
         * @returns 符合条件的资源信息数组
         * @example
         * // 获取resources/audio下所有音频资源信息
         * const audioInfos = await EditorMode.loadAssetInfosOfCCTypeUnderFolder('resources/audio', 'cc.AudioClip');
         */
        export async function loadAssetInfosOfCCTypeUnderFolder(folderUrl: string, ccType: string) {
            return getAssetInfosByCCType(ccType).then((infos: any[]) => {
                let a: _AssetInfo[] = [];
                for (let i = 0, n = infos.length; i < n; i++) {
                    const info = infos[i];
                    if (info.url.indexOf(folderUrl) > -1) a[a.length] = info;
                }
                return a;
            });
        }

        /**
         * 加载指定文件夹下特定类型的所有资源
         * @param folderUrl 文件夹路径
         * @param ccType 资源类型标识
         * @returns 加载完成的资源数组
         * @example
         * // 加载resources/items下所有预制体
         * const items = await EditorMode.loadAssetsOfCCTypeUnderFolder('resources/items', 'cc.Prefab');
         */
        export async function loadAssetsOfCCTypeUnderFolder(folderUrl: string, ccType: string): Promise<Asset[]> {
            const infos: any[] = await getAssetInfosByCCType(ccType);
            let aa = [];
            for (let i = 0; i < infos.length; i++) {
                const a = infos[i];
                if (a['url'].indexOf(folderUrl) > -1) {
                    aa[aa.length] = { uuid: a.uuid };
                }
            }
            if (!aa.length) {
                return [];
            }
            return new Promise<Asset[]>(resolve => {
                assetBundleManager.loadAnyFiles(aa, null, items => {
                    resolve(items);
                });
            }).catch(e => {
                console.error(e);
                return [];
            });
        }

        /**
         * 根据名称和类型精确查找资源信息
         * @param name 完整文件名（包含扩展名）
         * @param ccType 资源类型标识
         * @returns 匹配的资源信息
         * @example
         * // 查找主场景预制体
         * const sceneInfo = await EditorMode.getAssetInfoOfCCTypeWithName('Main.fire', 'cc.SceneAsset');
         */
        export async function getAssetInfoOfCCTypeWithName(name: string, ccType: string) {
            return getAssetInfosByCCType(ccType).then((infos: _AssetInfo[]) => {
                let info: _AssetInfo;
                for (let i = 0, n = infos.length; i < n; i++) {
                    const asset = infos[i];
                    if (asset.name == name) {
                        info = asset;
                        break;
                    }
                }
                return info;
            });
        }

        /**
         * 获取指定文件夹下的所有Asset Bundle
         * @param folderUrl 文件夹路径
         * @returns 资源包名称数组
         * @example
         * // 获取resources/bundles下的所有资源包
         * const bundles = await EditorMode.getBundlesUnderFolder('resources/bundles');
         */
        export async function getBundlesUnderFolder(folderUrl: string) {
            return getBundleInfos().then(infos => {
                let bundles: string[] = [];
                for (let i = 0, n = infos.length; i < n; i++) {
                    const info = infos[i];
                    if (info.url.indexOf(folderUrl) == 0)
                        bundles[bundles.length] = info.name;
                }
                return bundles;
            });
        }

        /**
         * 根据资源路径解析所属Asset Bundle
         * @param url 资源路径
         * @returns 所属资源包名称
         * @example
         * // 解析资源所属包
         * const bundle = await EditorMode.getBundleName('characters/hero/hero.prefab');
         * console.log('资源所属包:', bundle); // 输出：'characters'
         */
        export async function getBundleName(url: string) {
            return getBundleInfos().then(infos => {
                const a: string[] = url.replace('ad://assets/', '').split('/');
                for (let i = 0, n = a.length; i < n; i++) {
                    const name = a[i];
                    for (let j = 0, m = infos.length; j < m; j++) {
                        if (infos[j].name == name) {
                            return infos[j].name;
                        }
                    }
                }
                return null;
            });
        }

        /**
         * 根据文件名智能识别并获取资源信息
         * @param fileName 完整文件名（包含扩展名）
         * @returns 匹配的资源信息
         * @example
         * // 获取字体资源信息
         * const fontInfo = await EditorMode.getAssetInfoByFileName('arial.ttf');
         */
        export async function getAssetInfoByFileName(fileName: string) {
            const p = fileName.split('.'),
                ext = p[p.length - 1];
            let ccType: string;
            switch (ext) {
                case 'png':
                case 'jpg':
                case 'jpeg':
                case 'bmp':
                case 'gif':
                    ccType = 'cc.SpriteFrame';
                    break;
                case 'plist':
                    ccType = 'cc.SpriteAtlas';
                    break;
                case 'json':
                    ccType = 'cc.JsonAsset';
                    break;
                case 'txt':
                    ccType = 'cc.TextAsset';
                    break;
                case 'ttf':
                    ccType = 'cc.TTFFont';
                    break;
                case 'mp3':
                case 'wav':
                case 'ogg':
                    ccType = 'cc.AudioClip';
                    break;
                case 'prefab':
                    ccType = 'cc.Prefab';
                    break;
                default:
            }
            return getAssetInfoOfCCTypeWithName(fileName, ccType);
        }

        /**
         * 根据文件名加载资源
         * @param fileName 完整文件名（包含扩展名）
         * @returns 加载完成的资源对象
         * @example
         * // 加载背景音乐
         * const bgm = await EditorMode.getAssetByFileName<cc.AudioClip>('background.mp3');
         */
        export async function getAssetByFileName<T extends Asset>(fileName: string) {
            return getAssetInfoByFileName(fileName).then(info => {
                console.log('info', info);
                if (info) {
                    return new Promise<T>(resolve =>
                        assetBundleManager.loadByUuid<T>(info.uuid, asset => resolve(asset))
                    ).catch(e => {
                        console.error(e);
                        return null;
                    });
                }
                return null;
            });
        }
    }

    /**
     * 基于31位种子计算的字符串哈希算法
     * @param str - 需要计算哈希值的输入字符串
     * @returns 返回0x7FFFFFFF范围内的正整数哈希值
     * @example
     * Hash("hello");  // 返回99162322
     * Hash("abc");    // 返回96354
     */
    export function Hash(str: string): number {
        const seed = 31;
        let hash = 0, i = 0;
        while (i < str.length) {
            let num = ((hash * seed) & 0xFFFFFFFF) >>> 0;
            hash = parseFloat(num + "") + str.charCodeAt(i++);
        }
        return (hash & 0x7FFFFFFF);
    }

    /**
     * 数学公式解析计算器，支持常见数学函数和运算符
     * @param formula - 数学表达式字符串（自动去除空格）
     * @returns 计算结果数值
     * @example
     * evalFormula('sin(PI/2)');    // 返回1
     * evalFormula('2^3 + sqrt(9)');// 返回11
     * evalFormula('-5 + 3*2');     // 返回1
     * 
     * 支持函数：sin,cos,tan,sqrt,log,abs,ceil,floor,round,max,min,random,pow
     * 支持常量：PI,E
     * 支持运算符：+,-,*,/,^
     */
    export function evalFormula(formula: string) {
        formula = formula.replace(/\s/g, '');
        let a = splitFormula(formula);
        if (typeof a == 'string') {
            return -Number(a.replace('_', ''));
        }
        return a;
    }

    /**
     * 获取字符串中两个标记之间的内容（支持嵌套匹配）
     * @param str - 原始字符串
     * @param start - 起始标记字符
     * @param end - 结束标记字符
     * @param begin - 开始搜索的起始位置，默认为0
     * @returns 匹配到的子字符串或null
     * @example
     * getStringBetween('a(b(c))d', '(', ')');  // 返回"b(c)"
     * getStringBetween('test[123]', '[', ']'); // 返回"123"
     * getStringBetween('no match', '{', '}');  // 返回null
     */
    export function getStringBetween(str: string, start: string, end: string, begin = 0) {
        const i1 = str.indexOf(start, begin);
        if (i1 > -1) {
            let l = 0;
            for (let i = i1 + 1, n = str.length; i < n; i++) {
                if (str[i] == start) l++;
                if (str[i] == end) {
                    if (l == 0)
                        return str.substring(i1 + 1, i);
                    else l--;
                }
            }
        }
        return null;
    }

    /**
     * 递归解析数学公式的核心方法
     * @param formula 需要解析的公式字符串
     * @returns 解析后的数值或中间表达式（负数用_代替-号）
     * @example
     * // 处理基本数字
     * splitFormula('3.14'); // => 3.14
     * 
     * // 处理数学函数（递归解析参数）
     * splitFormula('sin(_0.5)'); // 先替换负号再计算sin(-0.5)
     * 
     * // 处理嵌套运算
     * splitFormula('2*(3+4)'); // 先计算3+4=7，再计算2*7=14
     * 
     * // 处理运算符优先级
     * splitFormula('3+5*2'); // 先计算5*2=10，再计算3+10=13
     */
    function splitFormula(formula: string) {
        // 基础情况：直接转换为数字
        const r = Number(formula);
        if (!isNaN(r)) return r;

        // 处理数学函数（sin/cos/tan等）
        const mathFuncs = ['sin', 'cos', 'tan', 'sqrt', 'log', 'abs', 'ceil', 'floor', 'round', 'max', 'min', 'random', 'pow'];
        for (let i = 0, n = mathFuncs.length; i < n; i++) {
            const func = mathFuncs[i];
            const idx = formula.indexOf(func);
            if (idx > -1) {
                // 提取函数参数并递归解析
                const sss = getStringBetween(formula, '(', ')', idx);
                const args: any[] = sss.split(',');

                // 处理参数中的负号（_替换为-）
                for (let i = 0; i < args.length; i++) {
                    const b = splitFormula(args[i]);
                    args[i] = typeof b == 'string' && b.startsWith('_') ?
                        b.replace('_', '-') : b;
                }

                // 执行数学函数并替换原表达式
                const a = Math[func](...args);
                return splitFormula(formula.replace(`${func}(${sss})`, `${a}`));
            }
        }

        // 处理数学常量（PI/E）
        const mathConsts = ['PI', 'E'];
        for (let i = 0, n = mathConsts.length; i < n; i++) {
            const c = mathConsts[i];
            const idx = formula.indexOf(c);
            if (idx > -1) {
                const a = Math[c]; // 获取实际常数值
                return splitFormula(formula.replace(c, `${a}`));
            }
        }

        // 处理括号表达式（优先计算）
        const s = getStringBetween(formula, '(', ')');
        if (s) {
            const n = splitFormula(s); // 递归计算括号内容
            formula = formula.replace(`(${s})`, `${n}`);
            return splitFormula(formula);
        }

        // 处理四则运算（注意运算符优先级问题）
        const ops = ['+', '-', '*', '/'];
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            let j = formula.indexOf(op);
            if (j > -1) {
                // 分割左右操作数并递归解析
                let n1: any = formula.substring(0, j);
                let n2: any = formula.substring(j + 1);

                // 处理操作数中的负号
                n1 = processOperand(n1);
                n2 = processOperand(n2);

                // 执行运算
                let a: number;
                switch (op) {
                    case '+': a = Number(n1) + Number(n2); break;
                    case '-': a = Number(n1) - Number(n2); break;
                    case '*': a = Number(n1) * Number(n2); break;
                    case '/': a = Number(n1) / Number(n2); break;
                }

                // 处理负数结果（用_代替-避免运算符混淆）
                return a < 0 ? '_' + (-a) : a;
            }
        }

        /** 处理操作数中的表达式和负号 */
        function processOperand(operand: string) {
            if (isNaN(Number(operand))) {
                return operand.startsWith('_') ?
                    operand.replace('_', '-') :
                    splitFormula(operand);
            }
            return operand;
        }
    }

    /**
     * 计算数值数组的总和
     * @param arr 需要计算的数值数组
     * @returns 数组元素的总和
     * @example
     * // 返回 6
     * sumOfArray([1, 2, 3]);
     * 
     * // 处理空数组返回 0
     * sumOfArray([]);
     */
    export function sumOfArray(arr: number[]) {
        return arr.reduce((a, b) => a + b, 0);
    }

    /**
     * 深度比较两个对象/数组是否相等
     * @param a 第一个比较对象（支持对象/数组/基本类型）
     * @param b 第二个比较对象（支持对象/数组/基本类型）
     * @returns 是否深度相等
     * @example
     * // 返回 true
     * objectEquals({a:1, b:{c:2}}, {a:1, b:{c:2}});
     * 
     * // 返回 false
     * objectEquals([1,2,3], [1,2]);
     * 
     * // 处理日期对象比较
     * const d1 = new Date(2024);
     * const d2 = new Date(2024);
     * objectEquals(d1, d2); // true
     */
    export function objectEquals(a: any, b: any) {
        if (a == null || b == null) return false;
        if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length && a.every((v, i) => objectEquals(v, b[i]));
        }
        if (typeof a === 'object' && typeof b === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            for (let i = 0, n = keysA.length; i < n; i++) {
                let key = keysA[i];
                if (!keysB.includes(key) || !objectEquals(a[key], b[key])) return false;
            }
            return true;
        }
        return a === b;
    }

    /**
     * 将触摸事件起始点坐标转换为目标节点本地坐标系坐标
     * @param touch 触摸事件对象
     * @param node 目标节点（需要包含UITransform组件）
     * @returns 节点本地坐标系中的坐标（Vec3类型）
     * @example
     * // 在触摸事件回调中获取起始坐标
     * button.node.on(Node.EventType.TOUCH_START, (touch) => {
     *   const localPos = touchStartPosInNode(touch, button.node);
     *   console.log('触摸起始位置:', localPos);
     * });
     */
    export function touchStartPosInNode(touch: EventTouch, node: Node) {
        const p = touch.getUIStartLocation();
        return no.worldPositionInNode(v3(p.x, p.y), node);
    }

    /**
     * 将触摸事件当前点坐标转换为目标节点本地坐标系坐标
     * @param touch 触摸事件对象
     * @param node 目标节点（需要包含UITransform组件）
     * @returns 节点本地坐标系中的坐标（Vec3类型）
     * @example
     * // 实时跟踪触摸移动位置
     * slider.node.on(Node.EventType.TOUCH_MOVE, (touch) => {
     *   const currentPos = touchPosInNode(touch, slider.node);
     *   updateSliderThumb(currentPos.x);
     * });
     */
    export function touchPosInNode(touch: EventTouch, node: Node) {
        const p = touch.getUILocation();
        return no.worldPositionInNode(v3(p.x, p.y), node);
    }

    /**
     * 判断直线是否与矩形相交
     * @param line 直线段对象，包含起点p1和终点p2
     * @param rect 矩形区域（需使用Rect类型）
     * @returns 是否相交（true表示相交，false表示不相交）
     * @example
     * // 创建测试直线和矩形
     * const line1 = { p1: v2(10, 10), p2: v2(300, 200) };
     * const rect1 = new Rect(50, 50, 200, 150);
     * console.log(lineIntersetsRect(line1, rect1)); // true
     * 
     * // 完全在矩形内部的直线
     * const line2 = { p1: v2(60, 60), p2: v2(180, 120) };
     * console.log(lineIntersetsRect(line2, rect1)); // true
     * 
     * // 完全在矩形外部的直线
     * const line3 = { p1: v2(0, 0), p2: v2(30, 30) };
     * console.log(lineIntersetsRect(line3, rect1)); // false
     */
    export function lineIntersetsRect(line: { p1: Vec2, p2: Vec2 }, rect: Rect): boolean {
        const { p1, p2 } = line;
        if (rect.contains(p1) || rect.contains(p2)) return true;
        if (p1.x < rect.xMin && p2.x < rect.xMin) return false;
        if (p1.x > rect.xMax && p2.x > rect.xMax) return false;
        if (p1.y < rect.yMin && p2.y < rect.yMin) return false;
        if (p1.y > rect.yMax && p2.y > rect.yMax) return false;
        const pMin = v2(), pMax = v2();
        if (p1.x < rect.xMin) {
            pMin.x = rect.xMin;
            pMin.y = rect.yMin;
            pMax.x = rect.xMin;
            pMax.y = rect.yMax;
        } else if (p1.x > rect.xMax) {
            pMin.x = rect.xMax;
            pMin.y = rect.yMin;
            pMax.x = rect.xMax;
            pMax.y = rect.yMax;
        } else if (p1.y < rect.yMin) {
            pMin.x = rect.xMin;
            pMin.y = rect.yMin;
            pMax.x = rect.xMax;
            pMax.y = rect.yMin;
        } else if (p1.y > rect.yMax) {
            pMin.x = rect.xMin;
            pMin.y = rect.yMax;
            pMax.x = rect.xMax;
            pMax.y = rect.yMax;
        }
        const a_p1_pMin = no.angleTo(p1, pMin).angle,
            a_p1_pMax = no.angleTo(p1, pMax).angle,
            a_p1_p2 = no.angleTo(p1, p2).angle;
        return a_p1_p2 >= a_p1_pMin && a_p1_p2 <= a_p1_pMax || a_p1_p2 >= a_p1_pMax && a_p1_p2 <= a_p1_pMin;
    }

    /**
     * 矩形相交
     * @param rect1 矩形1
     * @param rect2 矩形2
     * @returns 是否相交
     */
    export function rectIntersectsRect(rect1: { minX: number, minY: number, maxX: number, maxY: number }, rect2: { minX: number, minY: number, maxX: number, maxY: number }) {
        // 判断两个矩形是否相交
        // 只要有一条边不重叠就不相交
        return !(
            rect1.maxX < rect2.minX ||
            rect1.minX > rect2.maxX ||
            rect1.maxY < rect2.minY ||
            rect1.minY > rect2.maxY
        );
    }

    /**
     * 点是否在矩形内
     * @param point 点
     * @param rect 矩形
     * @returns 是否在矩形内
     */
    export function pointInRect(point: { x: number, y: number }, rect: { minX: number, minY: number, maxX: number, maxY: number }) {
        return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
    }

    /**
     * 点是否在矩形内（带旋转）
     * @param point 要检测的点
     * @param pos 矩形中心点
     * @param rect 矩形
     * @param radian 旋转弧度
     * @returns 是否在矩形内
     */
    export function pointInRectWithRotation(point: { x: number, y: number }, pos: { x: number, y: number }, rect: { minX: number, minY: number, maxX: number, maxY: number }, radian: number) {
        const p = no.rotatePointByCenter(point, pos, -radian);
        return pointInRect(p, rect);
    }

    /**
     * 向量叉积公式
     * @param A 点
     * @param B 点
     * @param P 点
     * @returns 叉积
     */
    function crossProduct(A: Vec2 | { x: number, y: number }, B: Vec2 | { x: number, y: number }, P: Vec2 | { x: number, y: number }): number {
        return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
    }

    /**
     * 同向法（叉积法）​判断点是否在三角形内
     * 原理​：若点 P 在三角形 ABC 内部，则它必须位于所有边的同一侧（左侧或右侧，取决于三角形方向）。通过叉积符号判断方向
     * @param P 点
     * @param A 三角形顶点
     * @param B 三角形顶点
     * @param C 三角形顶点
     * @returns 是否在三角形内
     */
    export function isPointInTriangle(P: Vec2 | { x: number, y: number }, A: Vec2 | { x: number, y: number }, B: Vec2 | { x: number, y: number }, C: Vec2 | { x: number, y: number }) {
        const cpAB = crossProduct(A, B, P);  // P 相对 AB 的位置
        const cpBC = crossProduct(B, C, P);  // P 相对 BC 的位置
        const cpCA = crossProduct(C, A, P);  // P 相对 CA 的位置

        // 检查是否同侧（包含边界）
        return (
            (cpAB >= 0 && cpBC >= 0 && cpCA >= 0) ||
            (cpAB <= 0 && cpBC <= 0 && cpCA <= 0)
        );
    }

    /**
     * 根据分隔符获取字符串的指定索引参数（自动处理越界情况）
     * @param str 原始字符串（非字符串类型直接返回原值）
     * @param split 分隔符（支持多字符分隔）
     * @param index 参数索引（从0开始）
     * @returns 对应索引的参数值（越界时返回最后一个参数）
     * @example
     * // 获取第二个颜色参数
     * getParamByIndex('red,green,blue', ',', 1); // 'green'
     * 
     * // 处理越界索引
     * getParamByIndex('a|b|c', '|', 5); // 'c'
     * 
     * // 处理非字符串输入
     * getParamByIndex(12345, ',', 0); // 12345
     */
    export function getParamByIndex(str: any, split: string, index: number): string {
        if (typeof str !== 'string') return str;
        const a = str.split(split);
        if (a.length > index) {
            return a[index];
        }
        return a[a.length - 1];
    }

    /**
     * 创建计数器函数（达到指定调用次数后触发回调）
     * @param callback 回调函数（支持异步函数）
     * @param count 需要触发的调用次数
     * @returns 包装后的计数函数
     * @example
     * // 累计3次点击后执行
     * const countClick = countCall(() => {
     *   console.log('按钮点击满3次');
     * }, 3);
     * button.on('click', countClick);
     * 
     * // 异步回调示例
     * const asyncCounter = countCall(async () => {
     *   await loadResources();
     * }, 5);
     * for(let i=0; i<5; i++) asyncCounter();
     */
    export function countCall(callback: Function, count: number): any {
        let currentCount = 0;
        if (callback.constructor.name === 'AsyncFunction') {
            return (async function () {
                currentCount++;
                if (currentCount >= count) {
                    await (callback)();
                    currentCount = 0;
                }
            }) as any;
        } else {
            return (function () {
                currentCount++;
                if (currentCount >= count) {
                    (callback)();
                    currentCount = 0;
                }
            }) as any;
        }
    }

    /**
     * 获取浏览器URL查询参数（兼容哈希模式）
     * @param name 要获取的参数名称
     * @returns 参数值（未找到时返回null）
     * @example
     * // URL为 http://example.com?page=2&lang=zh
     * GetQueryString('page'); // '2'
     * GetQueryString('lang'); // 'zh'
     * GetQueryString('token'); // null
     * 
     * // 处理哈希路由模式
     * // URL为 http://example.com/#/path?debug=true
     * GetQueryString('debug'); // 'true'
     */
    export function GetQueryString(name: string) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURIComponent(r[2]); return null;
    }


    //////////////////canvas缓存池//////////////////
    /**
     * 共享标签数据接口，存储canvas及其上下文
     */
    interface ISharedLabelData {
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D | null;
    }

    /**
     * Canvas缓存池管理类（单例模式）
     * 用于复用canvas对象，减少内存分配开销
     */
    class CanvasPool {
        private static _instance: CanvasPool;
        static getInstance(): CanvasPool {
            if (!this._instance) {
                this._instance = new CanvasPool();
            }
            return this._instance;
        }

        /** 缓存对象池 */
        public pool: ISharedLabelData[] = [];

        /**
         * 从缓存池获取canvas对象
         * @returns 可用的canvas数据对象（新建或复用）
         * @example
         * const data = canvasPool.get();
         * const ctx = data.context;
         * ctx.fillText("Hello", 10, 10);
         */
        public get() {
            let data = this.pool.pop();

            if (!data) {
                const canvas = window.document.createElement('canvas');
                const context = canvas.getContext('2d');
                data = {
                    canvas,
                    context,
                };
            }
            else {
                // 复用前清空画布内容
                data.context.clearRect(0, 0, data.canvas.width, data.canvas.height);
            }
            return data;
        }

        /**
         * 归还canvas对象到缓存池
         * @param canvas 要回收的canvas数据对象
         * @example
         * // 使用完成后归还
         * canvasPool.put(usedData);
         * 
         * // 当缓存池已满时直接丢弃
         * if (canvasPool.pool.length < MAX_SIZE) {
         *     canvasPool.put(data);
         * }
         */
        public put(canvas: ISharedLabelData) {
            if (this.pool.length >= macro.MAX_LABEL_CANVAS_POOL_SIZE) {
                return;
            }
            this.pool.push(canvas);
        }
    }

    /**
     * 导出的canvas缓存池单例实例
     * @example
     * // 直接使用实例
     * const pool = canvasPool;
     * const tempCanvas = pool.get();
     */
    export const canvasPool: CanvasPool = CanvasPool.getInstance();
    //////////////////canvas缓存池//////////////////


    //////////////////node缓存池//////////////////

    /**
     * 节点对象缓存池（支持类型分类存储与获取）
     * @remarks
     * - 实现节点对象的复用管理
     * - 自动处理节点的可见性与交互状态
     * - 内置缓存过期时间记录（可通过扩展实现自动清理）
     * 
     * @example
     * // 从缓存池获取子弹节点
     * const bullet = nodePool.get('bullet');
     * if (!bullet) {
     *   bullet = instantiate(bulletPrefab);
     * }
     * 
     * // 回收使用完毕的敌人节点
     * nodePool.put('enemy', deadEnemyNode);
     */
    export class NodePool {
        private cacheMap: Map<string, FixedSizeArray<Node>>;
        private static _ins: NodePool = null;

        /** 获取缓存池单例实例 */
        public static ins(): NodePool {
            if (!this._ins) this._ins = new NodePool();
            return this._ins;
        }

        constructor() {
            this.cacheMap = new Map<string, FixedSizeArray<Node>>();
        }

        /**
         * 从缓存池获取节点对象
         * @param type - 节点类型标识符
         * @returns 可用节点对象或null,需要手动设置父节点
         * @example
         * // 获取UI弹窗节点
         * const popup = nodePool.get('settingsPopup');
         */
        public get(type: string): Node {
            if (this.cacheMap.has(type)) {
                let cache = this.cacheMap.get(type).shift();
                if (!cache) {
                    return null;
                }
                if (!cache.isValid) {
                    cache.destroy();
                    cache = null;
                    return this.get(type);
                }
                // this._visible(cache, true);
                visible(cache, true);
                return cache;
            }
            return null;
        }

        /**
         * 存放节点对象到缓存池
         * @param type - 节点类型标识符
         * @param node - 要缓存的节点实例
         * @example
         * // 缓存过关奖励弹窗
         * nodePool.put('levelRewardPopup', rewardPopup);
         */
        public put(type: string, node: Node) {
            // this._visible(node, false);
            visible(node, false);
            //从节点树中移除，减少渲染遍历开销
            node.parent = null;
            if (!this.cacheMap.has(type)) {
                this.cacheMap.set(type, new FixedSizeArray<Node>(100));
            }
            this.cacheMap.get(type).push(node);
        }

        /** 根据类型清空缓存节点 */
        public clearByType(type: string) {
            if (this.cacheMap.has(type)) {
                const v = this.cacheMap.get(type);
                for (let i = 0; i < v.length(); i++) {
                    v.get(i)?.destroy();
                }
                this.cacheMap.delete(type);
            }
        }

        /** 清空所有缓存节点 */
        public clear() {
            this.cacheMap.forEach((v, k) => {
                this.clearByType(k)
            });
            this.cacheMap.clear();
        }

        /**
         * 控制节点可见性与交互状态
         * @param node - 要操作的节点
         * @param v - 是否可见/可交互
         */
        private _visible(node: Node, v: boolean) {
            const blockInputEvents = node.getComponentsInChildren(BlockInputEvents);
            if (blockInputEvents)
                for (let i = 0; i < blockInputEvents.length; i++) {
                    blockInputEvents[i].enabled = v;
                }
            const btn = node.getComponent(Button);
            if (btn) btn.interactable = v;
            if (node.parent) {
                if (!v) {
                    const opacityCmp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                    opacityCmp.opacity = 0;
                    if (node['__origin_x__'] == null) {
                        node['__origin_x__'] = x(node);
                    }
                    x(node, 20000);
                } else {
                    node.getComponent(UIOpacity).opacity = 255;
                    if (node['__origin_x__'] !== null) {
                        x(node, node['__origin_x__']);
                    }
                }
            }
        }
    }

    /** 全局节点缓存池实例 */
    export const nodePool = NodePool.ins();
    //////////////////node缓存池//////////////////


    //////////////////数据object缓存池//////////////////

    export class DataObjectPool {
        private cacheMap: Map<string, FixedSizeArray<any>>;
        private static _ins: DataObjectPool = null;

        public static ins(): DataObjectPool {
            if (!this._ins) this._ins = new DataObjectPool();
            return this._ins;
        }

        constructor() {
            this.cacheMap = new Map<string, FixedSizeArray<any>>();
        }

        public get(type: string): any {
            if (this.cacheMap.has(type)) {
                return this.cacheMap.get(type).shift();
            }
            return null;
        }

        public put(type: string, data: any) {
            if (!this.cacheMap.has(type)) {
                this.cacheMap.set(type, new FixedSizeArray<any>(100));
            }
            this.cacheMap.get(type).push(data);
        }

        public clearByType(type: string) {
            if (this.cacheMap.has(type)) {
                this.cacheMap.get(type).clear();
                this.cacheMap.delete(type);
            }
        }

        public clear() {
            this.cacheMap.forEach((v, k) => {
                this.clearByType(k);
            });
            this.cacheMap.clear();
        }

    }
    //////////////////数据object缓存池//////////////////

    /**
     * 获取对象精确类型（比typeof更准确识别包装对象和null）
     * @param obj - 需要检测的对象
     * @returns 类型名：'Array' | 'Object' | 'String' | 'Number' | 
     *          'Boolean' | 'Function' | 'Null' | 'Undefined' | 'Symbol'
     * @example
     * // 基本类型检测
     * objectType([]); // 'Array'
     * objectType(null); // 'Null'
     * objectType('test'); // 'String'
     * 
     * // 检测包装对象
     * objectType(new Number(5)); // 'Number'
     * 
     * // 检测自定义类实例
     * class MyClass {}
     * objectType(new MyClass()); // 'Object'
     */
    export function objectType(obj: any): string {
        return Object.prototype.toString.call(obj).slice(8, -1);
    }

    /**
     * 带返回值的异步函数类型定义（泛型）
     * @template T - 函数返回值类型
     */
    type PromiseHandlerFuncReturn<T> = () => T;

    /**
     * 带resolve/reject回调的异步函数类型定义
     */
    type PromiseHandlerFuncResolve = (resolve: (value?: any) => void, reject: (reason?: any) => void) => void;

    /**
     * 安全处理异步操作并返回默认值的Promise包装器
     * @template T - 返回值类型
     * @param func - 要执行的异步函数（需返回T类型值）
     * @param defaultValue - 发生错误时返回的默认值
     * @returns Promise包装后的执行结果
     * @example
     * // 处理可能失败的API请求
     * const data = await promiseHandlerWithReturnValue(
     *   () => fetchDataFromServer(),
     *   { default: 'data' }
     * );
     * 
     * // 处理JSON解析
     * const config = await promiseHandlerWithReturnValue(
     *   () => JSON.parse(localStorage.getItem('config')),
     *   {}
     * );
     */
    export async function promiseHandlerWithReturnValue<T>(
        func: PromiseHandlerFuncReturn<T>,
        defaultValue: T
    ): Promise<T> {
        return new Promise<T>((resolve) => {
            try {
                const res = func();
                resolve(res);
            } catch (e) {
                console.error(e.stack);
                resolve(defaultValue);
            }
        });
    }

    /**
     * 处理带有resolve/reject回调的Promise执行器
     * @param func 要执行的函数，接收resolve和reject回调作为参数，执行可能抛出异常的操作
     * @returns 返回Promise的结果（执行成功时返回resolve值，失败时返回null）
     * @example
     * // 基本用法
     * const result = await promiseHandlerCallRevole((resolve, reject) => {
     *   someAsyncOperation().then(resolve).catch(reject);
     * });
     * 
     * // 处理可能抛出异常的操作
     * const data = await promiseHandlerCallRevole((resolve) => {
     *   const json = JSON.parse(rawData); // 可能抛出异常
     *   resolve(json);
     * });
     * 
     * // 处理网络请求失败
     * const response = await promiseHandlerCallRevole(async (resolve, reject) => {
     *   try {
     *     const res = await fetch('https://api.example.com/data');
     *     resolve(await res.json());
     *   } catch(e) {
     *     reject(e);
     *   }
     * });
     */
    export async function promiseHandlerCallRevole(func: PromiseHandlerFuncResolve) {
        return new Promise<any>((resolve, reject) => {
            try {
                func(resolve, reject);
            } catch (e) {
                console.error(e.stack);
                resolve(null);
            }
        });
    }

    /**
     * 二次贝塞尔曲线专用公式
     * @param t 
     * @param p0 
     * @param p1 
     * @param p2 
     * @returns 
     */
    const bezierQuadratic = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }): { x: number, y: number } => ({
        x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
        y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y
    });

    /**
     * 三次贝塞尔曲线专用公式
     * @param t 
     * @param p0 
     * @param p1 
     * @param p2 
     * @param p3 
     * @returns 
     */
    const bezierCubic = (t: number, p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }): { x: number, y: number } => ({
        x: (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * p1.x + 3 * (1 - t) * t ** 2 * p2.x + t ** 3 * p3.x,
        y: (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * p1.y + 3 * (1 - t) * t ** 2 * p2.y + t ** 3 * p3.y
    });

    /**
     * 贝塞尔曲线点数组
     * @param points 控制点数组,可以是二或三个点
     * @param segment 分段数
     * @param isInt 是否取整
     * @returns 贝塞尔曲线点
     */
    export function bezierPoints(points: Vec2[] | { x: number, y: number }[], segment: number, isInt = true): { x: number, y: number }[] {
        let arr: { x: number, y: number }[] = [];
        let n = points.length;
        if (n > 4) {
            //多阶用通用公式计算
            // 预计算组合数
            let combinations = [];
            for (let i = 0; i < n; i++) {
                combinations[combinations.length] = no.combination(n - 1, i);
            }

            // 计算曲线上的点
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = { x: 0, y: 0 };

                // 贝塞尔曲线公式实现
                for (let j = 0; j < n; j++) {
                    let pp = points[j];
                    let v = combinations[j] * Math.pow((1 - t), (n - 1 - j)) * Math.pow(t, j);
                    p.x += pp.x * v;
                    p.y += pp.y * v;
                }
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        } else if (n == 4) {
            //三阶用三次贝塞尔曲线公式计算
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = bezierCubic(t, points[0], points[1], points[2], points[3]);
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        } else if (n == 3) {
            //二阶用二次贝塞尔曲线公式计算
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = bezierQuadratic(t, points[0], points[1], points[2]);
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        } else if (n == 2) {
            //一阶用线性插值计算
            for (let i = 0; i < segment; i++) {
                let t = i / segment;
                let p = { x: points[0].x + (points[1].x - points[0].x) * t, y: points[0].y + (points[1].y - points[0].y) * t };
                if (isInt) {
                    p.x = Math.floor(p.x);
                    p.y = Math.floor(p.y);
                }
                arr[arr.length] = p;
            }
        }

        // 添加终点确保精度
        let end = points[points.length - 1];
        arr[arr.length] = { x: end.x, y: end.y };
        return arr;
    }

    /**
     * 检查点是否在直线上
     * @param line 直线
     * @param point 点
     * @param precision 精度
     * @returns 是否在直线上
     */
    export function checkPointInLine(line: { x: number, y: number }[], point: { x: number, y: number }, precision: number = 5) {
        if (!line[0] || !line[1] || !point) return false;
        const dis1 = distance(line[0], point);
        const dis2 = distance(line[1], point);
        const dis3 = distance(line[0], line[1]);
        return (dis1 + dis2) <= (dis3 + precision);
    }

    const _tempPoint: { x: number, y: number } = { x: 0, y: 0 };
    /**
     * 旋转点
     * @param point 点
     * @param radian 旋转角度
     * @returns 旋转后的点
     */
    export function rotatePoint(point: { x: number, y: number }, radian: number) {
        if (radian == 0) return point;
        const cos = Math.cos(radian);
        const sin = Math.sin(radian);
        _tempPoint.x = point.x * cos - point.y * sin;
        _tempPoint.y = point.x * sin + point.y * cos;
        point = null;
        return _tempPoint;
    }

    /**
     * 以中心点旋转点
     * @param point 点
     * @param center 中心点
     * @param radian 旋转角度
     * @returns 旋转后的点
     */
    export function rotatePointByCenter(point: { x: number, y: number }, center: { x: number, y: number }, radian: number) {
        let x = point.x - center.x;
        let y = point.y - center.y;
        const rotated = rotatePoint({ x, y }, radian);
        rotated.x += center.x;
        rotated.y += center.y;
        return rotated;
    }

    /**
     * 获取指定layer的相机
     * @param layer 对应node.layer
     */
    export function getCamera(layer: number): rendererCamera {
        const cameras = director.getScene().scene.renderScene.cameras;
        for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (camera.visibility & layer) {
                return camera;
            }
        }
        return null;
    }


    const _calculateProjectileMotionCache: {
        timeToPeak: number,
        maxHeight: number,
        totalTime: number,
        range: number,
        horizontalSpeed: number,
        verticalSpeed: number,
        peakVelocity: number
    } = { timeToPeak: 0, maxHeight: 0, totalTime: 0, range: 0, horizontalSpeed: 0, verticalSpeed: 0, peakVelocity: 0 };
    /**
     * 计算斜抛运动参数（考虑重力加速度）
     * @param initialSpeed 初速度（单位：米/秒）
     * @param angle 发射角度（单位：度，0-90度）
     * @param gravity 重力加速度（单位：米/秒²，默认9.8）
     * @returns 包含各种运动参数的对象
     * @example
     * // 计算导弹发射参数
     * const missileData = no.calculateProjectileMotion(100, 45, 9.8);
     * console.log(`最高点时间：${missileData.timeToPeak}秒`);
     * console.log(`最大高度：${missileData.maxHeight}米`);
     * console.log(`总飞行时间：${missileData.totalTime}秒`);
     * console.log(`水平射程：${missileData.range}米`);
     * 
     * // 游戏中的子弹轨迹计算
     * const bulletData = no.calculateProjectileMotion(50, 30);
     * this.scheduleOnce(() => {
     *   // 在最高点时触发特效
     *   this.showPeakEffect();
     * }, bulletData.timeToPeak);
     */
    export function calculateProjectileMotion(initialSpeed: number, angle: number, gravity: number, maxDistance?: number): {
        timeToPeak: number,      // 到达最高点时间
        maxHeight: number,       // 最大高度
        totalTime: number,       // 总飞行时间
        range: number,           // 水平射程
        horizontalSpeed: number, // 水平速度分量
        verticalSpeed: number,   // 垂直速度分量
        peakVelocity: number     // 最高点时的水平速度
    } {
        // 将角度转换为弧度
        const angleRad = no.angleToRadian(angle);

        // 分解速度分量
        _calculateProjectileMotionCache.horizontalSpeed = initialSpeed * Math.cos(angleRad);
        _calculateProjectileMotionCache.verticalSpeed = initialSpeed * Math.sin(angleRad);

        // 计算到达最高点的时间（垂直速度减为0的时间）
        _calculateProjectileMotionCache.timeToPeak = Math.abs(_calculateProjectileMotionCache.verticalSpeed / gravity);

        // 计算最大高度（使用运动学公式：h = v0*t - 0.5*g*t²）
        _calculateProjectileMotionCache.maxHeight = _calculateProjectileMotionCache.verticalSpeed * _calculateProjectileMotionCache.timeToPeak - 0.5 * gravity * _calculateProjectileMotionCache.timeToPeak * _calculateProjectileMotionCache.timeToPeak;

        // 计算总飞行时间（从发射到落地的时间）
        _calculateProjectileMotionCache.totalTime = maxDistance ? Math.abs(maxDistance / _calculateProjectileMotionCache.horizontalSpeed) : 0;

        // 计算水平射程
        _calculateProjectileMotionCache.range = _calculateProjectileMotionCache.horizontalSpeed * _calculateProjectileMotionCache.timeToPeak * 2;

        return _calculateProjectileMotionCache;
    }

    const _calculateProjectileMotionAtTimeCache: { x: number, y: number, angleChange: number, horizontalDistance: number, verticalDistance: number } = { x: 0, y: 0, angleChange: 0, horizontalDistance: 0, verticalDistance: 0 };
    /**
     * 计算斜抛物体在指定时间的运动参数
     * @param initialSpeed 初速度（单位：米/秒）
     * @param angle 发射角度（单位：度，0-90度）
     * @param time 指定时间（单位：秒）
     * @param gravity 重力加速度（单位：米/秒²，默认9.8）
     */
    export function calculateProjectileMotionAtTime(horizontalSpeed: number, verticalSpeed: number, time: number, gravity: number) {
        _calculateProjectileMotionAtTimeCache.x = horizontalSpeed * time;
        _calculateProjectileMotionAtTimeCache.y = verticalSpeed * time - 0.5 * gravity * time * time;
        const newVerticalSpeed = verticalSpeed - gravity * time;

        //计算角度变化
        _calculateProjectileMotionAtTimeCache.angleChange = Math.atan(newVerticalSpeed / horizontalSpeed) * 180 / Math.PI;
        if (horizontalSpeed < 0) _calculateProjectileMotionAtTimeCache.angleChange += 180;
        _calculateProjectileMotionAtTimeCache.horizontalDistance = horizontalSpeed * time;
        _calculateProjectileMotionAtTimeCache.verticalDistance = verticalSpeed * time - 0.5 * gravity * time * time;
        return _calculateProjectileMotionAtTimeCache;
    }

    /**
     * 计算斜抛运动角度
     * @param speed 初速度
     * @param horizontalDistance 水平距离
     * @param verticalDistance 垂直距离
     * @param gravity 重力加速度
     */
    export function calculateProjectileMotionRadian(S: number, H: number, V: number, g: number) {
        if (S <= 0) {
            err("初速度 S 必须大于0");
            return null;
        }
        if (g <= 0) {
            err("重力加速度 g 必须大于0");
            return null;
        }
        if (H === 0) {
            // 水平位移为0时，抛射角固定为90度（竖直方向）
            return [Math.PI / 2];
        }

        // 计算二次方程系数
        const a = (g * H * H) / (2 * S * S);
        const b = -H;
        const c = V + (g * H * H) / (2 * S * S);

        // 计算判别式
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            err("无实数解，给定条件下不存在符合条件的抛物线运动");
            return null;
        }

        // 计算根
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const u1 = (H + sqrtDiscriminant) / (2 * a);
        const u2 = (H - sqrtDiscriminant) / (2 * a);

        // 筛选有效解（tanθ > 0）
        // const validUs = [u1, u2].filter(u => u > 0);
        const validUs = [u1, u2];

        // 转换为抛射角（弧度）
        const angles = validUs.map(u => Math.atan(u));

        // 验证结果非空（理论上至少有一个解，因判别式已检查）
        if (angles.length === 0) {
            err("无有效抛射角解");
            return null;
        }

        return angles;
    }

    /**
     * 设置节点及子节点层级
     * @param node 
     * @param layer 
     */
    export function setLayer(node: Node, layer: number) {
        if (!node || node.layer == layer) return;
        node.layer = layer;
        for (let child of node.children) {
            setLayer(child, layer);
        }
    }

    let _viewSizeCache: { width: number, height: number };
    /**
     * 获取视口大小
     * @returns 视口大小
     */
    export function viewSize() {
        if (!_viewSizeCache) {
            _viewSizeCache = { width: view.getVisibleSize().width, height: view.getVisibleSize().height };
        }
        return _viewSizeCache;
    }

    /**
     * 是否竖屏
     * @returns 是否竖屏
     */
    export function isPortrait() {
        const { width, height } = viewSize();
        return height > width;
    }

    /**
     * 是否横屏
     * @returns 是否横屏
     */
    export function isLandscape() {
        return !isPortrait();
    }

    /**
     * 设备是否有安全区域
     * @returns 
     */
    export function hasSafeArea() {
        const rect = sys.getSafeAreaRect();
        const size = viewSize();
        return rect.height < size.height;
    }

    /**
     * 保存数据到文件
     * @param data 数据
     * @param fileName 文件名
     */
    export function saveDataToFile(data: any, fileName: string) {
        if (!sys.isBrowser && !EDITOR) return;
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * 填充0
     * @param num 数字
     * @param length 长度
     * @returns 填充0后的字符串
     */
    export function fill0(num: number, length: number) {
        let s = num.toString();
        while (s.length < length) {
            s = '0' + s;
        }
        return s;
    }
}
no.addToWindowForDebug('no', no);
