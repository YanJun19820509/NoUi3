import {
    AnimationClip, Asset, AudioClip, BufferAsset, Color, Component, DEBUG, EDITOR, EffectAsset, EventHandler, Font, JsonAsset, Material, Prefab, Quat,
    Rect, Scheduler, Size, SpriteAtlas, SpriteFrame, TextAsset, Texture2D, UIOpacity, UITransform, Vec2, Vec3, WECHAT, assetManager, ccclass, color,
    director, game, instantiate, isValid, js, macro, property, random, sys, tween, v2, v3, view, Node, Tween, EventTarget, ImageAsset, _AssetInfo, Button, Bundle, SkeletonData, NodeEventType, TTFFont, BlockInputEvents,
    Layers,
    CCObject
} from "./yj";


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

    export function setLogEnabled(v: boolean) {
        _isLogEnabled = v;
    }

    export function isDebug(): boolean {
        return _debug;
    }
    export function setDebug(v: boolean) {
        _debug = v;
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

    export function spineEnable(): boolean {
        return _isSpineEnable;
    }

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

    /**
     * 创建唯一标识
     * @returns 
     */
    let _uuidCount = 0;
    export function uuid(obj?: any): string {
        if (obj && obj['_uuid']) return obj['_uuid'];
        // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        //     var r = floor(random() * 16),
        //         v = c == 'x' ? r : (r & 0x3 | 0x8);
        //     return v.toString(16);
        // });
        return ++_uuidCount + '';
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
        if (target && target.uuid == undefined) target.uuid = uuid();
        const _uuid = target.uuid;
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
        if (target && target.uuid == undefined) target.uuid = uuid();
        const _uuid = target.uuid;
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
        if (target && target.uuid == undefined) target.uuid = uuid();
        let _uuid = target.uuid;

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
        if (target && target.uuid == undefined) target.uuid = uuid();
        const _uuid = target.uuid;

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
        const _uuid = target?.uuid || target;
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
        if (target.uuid == undefined) target.uuid = uuid();
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
        return a.uuid;
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
        return a.uuid;
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

    class Event {
        private _map: any;

        constructor() {
            this._map = {};
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
            let a: { h: Function, t: any, o: boolean }[] = this._map[type] || [];
            a[a.length] = {
                h: handler,
                t: target,
                o: false
            };
            this._map[type] = a;
        }
        public once(type: string, handler: Function, target?: any): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map[type] || [];
            a[a.length] = {
                h: handler,
                t: target,
                o: true
            };
            this._map[type] = a;
        }
        public off(type: string, handler: Function): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map[type];
            if (!a) return;
            for (let i = 0, n = a.length; i < n; i++) {
                let b = a[i];
                if (b.h == handler) {
                    a.splice(i, 1);
                    break;
                }
            }
            this._map[type] = a;
        }
        public targetOff(target: any): void {
            for (let type in this._map) {
                let a: { h: Function, t: any, o: boolean }[] = this._map[type];
                if (!a) continue;
                for (let i = a.length - 1; i >= 0; i--) {
                    let b = a[i];
                    if (b.t == target) {
                        a.splice(i, 1);
                    }
                }
                this._map[type] = a;
            }
        }
        public typeOff(type: string): void {
            delete this._map[type];
        }
        public emit(type: string, ...args: any[]): void {
            // log('no.evn emit', type, args);
            let a: { h: Function, t: any, o: boolean }[] = this._map[type];
            if (!a) return;
            args = args || [];
            args[args.length] = type;
            if (DEBUG) {
                for (let i = a.length - 1; i >= 0; i--) {
                    const b = a[i];
                    try {
                        b.h.apply(b.t, args);
                    } catch (e) { console.error(e); }
                }
            } else {
                for (let i = a.length - 1; i >= 0; i--) {
                    const b = a[i];
                    if (b.t && !checkValid(b.t)) {
                        b.o = true;
                    } else
                        b.h.apply(b.t, args);
                }
            }
            for (let i = a.length - 1; i >= 0; i--) {
                let b = a[i];
                if (b.o) {
                    a.splice(i, 1);
                }
            }
            this._map[type] = a;
        }

        public hasType(type: string): boolean {
            let a: any[] = this._map[type];
            return a && a.length > 0;
        }

        /**
         * 在监听回调中移除某个监听
         * @param type 
         * @param target 
         * @returns 
         */
        public offAfterTrigger(type: string, target?: any): void {
            let a: { h: Function, t: any, o: boolean }[] = this._map[type];
            if (!a) return;
            a.forEach(b => {
                if (target) {
                    if (b.t == target) b.o = true;
                } else b.o = true;
            });
        }

        public clear() {
            this._map = {};
        }
    }
    /**
    * 消息系统
    */
    export const evn = new Event();

    export class State {
        private _states: any;
        private _watchers: any;

        constructor() {
            this._states = {};
            this._watchers = {};
        }

        public set(type: string, value?: any): void {
            this._states[type] = { v: value, t: sys.now() };
        }

        public on(type: string, target: any) {
            if (!target.uuid) target.uuid = uuid();
            this._watchers[type] = this._watchers[type] || {};
            this._watchers[type][target.uuid] = sys.now();
        }


        public off(type: string, target: any) {
            if (!target.uuid) return;
            if (this._watchers[type])
                delete this._watchers[type][target.uuid];
        }

        public clear(type: string) {
            delete this._states[type];
            delete this._watchers[type];
        }

        public clearAll(): void {
            this._states = {};
            this._watchers = {};
        }

        public check(type: string, target: any): { state: boolean, value?: any } {
            let c = { state: false, value: null };
            let b: { v: any, t: number } = this._states[type];
            if (!b) return c;
            if (!target.uuid) target.uuid = uuid();
            let a = this._watchers[type];
            if (!a) {
                this._watchers[type] = {};
            } else if (a[target.uuid] == b.t) return c;
            this._watchers[type][target.uuid] = b.t;
            c.state = true;
            c.value = b.v;
            return c;
        }

        public async checkTrue(type: string, target: any): Promise<any> {
            if (!target?.isValid) return Promise.resolve(null);
            let a = this.check(type, target);
            if (a.state) return Promise.resolve(a.value);
            await sleep(0, target);
            return this.checkTrue(type, target);
        }

    }
    /**
    * 状态系统
    */
    export const state = new State();

    class st {
        private _time: number;
        private _targets: any[];
        private _num: number;
        private _IdKey = '__tickTockId';

        /**当前系统时间s */
        public get now(): number {
            return this._time;
        }

        public set now(v: number) {
            this._time = v;
        }

        /**
         * 当前设备时间戳ms
         */
        public get locationNow(): number {
            return Date.now();
        }

        /**
         * 当前时区时间戳s
         */
        public get locationTimeZoneNow(): number {
            return no.localDateSeconds(this._time);
        }

        constructor() {
            let t = floor(sys.now() / 1000);
            this._time = t;
            this._targets = [];
            this._num = 1;
            setInterval(() => {
                this._time++;
                this.cb();
            }, 1000);
        }

        /**
         * 注册每秒回调目标
         * @param target 目标，可为任意类的实例，但需要实现方法doTickTock(now: number){}
         */
        public onTickTock(target: any): void {
            if (target == null) return;
            if (!target[this._IdKey])
                target[this._IdKey] = this._num++;
            addToArray(this._targets, target, this._IdKey);
        }

        public offTickTock(target: any): void {
            removeFromArray(this._targets, target, this._IdKey);
        }

        private cb() {
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

        public static new(target: Node, comp: string, handler: string): EventHandlerInfo {
            let a = new EventHandlerInfo();
            a.handler.target = target;
            a.handler.component = comp;
            a.handler.handler = handler;
            return a;
        }

        public static newInEditor(target: Node, compId: string, handler: string): EventHandlerInfo {
            let a = new EventHandlerInfo();
            a.handler.target = target;
            a.handler._componentId = compId;
            a.handler.handler = handler;
            return a;
        }

        public static execute(handlers: EventHandlerInfo[], ...args: any[]): void {
            if (!handlers || handlers.length == 0) return;
            handlers.forEach(handler => {
                handler?.execute.apply(handler, args);
            });
        }

        public execute(...args: any[]): void {
            if (isValid(this.handler?.target, true))
                this.handler.emit(args);
        }
    }

    export function log(...Evns: any[]): void {
        _isLogEnabled && console.log.call(console, '#NoUi#Log', jsonStringify(Evns));
    }

    export function warn(...Evns: any[]): void {
        console.warn('#NoUi#Warn', Evns);
    }

    export function err(...Evns: any[]): void {
        console.error('#NoUi#这不是报错', Evns);
    }

    export function logTimeStart(type?: string) {
        console.time(`#NoUi#time-${type ? type : ''}`);
    }

    export function logTimeEnd(type?: string) {
        console.timeEnd(`#NoUi#time-${type ? type : ''}`);
    }

    /**
     * 发出消息并回调一次
     * @param type
     * @param callback
     * @param args
     * @param target
     */
    export function emitAndOnceCallback(emitType: string, callbackType: string, callback: (v: any) => void, args?: any[], target?: any): void {
        if (!evn.hasType(emitType)) {
            callback(null);
        } else {
            evn.once(callbackType, callback, target);
            evn.emit(emitType, args);
        }
    }

    export function emitAndOnceCallbackAsync(emitType: string, callbackType: string, args?: any[], target?: any): Promise<any> {
        return new Promise<any>(resolve => {
            emitAndOnceCallback(emitType, callbackType, resolve, args, target);
        });
    }

    /**
     * 等待事件
     * @param type 事件类型
     * @param target
     * @param arg 标识，当事件触发时会将这个值返回
     */
    export function waitForEvent(type: string, target?: any, arg?: any): Promise<any> {
        return new Promise<any>(resolve => {
            evn.once(type, (v: any) => {
                if (v == '__clear_Wait_For_Event__') resolve(null);
                else resolve(arg);
            }, target);
        });
    }

    /**
     * 等待方法成立
     * @param express 
     * @returns 
     */
    export function waitFor(express: (dt?: number) => boolean, comp?: Component): Promise<void> {
        if (comp)
            return new Promise<void>(resolve => {
                scheduleUpdateCheck(express, resolve, comp);
            });
        else
            return checkUntil(express);
    }

    /**
     * 等待有返回值的事件
     * @param type 
     * @param target 
     * @returns 
     */
    export function waiForEventValue(type: string, target?: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            evn.once(type, (v: any) => {
                if (v == '__clear_Wait_For_Event__') reject(null);
                else resolve(v);
            }, target);
        });
    }

    /**
     * 等待事件返回值与预期值相等
     * @param type 
     * @param equalValue 预期值
     * @param target 
     * @returns 
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
        });
    }

    /**
     * 取消
     * @param type 
     */
    export function clearWaitForEvent(type: string) {
        evn.emit(type, '__clear_Wait_For_Event__');
        evn.typeOff(type);
    }

    export async function checkUntil(express: () => boolean) {
        return new Promise<void>(resolve => {
            const a = setIntervalF(() => {
                if (express()) {
                    clearIntervalF(a);
                    resolve();
                }
            });
        });
    }

    /**
     * 根据模板格式化字符串
     * @param formatter 模板，如'{a}:{b}:{c}' {0}:{1}:{2}
     * @param data 需要替换的数据，如{'a':1,'b':2,'c':3}，返回1:2:3  [1,2,3] 1:2:3
     */
    export function formatString(formatter: string, data: any[] | object): string {
        if (data == null) return '';
        var s = String(formatter);
        let keys = Object.keys(data);
        keys.forEach(k => {
            s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), data[k]);
        });
        return s;
    }

    export function evalFormateStr(formatter: string, data: any) {
        let str = formatString(formatter, data);
        return eval(str);
    }

    /**
     * JSON对象深拷贝
     * @param json
     */
    export function cloneJson(json: any): any {
        return parse2Json(jsonStringify(json));
    }


    /**
     *
     * @param hex '#412a00'
     * @returns {r: 65, g: 42, b: 0}
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
     * 封装cc.Color.fromHEX
     * @param v
     */
    export function str2Color(v: string): Color {
        let c = color();
        Color.fromHEX(c, v);
        return c;
    }

    /**
     * 大数字转换成最多3位数加单位的格式
     * @param n
     */
    export function num2str(n: number): string {
        if (n == null) return '';
        if (n < 1000) return String(n);
        let unit = ['K', 'M', 'B'];
        var a = '';
        let s = String(n);
        let len = s.length;
        let l = len % 3;
        if (l == 1) {
            a = s[0] + '.' + s[1];
        } else {
            a = s[0] + s[1] + (l == 0 ? s[2] : '');
        }
        return a + unit[floor(len / 3) - 1 - (l == 0 ? 1 : 0)];
    }

    /**
     * 从数组里随机n个元素
     * @param arr
     * @param n
     * @param repeatable 随机的元素能否重复
     */
    export function arrayRandom(arr: any, n = 1, repeatable = false): any {
        if (!arr || arr.length == 0) return null;
        if (arr.length == 1) return arr[0];
        let a = [].concat(arr);
        let c = [];
        for (var i = 0; i < n; i++) {
            let al = a.length;
            if (al == 0) break;
            let b = floor(random() * al);
            if (!repeatable)
                c = [].concat(c, a.splice(b, 1));
            else
                c = [].concat(c, a[b]);
        }
        return n == 1 ? c[0] : c;
    }

    /**
     * 从object中获取值
     * @param data
     * @param path 如a.b.c
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
     *
     * @param data Object
     * @param path ['a','b','c']
     * @param def any 默认值
     */
    export function getValuePath(data: Object, path: any[], def?: any): void {
        let k = path.join('.');
        return getValue(data, k) || def
    }

    /**
     * 向object中写入值
     * @param data
     * @param path 如a.b.c
     * @param value
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
                o = o[k];
            } else {
                o[k] = value;
            }
        }
    }

    /**
     *
     * @param data Object
     * @param path ['a','b','c']
     * @param value any
     */
    export function setValuePath(data: Object, path: any[], value: any): void {
        let k = path.join('.');
        setValue(data, k, value)
    }

    /**
     * 删除object中的值
     * @param data
     * @param path 如a.b.c
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
     * 连接多个字符串
     * @param separator
     * @param strs
     */
    export function joinStrings(separator: string, ...strs: string[]): string {
        let a: string[] = [];
        strs.forEach(str => {
            if (str != null && str != '') {
                a[a.length] = str;
            }
        });
        return a.join(separator);
    }
    /**
     * 连接多个字符串，默认连接符[.]
     * @param strs
     */
    export function join(...strs: string[]): string {
        return joinStrings('.', ...strs);
    }

    /**
     * 将一维数组转成2维数组
     * @param array 原数组
     * @param num 子数组最大长度
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
     *
     * @param array
     * @param item
     * @param key
     */
    export function indexOfArray(array: any[], item: any, key: string): number {
        if (array == null || item == null) return -1;
        let len = array.length;
        for (let i = 0; i < len; i++) {
            if (array[i][key] == item || (array[i][key] == item[key] && item[key] != undefined)) {
                return i;
            }
        }
        return -1;
    }

    export function itemOfArray<T>(array: any[], value: any, key: string): T {
        let i = indexOfArray(array, value, key);
        if (i == -1) return null;
        return array[i];
    }


    export function isArrayIncludeOther(array: any[], other: any[]): boolean {
        for (let i = 0, n = other.length; i < n; i++) {
            if (array.indexOf(other[i]) > -1) return true;
        }
        return false;
    }

    export function arrayIncludeOther(array: any[], other: any[]): any[] {
        let arr: any[] = [];
        for (let i = 0, n = other.length; i < n; i++) {
            if (array.indexOf(other[i]) > -1) arr[arr.length] = other[i];
        }
        return arr;
    }

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
     * 在数据后插入新数据
     * @param array
     * @param value
     */
    export function pushToArray(array: any[], value: any): void {
        if (!array) return;
        if (value == null) return;
        array[array.length] = value;
    }

    export function removeFromArray(array: any[], value: any, key?: string): void {
        let i = -1;
        if (key == null) {
            i = array.indexOf(value);
        } else {
            i = indexOfArray(array, value, key);
        }
        if (i > -1) array.splice(i, 1);
    }

    /**
     * 获得map中key的数组
     * @param map
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
     * 获得map中value的数组
     * @param map
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
     * 将数组转成kv结构
     * @param array 
     * @param keyType 
     * @returns 
     */
    export function arrayToKV(array: any[], keyType: string): any {
        let b: any = {};
        array.forEach(a => {
            b[a[keyType]] = a;
        });
        return b;
    }

    /**
     * 遍历kv对象
     * @param d kv对象
     * @param func return true时终止遍历
     */
    export function forEachKV(d: any, func: (k: any, v: any) => boolean) {
        if (d == null) return;
        for (const key in d) {
            if (func(key, d[key]) === true) break;
        }
    }

    /**
     * 以v1为圆心从水平正x方向到v2的夹角
     * @param p1
     * @param p2
     * @returns angle角度,radian弧度
     */
    export function angleTo(p1: Vec2 | Vec3, p2: Vec2 | Vec3): { angle: number, radian: number } {
        let a = v2(p2.x - p1.x, p2.y - p1.y);
        let b = a.signAngle(v2(1, 0));
        return {
            'angle': (360 - b / Math.PI * 180) % 360,
            'radian': -b
        };
    }

    /**
     * 执行EventHandler
     * @param handlers
     */
    export function executeHandlers(handlers: EventHandler[], ...args: any[]): void {
        handlers.forEach(handler => {
            handler.emit([].concat(args, handler.customEventData));
        });
    }

    /**
     * Vec3转Vec2
     * @param v3
     */
    export function vec3ToVec2(v3: Vec3): Vec2 {
        return new Vec2(v3.x, v3.y);
    }

    /**
     * Vec2转Vec3
     * @param v2
     */
    export function vec2ToVec3(v2: Vec2): Vec3 {
        return new Vec3(v2.x, v2.y);
    }

    /**
     * 创建一个EventHandler
     * @param target
     * @param component
     * @param handler
     * @param arg
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

    /**克隆 */
    export function clone(d: any): any {
        if (d instanceof Array) {
            let a: any[] = [];
            d.forEach(b => {
                a.push(clone(b));
            });
            return a;
        } else if (d instanceof Object) return instantiate(d);
        return d;
    }

    /**
     * 等待几秒
     * @param duration 等待时长(秒)
     * @param component
     * @returns
     */
    export function sleep(duration: number, component?: Component): Promise<void> {
        if (duration <= 0) duration = game.deltaTime;
        return new Promise<void>(resolve => {
            // if (checkValid(component)) {
            //     component.scheduleOnce(resolve, duration);
            // } else {
            scheduleOnce(() => { resolve(); }, duration);
            // }
        });
    }

    // 两个数相除百分比
    export function twoNumPercentage2Num(min, max, maxNum) {
        if (min > max) {
            min = max;
        }
        return floor(min / max * maxNum);
    }

    /**
     * 取两值之间的随机值
     * @param min
     * @param max 
     * @param isInt 是否取整，默认true
     */
    export function randomBetween(min: number, max: number, isInt = true): number {
        if (min == max) return min;
        if (min == null || max == null) return min || max;
        const a = random() * (max - min + 1);
        return (isInt ? floor(a) : a) + min;
    }

    /**
     * 将UTC时区时间戳转化为本地系统所在时区时间戳
     */
    export function localDateSeconds(utcSeconds: number): number {
        const t = new Date(utcSeconds * 1000);
        t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
        return Math.floor(t.getTime() * .001);
    }

    /**
     * 将秒数解析为日时分秒
     * @param v 总秒数
     */
    export function parseSeconds(v: number): { d: number, h: number, M: number, s: number } {
        let d = floor(v / 86400);
        let h = floor(v / 3600) % 24;
        let M = floor((v % 3600) / 60);
        let s = v % 60;
        return { d: d, h: h, M: M, s: s };
    }

    /**
     * 将时间戳解析为年月日时分秒
     * @param v 时间戳总秒数
     */
    export function parseTimestamp(v: number): { y: number, m: number, d: number, h: number, M: number, s: number } {
        let t = new Date(v * 1000);
        let y: any = t.getFullYear();
        let m: any = t.getMonth() + 1;
        let d: any = t.getDate();
        let h: any = t.getHours();
        let M: any = t.getMinutes();
        let s: any = t.getSeconds();
        return { y: y, m: m, d: d, h: h, M: M, s: s };
    }

    /**当前时间戳（秒） */
    export function timestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        return floor(a.getTime() / 1000) + v;
    }

    /**当前时间戳（毫秒） */
    export function timestampMs(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        return a.getTime() + v;
    }

    /**当前零点时间戳（秒） */
    export function zeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        return floor(a.getTime() / 1000) + v;
    }

    /**本周一 零点时间戳（秒）*/
    export function mondayZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(a.getDate() - (a.getDay() || 7) + 1);
        return floor(a.getTime() / 1000) + v;
    }

    /**下周一 零点时间戳（秒）*/
    export function nextMondayZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(a.getDate() - (a.getDay() || 7) + 8);
        return floor(a.getTime() / 1000) + v;
    }

    /**本月1号 零点时间戳（秒）*/
    export function date1ZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(1);
        return floor(a.getTime() / 1000) + v;
    }

    /**下月1号 零点时间戳（秒）*/
    export function nextMonthDate1ZeroTimestamp(v = 0): number {
        let a = new Date(sysTime.now * 1000);
        a.setHours(0, 0, 0, 0);
        a.setDate(1);
        a.setMonth(a.getMonth() + 1);
        return floor(a.getTime() / 1000) + v;
    }


    /**转换为当前零点时间戳（秒） */
    export function toZeroTimestamp(v: number): number {
        let a = new Date(v * 1000);
        a.setHours(0, 0, 0, 0);
        return floor(a.getTime() / 1000);
    }

    /**
     * 将时间长度转成时分秒
     * @param time 时间长度，秒
     * @returns x小时x分x秒
     */
    export function time2LocalFormat(time: number): string {
        let h: number, m: number, s: number;
        h = floor(time / 3600);
        m = floor((time % 3600) / 60);
        s = time % 60;
        return `${h}${m}${s}`;
    }

    /**
     * 将时间长度转成时分秒
     * @param time 时间长度，秒
     * @returns x小时x分x秒
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
     * 秒转时间 10:01:01
     * @param sec 秒
     */
    export function sec2time(sec: number, formatter?: string, show0 = true) {
        formatter = formatter || '{h}:{m}:{s}';
        // 负数不处理
        if (sec <= 0) {
            let a = show0 ? '00' : '0';
            return formatString(formatter, { h: a, m: a, s: a });
        }
        let d = floor(sec / 86400);
        let h = floor(sec / 3600) % 24;
        if (d > 0) {
            // todo i18n
            formatter = `{d}{h}`;
            return formatString(formatter, { h: h, d: d });
        }

        let m: any = floor(sec / 60 % 60);
        let s: any = floor(sec % 60);

        // if (h<=9){h = `0${h}`}
        if (m <= 9 && show0) { m = `0${m}` }
        if (s <= 9 && show0) { s = `0${s}` }

        return formatString(formatter, { h: h, m: m, s: s });
    }

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

    export function formatTime_yymmddhhMMss(sec: number, show0 = true): string {
        return _formatTime(sec, '{y}.{m}.{d} {h}:{M}:{s}', show0);
    }

    export function formatTime_yymmdd(sec: number, show0 = true): string {
        return _formatTime(sec, '{y}.{m}.{d}', show0);
    }

    export function formatTime_hhMMss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}:{M}:{s}', show0);
    }

    export function formatTime_hhMM(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}:{M}', show0);
    }

    export function formatTime_hh(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{h}', show0);
    }

    export function formatTime_MMss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{M}:{s}', show0);
    }

    export function formatTime_ss(sec: number, show0 = true): string {
        return _formatSeconds(sec, '{s}', show0);
    }

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
     * 节点的世界坐标
     * @param node
     */
    export function nodeWorldPosition(node: Node, out?: Vec3): Vec3 {
        if (!checkValid(node)) return;
        out = out || v3();
        node.parent.getComponent(UITransform).convertToWorldSpaceAR(node.position, out);
        return out;
    }

    /**
     * 世界坐标转节点内坐标
     * @param node
     */
    export function worldPositionInNode(pos: Vec3, node: Node, out?: Vec3): Vec3 {
        if (!checkValid(node)) return;
        out = out || v3();
        node.getComponent(UITransform).convertToNodeSpaceAR(pos, out);
        return out;
    }

    /**
     * 某节点坐标转换到另一个节点内
     * @param node
     * @param otherNode
     */
    export function nodePositionInOtherNode(node: Node, otherNode: Node, out?: Vec3): Vec3 {
        out = out || v3();
        nodeWorldPosition(node, out);
        otherNode.getComponent(UITransform).convertToNodeSpaceAR(out, out);
        return out;
    }

    /**
     * 数组排序
     * @param arr
     * @param handler 排序方法,为空则按数字大小排序
     * @param desc 是否降序
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
     * 插入排序算法,相对有序的数据性能更高
     * @param arr 
     * @param handler 排序方法,为空则按数字大小排序
     * @param desc 是否降序
     * @returns 
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
     * 节点在world中的rect
     * @param node
     */
    export function nodeBoundingBox(node: Node, offset?: Vec2, subSize?: Size): Rect {
        offset = offset || v2();
        subSize = subSize || Size.ZERO;
        let origin = v3();
        origin = nodeWorldPosition(node, origin);
        let anchor = node.getComponent(UITransform).anchorPoint;
        let size = node.getComponent(UITransform).contentSize;
        let rect = new Rect();
        rect.height = size.height + subSize.height;
        rect.width = size.width + subSize.width;
        rect.center = v2(origin.x + (0.5 - anchor.x) * size.width + offset.x, origin.y + (0.5 - anchor.y) * size.height + offset.y);
        return rect;
    }

    /**
     * 判断点是否在节点范围内
     * @param node
     */
    export function nodeContainsPoint(node: Node, point: Vec2, offset?: Vec2, subSize?: Size): boolean {
        let rect = nodeBoundingBox(node, offset, subSize);
        return rect.contains(point);
    }

    /**
     * 判断两个节点是否相交
     * @param node
     * @param otherNode
     * @returns
     */
    export function nodeIntersects(node: Node, otherNode: Node): boolean {
        let rect = nodeBoundingBox(node),
            rect1 = nodeBoundingBox(otherNode);
        return rect.intersects(rect1);
    }

    /**
     * 对象转数组
     * @param obj
     * @param keyName
     * @param valueName
     * @returns
     */
    export function object2Array(obj: any, keyName: string, valueName: string): any[] {
        if (obj == null || keyName == null || valueName == null) return null;
        let arr = new Array();
        let keys = Object.keys(obj);
        keys.forEach(key => {
            arr[arr.length] = {
                [keyName]: key,
                [valueName]: obj[key]
            };
        });
        return arr;
    }

    /**
     * 对象转数组
     * @param obj
     * @returns
     */
    export function object2List(obj: any): any[] {
        if (obj == null) return [];
        let arr = new Array();
        let keys = Object.keys(obj);
        keys.forEach(key => {
            arr[arr.length] = obj[key];
        });
        return arr;
    }

    /**
     * 根据权重随机
     * @param weight 权重数组
     * @returns 权重索引
     */
    export function weightRandom(weight: number[], except?: number[]): number {
        if (!weight) return 0;
        let sum = 0;
        except = except || [];
        weight.forEach((w, i) => {
            if (except.indexOf(i) == -1)
                sum += Number(w);
        });
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
     * 根据权重随机
     * @param weight 权重数组
     * @param key 权重值对应key
     * @returns 权重索引
     */
    export function weightRandomObject(weight: any[], key: string): number {
        if (!weight) return 0;
        let a: number[] = [];
        weight.forEach(item => {
            a[a.length] = Number(item[key]);
        });
        return weightRandom(a);
    }

    /**
     * 浮点数取整数位，不能用于超大数据
     * @param v 
     * @returns 
     */
    export function floor(v: number): number {
        if (v < 1 && v >= 0) return 0;
        let a = v | 0;
        if (a == 0 || (v > 0 && a < 0) || (v < 0 && a > 0)) return Math.floor(v);
        return a;
    }
    /**
     * 浮点数取小数位
     * @param v 
     * @returns 
     */
    export function fract(v: number): number {
        let s = String(v).split('.');
        s[0] = '0';
        return Number(s.join('.'));
    }
    /**
     * 浮点数取整数位并+1，不能用于超大数据
     * @param v 
     * @returns 
     */
    export function ceil(v: number): number {
        let a = floor(v);
        if (a < 0 || a >= v) return a;
        return a + 1;
    }

    /**
     * 循环比较，v < min时返回max，v > max时返回min，否则返回v
     * @param v 
     * @param min 
     * @param max 
     */
    export function cyclic(v: number, min: number, max: number): number {
        if (v < min) return max;
        if (v > max) return min;
        return v;
    }

    /**
     * 当v<min,返回min；当v>max，返回max；否则返回v
     * @param v 
     * @param min 
     * @param max 
     */
    export function clamp(v: number, min: number, max: number): number {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    function eIndex(n: number): number {
        let s = n.toString().toLowerCase();
        let a = s.split('e');
        if (!a[1]) return 0;
        return Number(a[1]);
    }

    function decimalDigits(n: number): number {
        let a = n.toString().toLowerCase().split('e')[0].split('.');
        return (!!a[1] ? a[1].length : 0) - eIndex(n);
    }

    /**加 */
    export function add(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            m: number = Math.pow(10, Math.max(r1, r2));
        return (n1 * m + n2 * m) / m;
    }
    /**减 */
    export function minus(n1: number, n2: number): number {
        let r1: number = decimalDigits(n1),
            r2: number = decimalDigits(n2),
            n: number = Math.max(r1, r2),
            m: number = Math.pow(10, n);
        return Number(((n1 * m - n2 * m) / m).toFixed(n));
    }
    /**乘 */
    export function mutiply(n1: number, n2: number): number {
        let m: number = decimalDigits(n1) + decimalDigits(n2),
            s1 = n1.toString().toLowerCase().split('e')[0].replace('.', ''),
            s2 = n2.toString().toLowerCase().split('e')[0].replace('.', '');
        return Number(s1) * Number(s2) / Math.pow(10, m);
    }
    /**除 */
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
        constructor(node: Node) {
            this.init(node);
        }

        private init(node: Node) {
            this.map = {};
            this.map[TweenSetType.Node] = tween(node);
            this.map[TweenSetType.Transform] = node.getComponent(UITransform) ? tween(node.getComponent(UITransform)) : null;
            this.map[TweenSetType.Opacity] = node.getComponent(UIOpacity) ? tween(node.getComponent(UIOpacity)) : null;
        }

        public start(): Promise<void> {
            return new Promise<void>(resolve => {
                for (const key in this.map) {
                    let t: Tween = this.map[key];
                    if (key == TweenSetType.Node) {
                        t.call(resolve).start();
                    } else
                        t?.start();
                }
            });
        }

        public stop() {
            for (const key in this.map) {
                let t: Tween = this.map[key];
                t?.stop();
            }
        }

        public setTweenData(data: any) {

            this.setDelay(data.delay);

            if (data.props != null) {
                let np: any, tp: any, op: any;
                for (let k in data.props) {
                    let v = data.props[k];
                    switch (k) {
                        case 'pos':
                            np = np || {};
                            np['position'] = new Vec3(v[0], v[1], v[2]);
                            break;
                        case 'rotation':
                            np = np || {};
                            np['rotation'] = new Quat(v[0], v[1], v[2]);
                            break;
                        case 'scale':
                            np = np || {};
                            np['scale'] = new Vec3(v[0] == undefined ? v : v[0], v[1] == undefined ? (v[0] == undefined ? v : v[0]) : v[1], v[2] == undefined ? 1 : v[2]);
                            break;
                        case 'angle':
                            np = np || {};
                            np['angle'] = v;
                            break;
                        case 'size':
                            tp = tp || {};
                            tp['contentSize'] = new Size(v[0], v[1]);
                            break;
                        case 'anchor':
                            tp = tp || {};
                            tp['anchorPoint'] = new Vec2(v[0], v[1]);
                            break;
                        case 'opacity':
                            op = op || {};
                            op['opacity'] = v;
                            break;
                    }
                }

                if (!np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].delay(data.duration || 0);
                if (!tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.delay(data.duration || 0);
                if (!op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.delay(data.duration || 0);

                const easing = data.easing;

                if (data.by) {
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].by(data.duration, np, { easing: easing });
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.by(data.duration, tp, { easing: easing });
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.by(data.duration, op, { easing: easing });
                } else if (data.to) {
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].to(data.duration, np, { easing: easing });
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.to(data.duration, tp, { easing: easing });
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.to(data.duration, op, { easing: easing });
                } else if (data.set) {
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].set(np);
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.set(tp);
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.set(op);
                }

                this.setCallback(data.callback, np ? TweenSetType.Node : (tp ? TweenSetType.Transform : TweenSetType.Opacity));
            }

            this.setRepeat(data.repeat);
        }

        private setDelay(v: number) {
            if (!v) return;
            for (const key in this.map) {
                this.map[key] = this.map[key]?.delay(v);
            }
        }

        private setRepeat(v: number) {
            if (!v) return;
            if (v < 0) v = 9999;
            for (const key in this.map) {
                this.map[key] = this.map[key]?.repeat(v, this.map[key]);
            }
        }

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

        public play(endCall?: () => void) {
            this.start().then(endCall).catch(e => { err(e); });
        }

        /**
         * 播放缓动动画
         * @param tweenSets 如果tweenSets是Array，则按并行处理
         * @param endCall 执行完回调
         * @param target 并行时用于处理目标销毁的情况
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

        public static stop(target: any) {
            Tween.stopAllByTarget(target);
        }
    }

    /**
     * 解析缓动动效数据
     * @param data
     * @param node
     * @returns TweenSet[]
     * @example  data = {
     *      delay?: 1,
     *      duration?: 1,
     *      to?:1,
     *      by?:1,
     *      set?:1,
     *      props?: {
     *          pos: [100,100,0]
     *          opacity: 100,
     *          rotation: [1,1,0],
     *          scale: [0.5,0.5,1],
     *          size: [100,100],
     *          anchor: [0, 1]
     *      },
     *      easing?: EasingMethod | "linear" | "smooth" | "fade" | "constant" | "quadIn" | "quadOut" | "quadInOut" | "quadOutIn" | "cubicIn" | "cubicOut" | "cubicInOut" | "cubicOutIn" | "quartIn" | "quartOut" | "quartInOut" | "quartOutIn" | "quintIn" | "quintOut" | "quintInOut" | "quintOutIn" | "sineIn" | "sineOut" | "sineInOut" | "sineOutIn" | "expoIn" | "expoOut" | "expoInOut" | "expoOutIn" | "circIn" | "circOut" | "circInOut" | "circOutIn" | "elasticIn" | "elasticOut" | "elasticInOut" | "elasticOutIn" | "backIn" | "backOut" | "backInOut" | "backOutIn" | "bounceIn" | "bounceOut" | "bounceInOut" | "bounceOutIn",
     *      repeat?: 0,//-1是无限次，>-1为执行次数为 repeat+1
     *      callback?: () => void | {type: string, args?:any[]}
     * }
     * @如果data为一维数组，则为串行动作；如果为多维数组，则数组间为并行动作，数组内为串行。
     * 默认属性变化为to
     */
    export function parseTweenData(data: any, node: Node): TweenSet | TweenSet[] {
        if (!data || !node) return null;

        if (data instanceof Array && data[0] instanceof Array) {//并行
            let a: TweenSet[] = [];
            data.forEach(td => {
                a = a.concat(parseTweenData(td, node))
            });
            return a;
        } else {
            let _tween = new TweenSet(node);
            data = [].concat(data);
            for (let i = 0, n = data.length; i < n; i++) {
                _tween.setTweenData(data[i]);
            }
            return _tween;
        }
    }

    /**
     * 解析url传参
     * @returns kv对象
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

    /**
     * 获取或设置节点x坐标
     * @param node 节点
     * @param x x坐标，为空时则返回当前x；否则修改当前x
     * @returns
     */
    export function x(node: Node, x?: number): number {
        if (!node) return;
        let p = node.getPosition();
        if (x != undefined) {
            p.x = x;
            node.setPosition(p);
        }
        return p.x;
    }

    /**
     * 获取或设置节点y坐标
     * @param node 节点
     * @param y y坐标，为空时则返回当前y；否则修改当前y
     * @returns
     */
    export function y(node: Node, y?: number): number {
        if (!node) return;
        let p = node.getPosition();
        if (y != undefined) {
            p.y = y;
            node.setPosition(p);
        }
        return p.y;
    }

    /**
     * 获取或设置节点z坐标
     * @param node 节点
     * @param z z坐标，为空时则返回当前z；否则修改当前z
     * @returns
     */
    export function z(node: Node, z?: number): number {
        if (!node) return;
        let p = node.getPosition();
        if (z != undefined) {
            p.z = z;
            node.setPosition(p);
        }
        return p.z;
    }
    /**
     * 获取或设置节点siblingIndex
     * @param node 节点
     * @param index siblingIndex，为空时则返回当前siblingIndex；否则修改当前siblingIndex
     * @returns
     */
    export function siblingIndex(node: Node, index?: number): number {
        if (!node) return;
        let p = node.getSiblingIndex();
        if (index != undefined && p != index) {
            p = index;
            node.setSiblingIndex(p);
        }
        return p;
    }

    /**
     * 获取或设置节点position
     * @param node 节点
     * @param pos 为空时则返回当前pos；否则修改当前pos
     * @returns
     */
    export function position(node: Node, pos?: Vec3): Vec3 {
        if (!node) return;
        if (pos != undefined) {
            node.setPosition(pos);
        }
        return node.getPosition().clone();
    }

    /**
     * 获取或设置节点rotation
     * @param node 节点
     * @param z 为空时则返回当前rotation；否则修改当前rotation
     * @returns
     */
    export function rotation(node: Node, r?: Vec3): Vec3 {
        if (!node) return;
        if (r != undefined) {
            node.setRotationFromEuler(r);
        }
        return node.eulerAngles.clone();
    }

    /**
     * 获取或设置节点宽
     * @param node 节点
     * @param width 为空时则返回当前宽；否则修改当前宽
     * @returns
     */
    export function width(node: Node, width?: number): number {
        if (!node || !node.getComponent(UITransform)) return;
        if (width != undefined)
            node.getComponent(UITransform).width = width;
        return node.getComponent(UITransform).width;
    }

    /**
     * 获取或设置节点高
     * @param node 节点
     * @param height 为空时则返回当前高；否则修改当前高
     * @returns
     */
    export function height(node: Node, height?: number): number {
        if (!node || !node.getComponent(UITransform)) return;
        if (height != undefined)
            node.getComponent(UITransform).height = height;
        return node.getComponent(UITransform).height;
    }

    /**
     * 获取或设置节点size
     * @param node 节点
     * @param size 为空时则返回当前size；否则修改当前size
     * @returns
     */
    export function size(node: Node, size?: Size): Size {
        if (!node || !node.getComponent(UITransform)) return;
        if (size != undefined)
            node.getComponent(UITransform).contentSize = size;
        return node.getComponent(UITransform).contentSize.clone();
    }

    /**
     * 获取或设置节点透明度
     * @param node 节点
     * @param opacity 为空时则返回当前opacity；否则修改当前opacity
     * @returns
     */
    export function opacity(node: Node, opacity?: number): number {
        if (!node) return;
        let op = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        if (opacity != undefined) op.opacity = opacity;
        return op.opacity;
    }

    /**
     * 获取或设置节点anchorX
     * @param node 节点
     * @param x 为空时则返回当前anchorX；否则修改当前anchorX
     * @returns
     */
    export function anchorX(node: Node, x?: number): number {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (x != undefined) t.anchorX = x;
        return t.anchorX;
    }

    /**
     * 获取或设置节点anchorY
     * @param node 节点
     * @param y 为空时则返回当前anchorY；否则修改当前anchorY
     * @returns
     */
    export function anchorY(node: Node, y?: number): number {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (y != undefined) t.anchorY = y;
        return t.anchorY;
    }

    /**
     * 获取或设置节点anchorPoint
     * @param node 节点
     * @param 
     * @returns
     */
    export function anchor(node: Node, ...args: number[]): Vec2 {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (args != undefined && args.length > 0) t.setAnchorPoint(args[0], args[1] == null ? args[0] : args[1]);
        return t.anchorPoint.clone();
    }

    /**
     * 获取或设置节点scale
     * @param node 节点
     * @param scale 为空时则返回当前scale；否则修改当前scale
     * @returns
     */
    export function scale(node: Node, scale?: Vec3): Vec3 {
        if (!node) return;
        if (scale != undefined)
            node.scale = scale;
        return node.scale.clone();
    }

    /**
     * 获取节点在世界坐标系中的包围盒rect,包含自身和已激活的子节点的世界边框
     * @param node 
     */
    export function boundingBox(node: Node): Rect {
        return node.getComponent(UITransform).getBoundingBoxToWorld();
    }

    /**
     * 解析带function的json字符串
     * @param s 
     * @returns 
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
     * 序列化带function的json对象
     * @param json 
     * @returns 
     */
    export function jsonStringify(json: any): string {
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
     * 阶乘
     * @param n 阶
     */
    export function factorial(n: number): number {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }

    /**
     * 组合
     * @param n n>=0
     * @param i i<=n
     */
    export function combination(n: number, i: number): number {
        let _1 = factorial(n),
            _2 = factorial(i),
            _3 = factorial(n - i);
        return _1 / _2 / _3;
    }

    /**
     * 检查数据是否需要重置
     * @param dataKey 数据key
     * @param value 重置后的数据值
     * @param time 重置时长(s)
     * @param isInterval 是否间隔时间。如果是，则从当前时间开始计算重置时间；如果否，则从当天0点开始计算。默认false
     */
    export function resetValueCheck(dataKey: string, value: any, time: number, isInterval = false) {
        let now = sysTime.now;
        try {
            let lastResetTime = parse2Json(dataCache.getLocal('reset_data_check_time') || '{}');
            let lt = lastResetTime[dataKey];

            if (!lt || now >= lt) {
                dataCache.setLocal(dataKey, value);
                lastResetTime[dataKey] = (isInterval ? now : zeroTimestamp()) + time;
                dataCache.setLocal('reset_data_check_time', jsonStringify(lastResetTime));
            }
        } catch (e) {
            no.err('JSON.parse', 'resetValueCheck');
        }
    }

    /**
     * 数字精度转换
     * @param v 数字
     * @param x 保留小数位数
     * @returns 
     */
    export function float(v: number, x = 12): number {
        let a = Math.pow(10, 12),
            b = Math.pow(10, 12 - x),
            c = Math.pow(10, x);
        return Math.floor(Math.ceil(v * a) / b) / c;
    }

    /**
     * 从父节点获取某个组件实例
     * @param self 
     * @param comp 
     * @returns 
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
     * 从父节点获取某个子节点
     * @param self 
     * @param nodeName 节点名
     * @returns 
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
     * 递归查找某个子节点
     * @param self 
     * @param comp 
     * @returns 
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

    /**基础数据类 */
    export class Data extends Event {
        public static DataChangeEvent = 'data_change_event';

        private _data: any;

        public get data(): any {
            return this._data;
        }

        public set data(v: any) {
            this._data = v;
            this.emit(Data.DataChangeEvent, this);
        }

        /**转成json string */
        public get json(): string {
            if (this._data == null) this._data = {};
            let a = clone(this._data);
            a.__ut = sysTime.now;
            return jsonStringify(a);
        }

        /**将json string转成data */
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
         * 读
         * @param path
         */
        public get(paths?: string | string[]): any {
            if (this._data == null) return null;
            if (paths == null || paths == '*') return clone(this._data);
            paths = [].concat(paths);
            if (paths.length == 1) {
                return clone(getValue(this._data, paths[0]));
            } else {
                let p = paths.join('.');
                let a = getValue(this._data, p);
                if (!a) return null;
                return clone(a);
            }
        }
        /**
         * 写
         * @param path
         * @param value 如果value为null，则不处理
         * @param recursive 是否递归，默认true
         */
        public set(path: string, value: any, recursive = true) {
            if (this._data == null) {
                this._data = {};
            }
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
            this.handleDataChange();
            return this;
        }

        public setKV(k: string, v: any) {
            if (this._data == null) {
                this._data = {};
            }
            setValue(this._data, k, v);
            return this;
        }


        private aa: boolean = false;
        private handleDataChange() {
            if (this.aa) return;
            this.aa = true;
            scheduleOnce(dt => {
                this.emit(Data.DataChangeEvent, this);
                this.aa = false;
            }, 0, this);
        }

        /**
         * 是否存在
         * @param paths 
         * @returns 
         */
        public has(paths?: string | string[]): boolean {
            return !!this.get(paths);
        }


        /**
         * 删
         * @param path
         */
        public delete(path: string): any {
            if (this._data == null) return null;
            return deleteValue(this._data, path);
        }

        public clear(): void {
            this._data = {};
        }

        /**
         * 枚举
         * @param handler
         */
        public enumerate(handler: (k: string, v: any) => void) {
            for (const key in this._data) {
                handler(key, this._data[key]);
            }
        }

        public onChange(handler: (d?: Data) => void, target?: any): void {
            this.on(Data.DataChangeEvent, handler, target);
        }
    }

    /**
     * 数据缓存类，包括localstorage、json配置、全局临时数据
     */
    export class DataCache extends EventTarget {
        private _json: Data;
        private _tmp: Data;
        private _localPreKey: string = '';

        constructor() {
            super();
            this._json = new Data();
            this._tmp = new Data();
        }

        /**本地数据前缀，用来区分不同账号 */
        public get localPreKey(): string {
            return this._localPreKey;
        }

        public set localPreKey(v: string) {
            this._localPreKey = v;
        }



        /**
         * 获取本地数据
         * @param key
         * @param defaultVal 默认值
         */
        public getLocal(key: string, defaultVal?: any): any {
            key = `${this._localPreKey}_${key}`;
            let a = localStorage.getItem(key);
            if (a == null || a == undefined || a == 'undefined') return defaultVal;
            try {
                return parse2Json(a);
            } catch (e) {
                no.err('JSON.parse', 'getLocal', key, a);
                return null;
            }
        }
        /**
         * 写入本地数据
         * @param key
         * @param value
         */
        public setLocal(key: string, value: any): void {
            key = `${this._localPreKey}_${key}`;
            if (value === null || value === undefined || value === 'undefined')
                localStorage.removeItem(key);
            else
                localStorage.setItem(key, jsonStringify(value));
            this.emit(key, value);
        }
        /**删除本地数据 */
        public deleteLocal(key: string) {
            key = `${this._localPreKey}_${key}`;
            localStorage.removeItem(key);
        }
        /**消除全部本地数据 */
        public clearLocal() {
            localStorage.clear();
        }

        /**
         * 获取配置数据
         * @param path 如a.b.c 或[a,b,c]
         */
        public getJSON(path?: string | string[]): any {
            const a = this._json.get(path);
            if (!a) err('配置数据不存在：', path);
            return a;
        }

        /**
         * 写入配置数据
         * @param json
         */
        public setJSON(json: Object): void {
            forEachKV(json, (key, value) => {
                this._json.setKV(key, value);
                return false;
            });
        }

        /**
         * 将所有配置设置为只读状态
         */
        // public unwritableJSON(json?: any) {
        //     json = json || this._json.data;
        //     for (const key in json) {
        //         Object.defineProperty(json, key, {
        //             writable: false
        //         });
        //         if (json[key] instanceof Array) {
        //             json[key].forEach((a: any) => {
        //                 this.unwritableJSON(a);
        //             });
        //         } else if (json[key] instanceof Object) {
        //             this.unwritableJSON(json[key]);
        //         }
        //     }
        // }
        /**
         * 获取全局临时数据
         * @param key
         */
        public getTmpData(key: string): any {
            return { [key]: this.getTmpValue(key) };
        }
        /**
         * 获取全局临时数据值
         * @param key
         */
        public getTmpValue(key: string): any {
            return this._tmp.get(key);
        }
        /**
         * 写入全局临时数据
         * @param key
         * @param value
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

    export type AssetPath = { bundle?: string, path?: string, file?: string, type?: typeof Asset | typeof ImageAsset };
    export class AssetBundleManager {

        private remoteAssetsCache: any = {};
        private _cacheAsset: { [k: string]: any } = {};
        private _cacheAssetRef: { [k: string]: { ref: number, time: number } } = {};
        private _ttfFont: { [fontFamily: string]: TTFFont } = {};
        private _loadingAsset: { [k: string]: boolean } = {};

        public constructor() {
            //用于设置下载的最大并发连接数，若当前连接数超过限制，将会进入等待队列。
            assetManager.downloader.maxConcurrency = 10;
            //用于设置每帧发起的最大请求数，从而均摊发起请求的 CPU 开销，避免单帧过于卡顿
            assetManager.downloader.maxRequestsPerFrame = 10;
            assetManager.downloader.maxRetryCount = 2;
        }

        public get server(): string {
            return assetManager.downloader.remoteServerAddress;
        }

        public set server(v: string) {
            assetManager.downloader['_remoteServerAddress'] = v;
        }

        public get remoteBundles(): readonly string[] {
            return assetManager.downloader.remoteBundles;
        }

        public isRemoteBundle(bundleName: string): boolean {
            return this.remoteBundles.includes(bundleName);
        }

        public bundleVer(bundleName: string): string {
            return assetManager.downloader.bundleVers[bundleName];
        }

        public bundleUrl(bundleName: string): string {
            if (this.isRemoteBundle(bundleName)) {
                return this.server + pathjoin('remote', bundleName);
            }
            return bundleName;
        }

        public getPrefabNode(k: string): Node {
            const n = this.getCachedAsset<Prefab>(k);
            try {
                if (n && n.isValid) return instantiate(n);
                return null;
            } catch (e) {
                err('no getPrefabNode', e);
                return null;
            }
        }

        public setPrefabNode(k: string, prefab: Prefab) {
            // console.log('setPrefabNode', k);
            this.cacheAsset(k, prefab);
            this.cacheAsset(prefab.uuid, prefab);
        }

        /**
         * 当多个并发加载同一个资源时，设置该资源的加载状态
         * @param k 资源唯一标识uuid|url
         */
        public loadingAsset(k: string) {
            this._loadingAsset[k] = true;
        }

        /**
         * 该资源是否在加载中
         * @param k 资源唯一标识uuid|url
         * @returns 
         */
        public isAssetLoading(k: string): boolean {
            return this._loadingAsset[k] || false;
        }

        /**
         * 标记该资源已经完成加载
         * @param k 资源唯一标识uuid|url
         */
        public assetLoadingEnd(k: string) {
            this._loadingAsset[k] = false;
        }

        public clearCachedAssets() {
            this._cacheAsset = {};
        }

        /**
         * 预加载bundles
         * @param paths
         * @param onProgress
         */
        public loadBundles(paths: string[], onProgress: (progress: number) => void): void {
            if (paths == null) {
                onProgress && onProgress(1);
                return;
            }
            this._loadB(paths, 0, onProgress);
        }

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
         * 预加载files
         * @param bundleName
         * @param filePaths
         * @param onProgress
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

        public preloadAny(requests: {
            uuid?: string,
            url?: string,
            path?: string,
            dir?: string,
            scene?: string
        }[], onProgress: (progress: number) => void): void {
            // log('preloadAny', requests);
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
         * 预加载场景
         * @param name
         * @param onProgress
         */
        public preloadScene(name: string, onProgress: (progress: number) => void): void {
            director.preloadScene(name, (finished, total, item) => {
                // onProgress && onProgress((finished / total) || 0);
            }, (err) => {
                if (err) {
                    log('preloadScene', name, err.message);
                } else {
                    onProgress && onProgress(1);
                }
            });
        }
        /**
         * 加载bundle
         * @param name
         * @param callback
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
         * 获取已加载的bundle
         * @param name
         */
        public getLoadedBundle(name: string): Bundle {
            const a = assetManager.getBundle(name);
            if (!a) {
                err(`getLoadedBundle 包${name}未加载`);
            }
            return a;
        }

        /**
         * 通用资源加载
         * @param path
         * @param type
         * @param callback
         */
        public loadFile(path: string, type: typeof Asset | typeof ImageAsset, callback: (asset: Asset) => void): void {
            let p = this.assetPath(path);
            if (p.bundle) {
                this.load(p.bundle, p.path, type, (asset: Asset) => {
                    callback(asset);
                });
            }
            else {
                assetManager.loadAny({ 'url': path }, (e, item) => {
                    if (err) err('loadFile', path, e.message);
                    callback(item);
                });
            }
        }
        /**
         * 加载bundle中的文件
         * @param bundleName
         * @param fileName
         * @param type
         * @param callback
         */
        public load(bundleName: string, fileName: string, type: typeof Asset | typeof ImageAsset, callback: (asset: Asset) => void): void {
            // log('load', bundleName, fileName);
            if (bundleName == null || bundleName == '') {
                assetManager.loadAny({ 'url': fileName }, (err, item) => {
                    if (item == null) {
                        log('load', fileName, err.message);
                    } else {
                        this.addRef(item);//增加引用计数
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
                        } else {
                            this.addRef(item);//增加引用计数
                            // this.loadDepends(item.uuid);
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

        public loadText(path: string, callback: (item: TextAsset) => void): void {
            this.loadFile(path, TextAsset, callback);
        }

        public loadJSON(path: string, callback: (item: JsonAsset) => void): void {
            this.loadFile(path, JsonAsset, callback);
        }

        public loadSprite(path: string, callback: (item: SpriteFrame) => void): void {
            this.loadFile(path, SpriteFrame, callback);
        }

        public loadSpine(path: string, callback: (item: SkeletonData) => void): void {
            this.loadFile(path, SkeletonData, callback);
        }

        public loadAtlas(path: string, callback: (item: SpriteAtlas) => void): void {
            this.loadFile(path, SpriteAtlas, callback);
        }

        public loadTexture(path: string, callback: (item: Texture2D) => void): void {
            this.loadFile(path, Texture2D, callback);
        }

        public loadAudio(path: string, callback: (item: AudioClip) => void): void {
            this.loadFile(path, AudioClip, callback);
        }

        public loadPrefab(path: string, callback: (item: Prefab) => void): void {
            this.loadFile(path, Prefab, callback);
        }

        public loadAnimationClip(path: string, callback: (item: AnimationClip) => void): void {
            this.loadFile(path, AnimationClip, callback);
        }

        public loadMaterial(path: string, callback: (item: Material) => void): void {
            this.loadFile(path, Material, callback);
        }

        public loadEffect(path: string, callback: (item: EffectAsset) => void): void {
            this.loadFile(path, EffectAsset, callback);
        }

        public loadFont(path: string, callback: (item: Font) => void): void {
            this.loadFile(path, Font, callback);
        }

        public loadBuffer(path: string, callback: (item: BufferAsset) => void): void {
            this.loadFile(path, BufferAsset, callback);
        }

        // public loadDragonBonesAtlasAsset(path: string, callback: (item: dragonBones.DragonBonesAtlasAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAtlasAsset, callback);
        // }

        // public loadDragonBonesAsset(path: string, callback: (item: dragonBones.DragonBonesAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAsset, callback);
        // }

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
                        items.forEach(item => {
                            this.addRef(item);//增加引用计数
                            // this.loadDepends(item.uuid);
                        });
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
         * 加载场景
         * @param name
         * @param callback
         */
        public loadScene(name: string, callback: () => void): void {
            director.loadScene(name, callback);
        }

        /**
         * 从服务器加载文件
         * @param url
         * @param callback
         */
        public loadRemoteFile<T extends Asset>(url: string, callback: (file: T) => void) {
            if (this.remoteAssetsCache[url]) callback?.(this.remoteAssetsCache[url]);
            else
                assetManager.loadRemote<T>(url, (err, file) => {
                    if (file == null) {
                        log('loadRemoteFile', url, err.message);
                        callback?.(null);
                    } else {
                        this.remoteAssetsCache[url] = file;
                        callback?.(file);
                    }
                });
        }

        public loadRemoteText(url: string, callback: (file: TextAsset) => void) {
            this.loadRemoteFile<TextAsset>(url, callback);
        }

        public loadRemoteImage(url: string, ext: '.png' | '.jpg', callback: (sf: SpriteFrame) => void) {
            if (this.remoteAssetsCache[url]) callback?.(this.remoteAssetsCache[url]);
            else
                assetManager.loadRemote<ImageAsset>(url, { ext: ext }, (err, file) => {
                    if (file == null) {
                        log('loadRemoteFile', url, err.message);
                        callback?.(null);
                    } else {
                        const spriteFrame = new SpriteFrame();
                        const texture = new Texture2D();
                        texture.image = file;
                        spriteFrame.texture = texture;
                        this.remoteAssetsCache[url] = spriteFrame;
                        callback?.(spriteFrame);
                    }
                });
        }

        public loadRemoteBundle(url: string, opts?: { version?: string, scriptAsyncLoading?: boolean }, callback?: (bundle: Bundle) => void) {
            assetManager.loadBundle(url, opts, (e, bundle) => {
                if (e) err(e.stack);
                callback?.(bundle);
            });
        }

        /**
         * 获取bundle路径，文件名及文件类型
         * @param path
         * @returns  `{'bundle','file','type'}
         */
        public assetPath(path: string): AssetPath {
            path = path.split('/assets/').pop();
            let p = path.split('/');
            let bundle: string;
            for (let i = 0, n = p.length; i < n; i++) {
                const b = p.shift();
                if (assetManager['_projectBundles'].includes(b)) {
                    bundle = b;
                    break;
                }
            }
            if (!bundle) return {};
            let file = p.pop().split('.');
            let fileType = file.pop(),
                fileName = file.join('.') || fileType;
            let a: AssetPath = { bundle: bundle, file: fileName };
            p[p.length] = fileName;
            a.path = p.join('/');
            let s: typeof Asset | typeof ImageAsset;
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
                a.type = s;
            }
            return a;
        }

        public loadAllFilesInBundle(bundleName: string, exceptAssetTypes: (typeof Asset | typeof ImageAsset)[], onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                const assetInfos = bundle['_config'].assetInfos._map;
                let requests: any[] = [];
                for (const uuid in assetInfos) {
                    const info = assetInfos[uuid];
                    if (!info.path?.endsWith('/texture') && (uuid.includes('@') || !info.ctor)) continue;
                    if (exceptAssetTypes && exceptAssetTypes.includes(info.ctor)) continue;
                    requests[requests.length] = { uuid: uuid };
                }
                this.loadAnyFiles(requests, onProgress, onComplete);
            } else {
                this.loadBundle(bundleName, () => {
                    this.loadAllFilesInBundle(bundleName, exceptAssetTypes, onProgress, onComplete);
                });
            }
        }

        public preloadAllFilesInBundle(bundleName: string, onProgress?: (progress: number) => void) {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                const assetInfos = bundle['_config'].assetInfos._map;
                let paths: string[] = [];
                for (const uuid in assetInfos) {
                    const a = assetInfos[uuid];
                    if (a.path && !uuid.includes('@') && this.loadTypes.includes(a.ctor.name)) {
                        paths[paths.length] = a.path;
                    }
                }
                // this.preloadFiles(bundleName, paths, onProgress);
                bundle.preload(paths, Asset, (finished, total, item: any) => {
                    onProgress && onProgress(finished / total);
                }, (e, items) => {
                    if (e) err('preloadFiles', e.message);
                });
            } else {
                this.loadBundle(bundleName, () => {
                    this.preloadAllFilesInBundle(bundleName, onProgress);
                });
            }
        }

        public loadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void, specialTypes?: typeof Asset[]) {
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                err(`${folderName}没有设置ab包`);
                return;
            }
            p.path += '/';
            let bundle = this.getLoadedBundle(p.bundle);
            const assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                if (specialTypes) {
                    if (info.path?.indexOf(p.path) == 0 && specialTypes.includes(info.ctor))
                        requests[requests.length] = { path: info.path, bundle: p.bundle, type: info.ctor };
                    continue;
                }
                if (uuid.includes('@')) continue;
                if (info.path?.indexOf(p.path) == 0) {
                    requests[requests.length] = { path: info.path, bundle: p.bundle, type: info.ctor };
                }
            }
            this.loadAnyFiles(requests, onProgress, onComplete);
        }

        public preloadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                err(`${folderName}没有设置ab包`);
                return;
            }
            let bundle = this.getLoadedBundle(p.bundle);
            let infos = bundle.getDirWithPath(p.path);
            let requests: { path: string, bundle: string, type: typeof Asset }[] = [];
            infos.forEach(a => {
                if (a.uuid.indexOf('@') == -1) {
                    requests[requests.length] = { path: a.path, bundle: p.bundle, type: Asset };
                }
            });
            this.loadAnyFiles(requests, onProgress, onComplete);
        }

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
         * 加载单一资源
         * @param request {url:完成路径,path:相对于包的路径,uuid:唯一id,bundle:包名,type:资源类型}
         * @param callback 
         */
        public loadAny<T extends Asset>(request: { url?: string, path?: string, uuid?: string, bundle?: string, type?: typeof Asset | typeof ImageAsset }, callback?: (file: T) => void): void {
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

        public addRef(asset: Asset): void {
            if (!asset) return;
            if (asset instanceof TTFFont) {
                this._ttfFont[asset._fontFamily] = asset;
            }
            asset.addRef();
        }

        public decRef(asset: Asset): void {
            if (!asset) return;
            scheduleOnce(() => {
                if (asset.refCount > 0) {
                    asset.decRef();
                    // log('decRef', asset.uuid, asset.refCount);
                }
            }, .02);
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
         * 释放资源
         * @param asset 资源对象或uuid
         * @param force 是否强制释放，默认false
         * @returns 
         */
        public release(asset: Asset | string, force = false): void {
            if (!asset) return;
            if (asset instanceof SpriteFrame) {
                asset = asset.uuid;
            }
            if (typeof asset == 'string') {
                asset = asset.split('@')[0];
                asset = assetManager.assets.get(asset);
            }
            if (!asset) return;
            if (force) assetManager.releaseAsset(asset);
            else {
                scheduleOnce(() => {
                    (<Asset>asset).decRef();
                }, .02);
            }
        }

        public getAssetFromCache(uuid: string): Asset {
            return assetManager.assets.get(uuid);
        }

        /**
         * 加载多个资源
         * @param requests {url:完成路径,path:相对于包的路径,uuid:唯一id,bundle:包名,type:资源类型}[]
         * @param onProgress 
         * @param onComplete 
         */
        public async loadAnyFiles(requests: { 'url'?: string, 'path'?: string, 'uuid'?: string, 'bundle'?: string, 'type'?: typeof Asset | typeof ImageAsset }[], onProgress?: (progress: number) => void, onComplete?: (items: Asset[]) => void) {
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
                    items.forEach(item => {
                        this.addRef(item);
                    });
                    onComplete?.(items);
                }
            });
        }

        private _loadAnyFile(request: { 'url'?: string, 'path'?: string, 'uuid'?: string, 'bundle'?: string, 'type'?: typeof Asset }) {
            return new Promise<Asset>(resolve => {
                this.loadAny(request, item => {
                    resolve(item);
                });
            });
        }

        public getUuidFromPath(path: string): string | null {
            let a = this.assetPath(path);
            return this.getLoadedBundle(a.bundle)?.getInfoWithPath(a.path, a.type).uuid;
        }

        public getUrlWithUuid(uuid: string): string {
            return assetManager.utils.getUrlWithUuid(uuid);
        }

        public getBundleNameByUuid(uuid: string): string {
            const bundles = assetManager.bundles;
            let name: string;
            bundles.forEach((bundle, key) => {
                if (bundle.getAssetInfo(uuid)) name = bundle.name;
            });
            return name;
        }

        public getBundleVersion(bundleName: string): string {
            return assetManager.downloader.bundleVers[bundleName];
        }

        public clear() {
            assetManager.releaseAll();
        }

        public has(path: string): Promise<boolean> {
            return new Promise<boolean>(resolve => {
                const p = this.assetPath(path);
                let bundle = this.getLoadedBundle(p.bundle);
                if (bundle != null) {
                    resolve(bundle['_config'].paths.has(p.path));
                } else {
                    this.loadBundle(p.bundle, () => {
                        return this.has(path);
                    });
                }
            });
        }

        public getCachedTexture(img: ImageAsset): Texture2D | null {
            const uuid = img.uuid;
            let texture = this.getCachedAsset<Texture2D>(uuid);
            if (!texture) {
                texture = new Texture2D();
                texture.image = img;
                this.cacheAsset(uuid, texture);
            }
            return texture;
        }

        /**
         * 获取缓存的资源
         * @param k 资源唯一标识uuid|url
         * @returns 
         */
        public getCachedAsset<T>(k: string): T {
            return this._cacheAsset[k] as T;
        }

        /**
         * 缓存资源
         * @param k 资源唯一标识uuid|url
         * @param asset 资源
         */
        public cacheAsset(k: string, asset: any) {
            this._cacheAsset[k] = asset;
        }

        public cacheImage(image: ImageAsset) {
            this.cacheAsset(image.uuid, image);
            this._cacheAssetRef[image.uuid] = { ref: 0, time: sysTime.now };
            this.releaseUnuseImage();
        }

        public hasImage(uuid: string): boolean {
            return !!this.getCachedAsset(uuid);
        }

        public getCachedAtlasJson(uuid: string) {
            return this.getCachedAsset(uuid);
        }

        public createTextureFromCache(uuid: string): Texture2D | null {
            const image = this.getCachedAsset<ImageAsset>(uuid.split('@')[0]);
            if (!image) return null;
            let texture = new Texture2D();
            texture['_uuid'] = uuid;
            texture.image = image;
            let a = this._cacheAssetRef[image.uuid];
            a.ref++;
            a.time = sysTime.now;
            return texture;
        }

        public createSpriteFrameFromCache(uuid: string): SpriteFrame | null {
            const t = this.createTextureFromCache(uuid);
            if (!t) return null;
            const s = new SpriteFrame();
            s._uuid = uuid;
            s.texture = t;
            return s;
        }

        public deRefCachedImage(uuid: string) {
            let a = this._cacheAssetRef[uuid];
            if (!a) return;
            a.ref--;
            a.time = sysTime.now;
            this.releaseUnuseImage();
        }

        public getCachedImageInfo(uuid: string) {
            return this._cacheAssetRef[uuid];
        }

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

        public removeCachedImage(uuid: string) {
            // this._cacheAsset[uuid]?.destroy();
            delete this._cacheAsset[uuid];
            delete this._cacheAssetRef[uuid];
            this.release(uuid, true);
        }

        private loadTypes: string[] = ['ImageAsset', 'Prefab', 'JsonAsset'];

        /**
         * 加载目录下所有资源并放入缓存中，不支持同时加载多个目录，如果有需求，需要在外部根据实际性能情况做延迟加载
         * @param folder 
         */
        public loadFolderFilesToCache(folder: string, onComplete?: () => void) {
            const p = this.assetPath(folder);
            no.log('loadFolderFilesToCache', p);
            if (p.bundle) {
                const bundle = this.getLoadedBundle(p.bundle),
                    infos = bundle.getDirWithPath(p.path),
                    base = 'db://' + bundle.base.replace(this.server + 'remote', 'assets');
                let requests: { path?: string, uuid?: string }[] = [];
                infos.forEach(a => {
                    if (a.uuid.indexOf('@') == -1 && this.loadTypes.includes(a.ctor.name)) {
                        requests[requests.length] = { path: a.path, uuid: a.uuid };
                    }
                });
                this.loadAnyFiles(requests, null, items => {
                    items.forEach((item, i) => {
                        if (item instanceof Prefab) {
                            const request = requests[i];
                            this.setPrefabNode(base + request.path + '.prefab', item);
                        } else if (item instanceof ImageAsset) {
                            this.cacheImage(item);
                        } else if (item instanceof JsonAsset) {
                            this.cacheAsset(item.uuid, item.json);
                        }
                    });
                    onComplete?.();
                });
            }
        }

        public loadAllPrefabsInBundle(bundleName: string) {
            const bundle = this.getLoadedBundle(bundleName),
                assetInfos = bundle['_config'].assetInfos._map,
                base = 'db://' + bundle.base.replace(this.server + 'remote', 'assets');
            let requests: any[] = [];
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                if (info.ctor.name == 'Prefab')
                    requests[requests.length] = { path: info.path, uuid: info.uuid };
            }
            this.loadAnyFiles(requests, null, items => {
                items.forEach((item, i) => {
                    if (item instanceof Prefab) {
                        const request = requests[i];
                        this.setPrefabNode(base + request.path + '.prefab', item);
                    } else if (item instanceof ImageAsset) {
                        this.cacheImage(item);
                    } else if (item instanceof JsonAsset) {
                        this.cacheAsset(item.uuid, item.json);
                    }
                });
            });
        }

        public getAssetTypeByName(typeName: string): typeof Asset | typeof ImageAsset {
            switch (typeName) {
                case 'ImageAsset':
                    return ImageAsset;
                case 'Prefab':
                    return Prefab;
                case 'JsonAsset':
                    return JsonAsset;
                default: return null;
            }
        }

        /**
         * 预加载远程包
         */
        public preloadRemoteBundles(cb?: () => void) {
            const bundles = this.remoteBundles.slice();
            if (!bundles.length) return cb?.();
            log('开始预加载远程包', bundles);
            this.loadBundles(bundles, (p) => {
                if (p >= 1) {
                    log('预加载远程包完成');
                    cb?.();
                }
            });
        }
    }

    /**全局资源管理器 */
    export const assetBundleManager = new AssetBundleManager();

    /**缓存池 */
    class CachePool {
        private cacheMap: Map<string, { o: any, t: number }[]>;
        private checkDuration = 60000;
        constructor() {
            this.cacheMap = new Map<string, any[]>();
            setInterval(() => {
                this.checkClear();
            }, this.checkDuration / 2);
        }

        /**
         * 获取缓存的对象
         * @param type
         */
        public reuse<T>(type: string): T | null {
            if (!this.cacheMap.has(type)) return null;
            let a = this.cacheMap.get(type).shift();
            if (!a) return null;
            return a.o as T;
        }

        /**
         * 回收缓存对象
         * @param type
         * @param object
         */
        public recycle(type: string, object: any, canRelease = true): void {
            if (type == null || type == '') {
                log(`${object.name}未指定回收类型，不做回收处理，直接销毁`);
                this._clear(object);
                return;
            }
            if (!this.cacheMap.has(type)) this.cacheMap.set(type, []);
            if (object instanceof Node) {
                object.parent = null;
                // object.active = false;
                visible(object, false);
            }
            let a = this.cacheMap.get(type) || [];
            let have = false;
            for (let i = 0, n = a.length; i < n; i++) {
                let b = a[i];
                if ((object.uuid && b.o.uuid == object.uuid) || (object._uuid && b.o._uuid == object._uuid)) {
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

        public canReuseNumber(type: string): number {
            return (this.cacheMap.get(type) || []).length;
        }

        public clearAll(): void {
            let types = MapKeys2Array(this.cacheMap);
            let n = types.length;
            for (let i = 0; i < n; i++) {
                this.clear(types[i]);
            }
        }

        public clear(type: string): void {
            let arr = this.cacheMap.get(type);
            if (!arr) return;
            this.cacheMap.delete(type);
            for (let i = arr.length - 1; i >= 0; i--) {
                let a = arr[i];
                this._clear(a.o);
            }
        }


        private _clear(obj: any): void {
            if (obj instanceof Node) obj.destroy();
            else if (obj instanceof Asset) assetBundleManager.release(obj);
            else obj = null;
        }

        private checkClear() {
            let t = timestamp();
            let types = MapKeys2Array(this.cacheMap);
            types.forEach(type => {
                let arr = this.cacheMap.get(type) || [];
                for (let i = arr.length - 1; i >= 0; i--) {
                    let a = arr[i];
                    if (t - a.t >= this.checkDuration) {
                        arr.splice(i, 1);
                        this._clear(a.o);
                    }
                }
                if (arr.length == 0) this.cacheMap.delete(type);
            });
        }
    }
    /**全局缓存池 */
    export const cachePool = new CachePool();

    /**红点管理类 */
    class HintCenter extends Event {
        private data: Map<string, number> = new Map<string, number>();
        private timestampHit: object = new Object();

        constructor() {
            super();
            setInterval(() => {
                this.checkHint();
            }, 2000);
        }

        /**
         * 设置红点
         * @param type 红点类型
         * @param v v为红点数量,v>0时显示红点，否则隐藏
         */
        public setHint(type: string, v: number) {
            v = float(v, 0);
            this.data.set(type, v);
            this.emit(type, v, type);
        }

        public changeHint(type: string, v: number): void {
            v = float(v, 0);
            let a = this.getHintValue(type);
            a += v;
            if (a < 0) a = 0;
            this.setHint(type, a);
        }

        /**
         * 监听红点状态
         * @param type 红点类型
         * @param func
         * @param target
         */

        public onHint(type: string, func: Function, target: any): void {
            this.on(type, func, target);
            if (this.data.has(type)) {
                this.emit(type, this.data.get(type), type);
            }
        }

        /**
         * 移除红点状态监听
         * @param target
         */
        public offHint(target: any): void {
            this.targetOff(target);
        }

        /**
         * 按时间戳设置红点
         * @param type 红点类型
         * @param time 将来时间戳
         */
        public setHintTimestamp(type: string, time: number): void {
            if (time < timestamp()) {
                return;
            } else {
                if (this.timestampHit[type] == null || this.timestampHit[type] > time)
                    this.timestampHit[type] = time;
            }
        }

        public getHintValue(type: string): number {
            let n = 0;
            if (this.data.has(type)) n = this.data.get(type);
            return n;
        }

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

        public clear() {
            this.data.clear();
            this.timestampHit = {};
        }
    }
    /**全局红点管理器 */
    export const hintCenter = new HintCenter();

    /**节点管理类 */
    class NodeTargetManager {

        private targetMap: Map<string, any> = new Map();

        /**
         * 注册节点
         * @param type 注册类型
         * @param target 目标
         */
        public register(type: string, target: any) {
            if (type == null || type == '' || target == null) return;
            this.targetMap.set(type, target);
        }

        /**
         * 获取节点目标
         * @param type 注册类型
         * @returns 目标
         */
        public get<T>(type: string): T {
            if (type == null || type == '') return null;
            if (!this.targetMap.has(type)) return null;
            return this.targetMap.get(type) as T;
        }

        /**
         * 移除目标
         * @param type 注册类型
         */
        public remove(type: string, target: any) {
            if (type == null || type == '' || target == null) return;
            if (this.targetMap.has(type)) {
                let a = this.targetMap.get(type);
                if (a['uuid'] == target['uuid'])
                    this.targetMap.delete(type);
            }
        }

        public getSub<T>(type: string, subs: string[]): T {
            let target = this.get<any>(type);
            let sub = subs.shift();
            if (!isNaN(Number(sub)))
                target = target.node.children[sub]?.getComponentsInChildren('YJNodeTarget')[0];
            else if (subs.length == 0) {
                let arr = target.node.getComponentsInChildren('YJNodeTarget');
                for (let i = 0, n = arr.length; i < n; i++) {
                    if (arr[i].subType == sub) {
                        return arr[i];
                    }
                }
            }
            if (subs.length == 0) return target;
            return this.getSub<T>(sub, subs);
        }
    }
    /**全局节点管理类 */
    export const nodeTargetManager = new NodeTargetManager();


    let units = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",];
    /**用科学计数格式表示的字符串 */
    export class ScientificString {
        private _coefficient: number = 0;
        /**指数 */
        public index: number = 0;

        constructor(v?: string | number | { _coefficient: number, index: number }) {
            v = v || 0;
            if (v['_coefficient'] !== undefined) {
                this._coefficient = v['_coefficient'];
                this.index = v['index'];
            }
            else
                this.value = String(v);
        }

        public static get new(): ScientificString {
            return new ScientificString(0);
        }

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

        public get value(): string {
            return `${this._coefficient}E${this.index}`;
        }

        public setValue(v: string | number): ScientificString {
            this.value = v;
            return this;
        }

        /**系数 */
        public get coefficient(): number {
            return this._coefficient;
        }

        /**系数 */
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
         * 复制
         */
        public get clone(): ScientificString {
            let a = ScientificString.new;
            a._coefficient = this.coefficient;
            a.index = this.index;
            return a;
        }

        /**
         * 复制成目标
         */
        public cloneTo(other: ScientificString) {
            if (other == null) return;
            this._coefficient = other._coefficient;
            this.index = other.index;
        }

        /**加 */
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

        /**加 */
        public static add(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let sc2 = new ScientificString(s2);
            out.add(sc2);
            return out;
        }

        /**减 */
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

        /**减 */
        public static minus(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let s = new ScientificString(s2);
            out.minus(s);
            return out;
        }

        /**乘 */
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

        /**乘 */
        public static mul(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let s = new ScientificString(s2);
            out.mul(s);
            return out;
        }

        /**除 */
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

        /**除 */
        public static div(s1: string, s2: string, out?: ScientificString): ScientificString {
            out = out || new ScientificString();
            out.value = s1;
            let s = new ScientificString(s2);
            out.div(s);
            return out;
        }

        /**
         * 值比较
         * @param other
         * @returns 负值：小于，0：等于，正值：大于
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
         * 值比较
         * @param s1
         * @param s2
         * @returns 负值：小于，0：等于，正值：大于
         */
        public static compareTo(s1: string, s2: string): number {
            if (s1 == null) return -1;
            if (s2 == null) return 1;
            let e1 = new ScientificString(s1),
                e2 = new ScientificString(s2);
            return e1.compareTo(e2);
        }

        /**带单位的值 */
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

        public getUnit(a: number): string {
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

        public get numberValue(): number {
            return mutiply(this._coefficient, Math.pow(10, this.index));
        }

        /**
         * 带单位字符串
         * @param units 自定义单位数组
         * @param step 单位换算步进值
         * @param digits 小数位数
         * @returns string 如：1.23AA
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
         * 取负值到一个新的ScientificString
         * @returns 新的ScientificString
         */
        public toNegative(): ScientificString {
            let a = this.clone;
            a._coefficient = -Math.abs(a._coefficient);
            return a;
        }
        /**
         * 取正值到一个新的ScientificString
         * @returns 新的ScientificString
         */
        public toPositive(): ScientificString {
            let a = this.clone;
            a._coefficient = Math.abs(a._coefficient);
            return a;
        }

        public static toUnitString(v: string | number): string {
            const a = new ScientificString(v);
            return a.unitValue;
        }
    }

    export function scientificString(v: number | string): ScientificString {
        return new ScientificString(v);
    }

    /**关系查询 */
    export class RelationQuery {

        private expMap: Map<string, { k: string, symbol: string, v: any }>;
        private _tableDatas: any;

        public static get new(): RelationQuery {
            return new RelationQuery();
        }

        constructor() {
            this.expMap = new Map<string, { k: string, symbol: string, v: any }>();
        }

        /**
         * 单表查询
         * @param expression 表达式，如'tableName1[.?] where keyA==1 and keyB != 2 or keyC > 3 and keyD <= (tableName2.keyE:keyF ?= "bb")'
         * @param tableDatas 表数据，{tableName:data}
         */
        public select(expression: string, tableDatas: any): any {
            let a = this.selectList(expression, tableDatas) || [];
            return a.length <= 1 ? a[0] : a;
        }

        public selectList(expression: string, tableDatas: any): any[] {
            this._tableDatas = tableDatas;
            expression = this.parseBrackets(expression);
            let arr = [];
            let exps = expression.split(' where ');
            let table = exps[0].split('.');
            let tableData = tableDatas[table[0]];
            if (exps[1]) {
                let query = exps[1];
                let queryies = this.parseOr(query);
                forEachKV(tableData, (key, value) => {
                    if (this.checkConditions(value, queryies))
                        arr.push(value);
                    return false;
                });
            } else {
                forEachKV(tableData, (key, value) => {
                    arr.push(value);
                    return false;
                });
            }

            if (table[1] != null && arr.length >= 1) {
                let b = [];
                arr.forEach(a => {
                    b.push(this.getQueryValue(a, table[1]));
                });
                return b;
            } else if (table[1] == null) {
                return arr;
            }
        }

        private getQueryValue(tableData: any, keys: string): any {
            keys = keys.replace(new RegExp('\\[|\\]', 'g'), '');
            let a = keys.split(',');
            if (a.length == 1) return tableData[a[0]];
            let b: any = {};
            a.forEach(k => {
                b[k] = tableData[k];
            });
            return b;
        }

        private parseOr(str: string): string[][] {
            let queryies: string[][] = [];
            let ands = str.split(' or ');
            ands.forEach(and => {
                queryies.push(this.parseAnd(and));
            });
            return queryies;
        }

        private parseAnd(str: string): string[] {
            return str.split(' and ');
        }

        private parseBrackets(exp: string): string {
            if (!exp.includes('(') && !exp.includes(')')) return exp;
            let i1 = exp.indexOf('('),
                i2 = exp.lastIndexOf(')');
            let sub = exp.substring(i1 + 1, i2);
            let a = this.select(sub, this._tableDatas);
            return exp.replace(exp.substring(i1, i2 + 1), String(a));
        }

        /**判断或 */
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

        /**判断与 */
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

        private condition2Express(condition: string): { k: string, symbol: string, v: any } {
            if (this.expMap.has(condition)) return this.expMap.get(condition);

            let r = { k: '', symbol: '', v: null };
            condition = condition.trim();
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
            } else if (condition.includes('?=')) {
                r.symbol = '?=';
                let a = condition.split('?=');
                r.k = a[0].trim();
                r.v = a[1].trim();
            } else if (condition.includes('in')) {
                r.symbol = 'in';
                let a = condition.split('in');
                r.k = a[0].trim();
                r.v = a[1].trim();
            }
            this.expMap.set(condition, r);
            return r;
        }
    }

    class Database {
        private _tables: any;

        constructor() {
            this._tables = new Object();
        }

        /**
         * 设置表
         * @param name 表名
         * @param data 数据
         */
        public setTable(name: string, data = {}) {
            this._tables[name] = data;
        }

        /**
         * 查表
         * @param tableNames [表名]
         * @param expression RelationQuery的查询表达式
         * @returns
         */
        public select(tableNames: string[], expression: string): any {
            let datas = {};
            tableNames.forEach(n => {
                datas[n] = this._tables[n];
            });
            return RelationQuery.new.select(expression, datas);
        }

        /**
         * 向表增加一条数据
         * @param tableName 表名
         * @param id
         * @param value
         * @returns
         */
        public insert(tableName: string, id: string | number, value: any): any {
            this._tables[tableName] = this._tables[tableName] || {};
            this._tables[tableName][id] = value;
            return this._tables[tableName];
        }

        /**
         * 删除表中某条数据
         * @param tableName 表名
         * @param id
         * @returns
         */
        public delete(tableName: string, id: string | number): any {
            if (!this._tables[tableName]) return null;
            let a = this._tables[tableName][id];
            delete this._tables[tableName][id];
            return a;
        }

        /**
         * 更新表中某条数据
         * @param tableName 表名
         * @param path 数据访问路径,如a.b.c或[a,b,c]
         * @param value
         * @returns
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
     * 简单的http请求
     */
    export class HttpRequest {
        private Authorization: string;

        /**
         *
         * @param author 权限认证字符串
         */
        constructor(author: string) {
            this.Authorization = author;
        }

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

        public get(url: string): Promise<any> {
            return new Promise<any>(resolve => {
                this.httpRequest("GET", url, null, (v: any) => {
                    resolve(v);
                });
            });
        }

        public post(url: string, data: string | object): Promise<any> {
            return new Promise<any>(resolve => {
                this.httpRequest("POST", url, data, (v: any) => {
                    resolve(v);
                });
            });
        }
    }

    /**节流 */
    export class Throttling {

        private isCd: boolean = false;
        private duration: number = 1;

        public static ins(c?: any): Throttling {
            if (c != null) {
                c['Throttling_instance'] = c['Throttling_instance'] || new Throttling();
                return c['Throttling_instance'];
            }
            return new Throttling();
        }

        public async wait(duration: number, firstWait = false): Promise<boolean> {
            if (this.isCd) {
                return false;
            } else {
                this.duration = duration;
                if (firstWait)
                    await this.setCd();
                else
                    this.setCd();

                return true;
            }
        }

        private async setCd() {
            this.isCd = true;
            await sleep(this.duration);
            this.isCd = false;
        }
    }

    /** 绘制图形的类型*/
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

    /** 绘制图形路径的数据结构*/
    export type GraphicsData = {
        points: number[],//矩形起始 x,y 轴坐标 | 贝赛尔曲线路径控制点的 x,y 轴坐标|线路径目标位置的 x,y 轴坐标|圆,椭圆,圆弧路径中心点的 x,y 轴坐标
        radius?: number[] | number,//矩形圆角半径|椭圆 x,y 轴半径|圆半径|圆弧弧度
        size?: number[],//矩形宽度和高度
        startEndAngles?: number[]//弧度起点和终点，从正 x 轴顺时针方向测量
        counterclockwise?: boolean,//如果为真，在两个角度之间逆时针绘制。默认顺时针
        lineWidth?: number,//线条宽度
        fillColor?: string,//填充绘画的颜色#000000
        strokeColor?: string,//笔触的颜色
    };

    /**
     * 创建绘制线路径的数据
     * @param points 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     */
    export function createGraphicLineData(d: { points: Vec2[], lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        let ps = [];
        d.points.forEach(p => {
            ps[ps.length] = p.x;
            ps[ps.length] = p.y;
        });
        return {
            points: ps,
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 创建绘制圆弧路径的数据
     * @param center 
     * @param radius 
     * @param startAngle 
     * @param endAngle 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @param counterclockwise 
     * @returns 
     */
    export function createGraphicArcData(d: { center: Vec2, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean, lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        return {
            points: [d.center.x, d.center.y],
            radius: [d.radius],
            startEndAngles: [d.startAngle, d.endAngle],
            counterclockwise: d.counterclockwise || false,
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 创建绘制椭圆路径的数据
     * @param center 
     * @param rx 
     * @param ry 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createGraphicEllipseData(d: { center: Vec2, rx: number, ry: number, lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        return {
            points: [d.center.x, d.center.y],
            radius: [d.rx, d.ry],
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 创建绘制圆路径的数据
     * @param center 
     * @param r 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createGraphicCircleData(d: { center: Vec2, r: number, lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        return {
            points: [d.center.x, d.center.y],
            radius: [d.r],
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 创建绘制矩形路径的数据
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createGraphicRectData(d: { x: number, y: number, width: number, height: number, lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        return {
            points: [d.x, d.y],
            size: [d.width, d.height],
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 创建绘制圆角矩形路径的数据
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param r 矩形圆角半径
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createGraphicRoundRectData(d: { x: number, y: number, width: number, height: number, r: number, lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        return {
            points: [d.x, d.y],
            size: [d.width, d.height],
            radius: [d.r],
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 创建绘制贝塞尔曲线路径的数据
     * @param points 两个点时创建二次贝塞尔曲线，三个点时三次贝塞尔曲线
     * @param lineWidth 
     * @param strokeColor 
     * @param fillColor 
     * @returns 
     */
    export function createBezierData(d: { points: Vec2[], lineWidth?: number, strokeColor?: string, fillColor?: string }): GraphicsData {
        let ps = [];
        d.points.forEach(p => {
            ps[ps.length] = p.x;
            ps[ps.length] = p.y;
        });
        return {
            points: ps,
            lineWidth: d.lineWidth || 0,
            strokeColor: d.strokeColor,
            fillColor: d.fillColor
        };
    }

    /**
     * 计算自定义图形相对world的uv最小最大点
     * @param cx 图形中心点x
     * @param cy 图形中心点y
     * @param width 图形宽
     * @param height 图形高
     * @param graphicsNode 
     * @returns [minx,miny,maxx,maxy]
     */
    export function getGraphicUVInWorld(cx: number, cy: number, width: number, height: number, graphicsNode: Node): number[] {
        let worldSize = view.getVisibleSize();
        //世界坐标系原点为左下角
        let p1 = graphicsNode.getComponent(UITransform).convertToWorldSpaceAR(v3(cx - width / 2, cy - height / 2));
        let p2 = graphicsNode.getComponent(UITransform).convertToWorldSpaceAR(v3(cx + width / 2, cy + height / 2));
        return [p1.x / worldSize.width, 1 - p2.y / worldSize.height, p2.x / worldSize.width, 1 - p1.y / worldSize.height];
    }

    export function string2Bytes(str: string): Uint8Array {
        const buffer = new ArrayBuffer(str?.length || 0);
        const bytes = new Uint8Array(buffer);

        str?.split('').forEach(function (str, i) {
            bytes[i] = str.charCodeAt(0);
        });

        return bytes;
    }

    export function bytes2String(bytes: Uint8Array): string {
        let sArr: string[] = [];
        bytes?.forEach(c => {
            sArr[sArr.length] = String.fromCharCode(c);
        });
        return sArr.join('');
    }

    export function string2ArrayBuffer(str: string): ArrayBuffer {
        const buffer = new ArrayBuffer(str?.length || 0);
        const bytes = new Uint8Array(buffer);

        str?.split('').forEach(function (str, i) {
            bytes[i] = str.charCodeAt(0);
        });

        return buffer;
    }

    export function arrayBuffer2String(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        return bytes2String(bytes);
    }

    export function Uint8Array2ArrayBuffer(bytes: Uint8Array): ArrayBuffer {
        const arraybuffer = new ArrayBuffer(bytes.length);
        const view = new Uint8Array(arraybuffer);
        view.set(bytes);
        return arraybuffer;
    }

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
     * 给richtext添加bbcode
     * @param text 原richtext
     * @param tags 标签列表
     */
    export function addBBCode(text: string, tags: { tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[] }[]): string;
    /**
     * 给richtext添加bbcode
     * @param text 原richtext
     * @param tag 标签
     * @param props 属性
     */
    export function addBBCode(text: string, tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[]): string;
    export function addBBCode(text: string, tags: string | { tag: string, value?: number | string | { key: string, value: any } | { key: string, value: any }[] }[], props?: number | string | { key: string, value: any } | { key: string, value: any }[]): string {
        if (tags == 'br') return `${text}<br/>`;
        if (tags instanceof Array) {
            let a = text;
            tags.forEach(t => {
                a = addBBCode(a, t.tag, t.value);
            });
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
                props.forEach(p => {
                    ps[ps.length] = no.formatString(propFormat, p);
                });

                return no.formatString(tagFormat, { tag: tags, props: ps.join(' '), content: text });
            } else
                return no.formatString(tagFormat, { tag: tags, props: '', content: text });
        }
    }
    ////////////////////////////////////给richtext添加bbcode end///////////////////////

    /**
     * 创建点击事件
     * @param target 事件响应组件和函数所在节点
     * @param comp 事件响应组件
     * @param handler 响应事件函数名
     */
    export function createClickEvent(target: Node, comp: typeof Component | string, handler: string): EventHandler {
        let a = new EventHandler();
        a.target = target;
        if (typeof comp == 'string')
            a._componentName = comp;
        else
            a._componentId = js._getClassId(comp);
        a.handler = handler;
        return a;
    }

    /**
     * 给btn添加点击事件
     * @param btn 需要添加点击事件的btn
     * @param target 事件响应组件和函数所在节点
     * @param comp 事件响应组件
     * @param handler 响应事件函数名
     * @param exclusive 独占，默认true，即btn中只有当前添加的事件
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

    export function SPEncrypt1_0_Encrypt1(b: any) {
        if (b == null) return '';
        b = ToUTF8(b);
        for (var e = Math.floor(1e8 * 1), d = (b.length >> 2) + (0 < b.length % 4 ? 1 : 0), c = [], a = 0; a < d; a++)
            (c[a] = b[4 * a] | (b[4 * a + 1] << 8) | (b[4 * a + 2] << 16) | (b[4 * a + 3] << 24)), (c[a] ^= e);
        c[d] = e;
        b = [];
        for (a = 0; a <= d; a++)
            (b[4 * a] = c[a] & 255), (b[4 * a + 1] = (c[a] >> 8) & 255), (b[4 * a + 2] = (c[a] >> 16) & 255), (b[4 * a + 3] = (c[a] >> 24) & 255);
        return bytes2String(b);
    }

    export function ToUTF8(str: string) {
        if (str == null) return [];
        var result = new Array();
        var k = 0;
        for (var i = 0; i < str.length; i++) {
            var j = encodeURI(str[i]);
            if (j.length == 1) {
                // 未转换的字符
                result[k++] = j.charCodeAt(0);
            } else {
                // 转换成%XX形式的字符
                var bytes = j.split('%');
                for (var l = 1; l < bytes.length; l++) {
                    result[k++] = parseInt('0x' + bytes[l]);
                }
            }
        }
        return result;
    }


    export function pathjoin(...args: string[]) {
        let a: string[] = [];
        for (let i = 0, l = args.length; i < l; i++) {
            if (args[i])
                a[a.length] = args[i].replace('/', '').replace('\\', '').replace(/(\/|\\\\)$/, "");
        }
        return a.join('/');
    }

    export function getFileName(path: string): string {
        return path.substring(path.lastIndexOf('/') + 1);
    }

    /**
     * 单例类
     */
    export class SingleObject {
        private static _ins: any;

        protected static instance(): any {
            if (!this._ins) this._ins = new this();
            return this._ins;
        }

        /**由SingleObjectManager调用，清理对象中缓存的数据 */
        public clear() { }
    }

    /**
     * 单例对象管理器
     */
    export class SingleObjectManager {
        private static _singleObjects: any[] = [];
        public static register(singleObject: any) {
            this._singleObjects[this._singleObjects.length] = singleObject;
        }
        public static clear() {
            this._singleObjects.forEach(so => {
                so['_ins']?.clear();
                so['_ins'] = null;
            });
        }
    }

    /**
     * 判断目标是否可用
     * @param target 
     * @returns 
     */
    export function checkValid(target: any): boolean {
        if (target == undefined || target == null) return false;
        if (target instanceof CCObject) return isValid(target, true);
        return true;
    }

    /**
     * 安全赋值，会先判断target是否存在
     * @param target 
     * @param key 
     * @param value 
     */
    export function setValueSafely(target: Component | any, data: { [k: string]: any }) {
        if (!checkValid(target)) return;
        for (const key in data) {
            target[key] = data[key];
        }
    }

    /**网速计算类 */
    export class NetworkSpeed {
        private _lastLoaded: number[];
        constructor() {
            this._lastLoaded = [0];
        }

        public calculateNetworkSpeedAndRemainSeconds(loaded: number, total: number): number[] {
            const now = sys.now();
            if (this._lastLoaded[0] == 0) {
                this._lastLoaded[0] = loaded;
                this._lastLoaded[1] = now;
                return null;
            }
            const t = (now - this._lastLoaded[1]) / 1000;
            if (t < 1) return null;
            let a: number[] = [];
            const sub = (loaded - this._lastLoaded[0]) / t;
            a[0] = sub;
            a[1] = Math.ceil((total - loaded) / sub);
            this._lastLoaded[0] = loaded;
            this._lastLoaded[1] = now;
            return a;
        }

        public static formatNetworkSpeed(v: number, unit = ['B', 'KB', 'MB']): string {
            let i = 0, s: string = '';
            while (1) {
                if (v < 1024 || i == (unit.length - 1)) {
                    s = Math.floor(v * 100) / 100 + unit[i];
                    break;
                }
                v /= 1024;
                i++;
            }
            return s;
        }
    }

    /**
     * 设置节点可渲染标志
     * @param node 
     * @param v 
     * @returns 
     */
    export function visible(node: Node, v?: boolean): boolean {
        if (!checkValid(node)) return false;
        if (!EDITOR) {
            if (v != undefined && node.active != v) {
                node.active = v;
            }
            return node.active;
        }


        /**
         * 因为node设置active的同时还会执行一些生命周期方法，这些方法里会有一些逻辑处理，
         * 单纯的不渲染而不执行生命周期方法会导致一些逻辑问题，所以不能以这种方案来优化性能
         */
        if (node['__origin_x__'] == null) {
            node['__origin_x__'] = no.x(node);
        }
        //原生不支持，小游戏支持
        if (v != undefined) {
            node['yj_need_render'] = v;
            if (v) {
                if (!node.active) node.active = true;
            }
            if (!EDITOR) {
                no.x(node, !v ? 20000 : node['__origin_x__']);
                const blockInputEvents = node.getComponent(BlockInputEvents);
                if (blockInputEvents)
                    blockInputEvents.enabled = v;
                const btn = node.getComponent('YJButton');
                if (btn)
                    btn['canClick'] = v;
            }
            node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }
        return node['yj_need_render'] !== false;
    }

    /**
     * 该方法适用于不需要调用onEnable，onDisable方法的情况，如在scrollview中不在可显示区域内的节点或是移到屏幕外的节点
     * 设置节点可渲染标志
     * @param node 
     * @param v 
     * @returns 
     */
    export function visibleByOpacity(node: Node, v?: boolean): boolean {
        if (!checkValid(node)) return false;
        // if (NATIVE) {
        //     if (v != undefined)
        //         node.active = v;
        //     return node.active;
        // }
        if (v != undefined) {
            node['yj_need_render'] = v;
            const uiopacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
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

                const btn = node.getComponent('YJButton');
                if (btn) btn['canClick'] = v;
                onVisibleChange(node, v);
            }
            node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }
        return node['yj_need_render'] !== false;
    }

    function onVisibleChange(node: Node, v: boolean) {
        const arr: any[] = node.getComponentsInChildren('YJOnVisibleChange');
        arr.forEach(a => {
            a.changeVisible(v);
        });
    }

    /**
     * 节点包围盒类
     * 获取节点包围盒通常用UITransform.getBoundingBoxToWorld()，
     * 如果计算不准确，可用本类
     */
    export class NodeBoundingBox {
        private _targetNode: Node;
        private _rect: Rect;
        constructor(targetNode: Node) {
            this._targetNode = targetNode;
            this._rect = targetNode.getComponent(UITransform).getBoundingBox();
            this._rect.center = v2();
        }

        public static new(targetNode: Node): NodeBoundingBox {
            return new NodeBoundingBox(targetNode);
        }

        public onAddChild(child: Node) {
            this.updateRect(no.size(child), no.position(child));
        }

        public getOriginRect(): Rect {
            return this._rect.clone();
        }

        /**
         * 父坐标系下的包围盒
         * @returns 
         */
        public getRect(): Rect {
            let r = this._rect.clone(),
                pos = no.position(this._targetNode);
            r.x += pos.x;
            r.y += pos.y;
            return r;
        }

        /**
         * 世界坐标系下的包围盒
         * @param targetNode 
         * @returns 
         */
        public getRectToWorld(): Rect {
            let r = this._rect.clone();
            const pos = no.nodeWorldPosition(this._targetNode);
            r.x += pos.x;
            r.y += pos.y;
            return r;
        }

        private updateRect(size: Size, pos: Vec3) {
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
         * 父坐标系下的包围盒, 需要频繁获取请使用实例方法
         * @param targetNode 
         * @returns 
         */
        public static getRect(targetNode: Node): Rect {
            const children = targetNode.children;
            let rect = targetNode.getComponent(UITransform).getBoundingBox(),
                targetNodePos = no.position(targetNode);
            rect.center = v2();
            children.forEach(child => {
                const size = no.size(child), pos = no.position(child);
                const xMin = pos.x - size.width / 2,
                    xMax = xMin + size.width,
                    yMin = pos.y - size.height / 2,
                    yMax = yMin + size.height;
                rect.xMin = Math.min(rect.xMin, xMin);
                rect.xMax = Math.max(rect.xMax, xMax);
                rect.yMin = Math.min(rect.yMin, yMin);
                rect.yMax = Math.max(rect.yMax, yMax);
            });
            rect.x += targetNodePos.x;
            rect.y += targetNodePos.y;
            return rect;
        }

        /**
         * 世界坐标系下的包围盒, 需要频繁获取请使用实例方法
         * @param targetNode 
         * @returns 
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

    export function materialHasProperty(material: Material, techniqueIdx: number, passIdx: number, propertyKey: string): boolean {
        return material.effectAsset.techniques[techniqueIdx]?.passes[passIdx]?.properties[propertyKey] !== undefined;
    }

    export function addToWindowForDebug(key: string, obj: any) {
        if (DEBUG) {
            window[key] = obj;
        }
    }

    /**
     * 获取字符串字节长度
     * @param v 
     * @returns 
     */
    export function getStringByteLength(v: string): number {
        let len = 0;
        for (let i = 0, n = v.length; i < n; i++) {
            v.charCodeAt(i) < 256 ? (len += 1) : (len += 2)
        }
        return len
    }

    /**
     * 裁剪字符串
     * @param v 
     * @param maxLen 最大长度
     * @param chinese2 中文算2个字节长度
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
     * 字符串转数字数组
     * @param v like '1,2,3,4'
     * @param split 分隔符，默认为','
     * @returns 
     */
    export function stringToNumberArray(v: string, split = ','): number[] {
        const a = v.split(split);
        let b: number[] = [];
        a.forEach(c => {
            b[b.length] = Number(c);
        });
        return b;
    }

    /**
     * 垃圾回收
     */
    export function GC() {
        warn('触发GC，进行垃圾回收');
        if (sys.platform == sys.Platform.WECHAT_GAME)
            window['wx'].triggerGC();
        else
            sys.garbageCollect();
    }

    /**
     * 创建一个基础节点,Layers.Enum.UI_2D,添加了UITransform组件
     * @param name 节点名
     * @param components 需要添加的组件
     * @returns 
     */
    export function newNode(name?: string, components?: typeof Component[] | string[]): Node {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        n.addComponent(UITransform);
        if (components) {
            components.forEach(c => {
                n.addComponent(c);
            });
        };
        return n;
    }

    /**
     * 创建敏感词检测库
     * @param words 
     * @returns 
     */
    export function createSensitiveWordDFA(words: string[]): any {
        const root: any = {};
        for (let word of words) {
            let node = root;
            for (let char of word) {
                node[char] = node[char] || {};
                node = node[char];
            }
            node.isEnd = true; // 存储敏感词本身
        }
        return root;
    }
    /**
     * 检测敏感词
     * @param text 需要检测的内容
     * @param dfa 敏感词库
     * @returns 检测出的敏感词或空字符串
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
                    // 找到敏感词结尾的节点
                    strs[strs.length] = text.substring(j, i + 1);
                    j = i;
                    break;
                }
            }
        }
        return strs;
    }

    /**
     * 获取原型对象
     * @param target 可以是实例或对象
     * @param propertyKey 属性key
     * @returns 
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
     * 在原型上添加自定义属性
     * @param target 
     * @param properties 
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
     * 获取class的原型对象
     * @param clazz 
     * @param propertyKey 属性key
     * @returns 
     */
    export function getClassPrototype(clazz: any, propertyKey?: string) {
        const a = clazz?.prototype;
        if (propertyKey != null) return a?.[propertyKey];
        return a;
    }

    /**
     * 在class的原型上添加自定义属性
     * @param clazz 
     * @param properties 
     */
    export function setClassPrototype(clazz: any, properties: { [k: string]: any }) {
        if (clazz) {
            js.mixin(clazz.prototype, properties);
        }
    }

    /**
     * 检测target的原型属性propertyKey的值是否等于val
     * @param target 
     * @param propertyKey 
     * @param val 
     * @returns 
     */
    export function isPrototypeEquals(target: any, propertyKey: string, val: any) {
        return getPrototype(target, propertyKey) == val;
    }

    /**
     * 在编辑器模式下获取资源
     */
    export namespace EditorMode {

        /**
         * 获取资源信息
         * @param param 可以是uuid/url/path
         * @returns AssetInfo
         */
        export async function getAssetInfo(param: string) {
            return Editor.Message.request('asset-db', 'query-asset-info', param);
        }

        /**
         * 获取资源元数据
         * @param url 资源url
         * @returns IAssetMeta
         */
        export async function getAssetMeta(url: string) {
            return Editor.Message.request('asset-db', 'query-asset-meta', url);
        }

        /**
         * 获取所有ccType类型的资源信息
         * @param ccType 如：'cc.SpriteFrame'
         * @returns AssetInfo[]
         */
        export async function getAssetInfosByCCType(ccType: string) {
            return Editor.Message.request('asset-db', 'query-assets', { ccType: ccType });
        }

        /**
         * 获取所有包信息
         * @returns AssetInfo[]
         */
        export async function getBundleInfos() {
            return Editor.Message.request('asset-db', 'query-assets', { isBundle: true });
        }

        /**
         * 根据uuid获取资源url
         * @param uuid 
         * @returns 
         */
        export async function getAssetUrlByUuid(uuid: string) {
            return getAssetInfo(uuid).then(info => {
                return info?.url;
            });
        }

        /**
         * 根据url获取资源uuid
         * @param url 
         * @returns 
         */
        export async function getAssetUuidByUrl(url: string) {
            return getAssetInfo(url).then(info => {
                return info?.uuid;
            });
        }

        /**
         * 获取资源
         * @param url 资源url
         * @param type 资源类型
         * @returns Asset
         */
        export async function loadAnyFile<T extends Asset>(url: string) {
            const uuid = await getAssetUuidByUrl(url);
            if (!uuid) {
                return null;
            }
            return new Promise<T>(resolve =>
                assetBundleManager.loadByUuid<T>(uuid, asset => resolve(asset))
            );
        }

        /**
         * 加载图集资源
         * @param urls 资源url数组
         * @returns 
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
            });
        }

        export async function loadAssetInfosOfCCTypeUnderFolder(folderUrl: string, ccType: string) {
            return getAssetInfosByCCType(ccType).then((infos: any[]) => {
                let a: _AssetInfo[] = [];
                infos.forEach(info => {
                    if (info.url.indexOf(folderUrl) > -1) a[a.length] = info;
                });
                return a;
            });
        }

        /**
         * 获取指定文件夹下的所有指定类型的资源
         * @param folderUrl 文件夹路径
         * @param ccType 资源类型如：'cc.SpriteAtlas'
         * @returns 
         */
        export async function loadAssetsOfCCTypeUnderFolder(folderUrl: string, ccType: string) {
            return getAssetInfosByCCType(ccType).then((infos: any[]) => {
                let aa = [];
                infos.forEach(a => {
                    if (a['url'].indexOf(folderUrl) > -1) {
                        aa[aa.length] = { uuid: a.uuid };
                    }
                });
                if (!aa.length) {
                    return [];
                }
                return new Promise<any>(resolve => {
                    assetBundleManager.loadAnyFiles(aa, null, items => {
                        resolve(items);
                    });
                });
            });
        }

        /**
         * 根据资源名称和类型获取资源信息
         * @param name 资源名称
         * @param ccType 资源类型如：'cc.SpriteAtlas'
         * @returns AssetInfo
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
         * 获取指定文件夹下的所有包名
         * @param folderUrl 文件夹路径
         * @returns string[]
         */
        export async function getBundlesUnderFolder(folderUrl: string) {
            return getBundleInfos().then(infos => {
                let bundles: string[] = [];
                infos.forEach(info => {
                    if (info.url.indexOf(folderUrl) == 0)
                        bundles[bundles.length] = info.name;
                });
                return bundles;
            });
        }

        /**
         * 通过资源的url获取包名
         * @param url 任意资源的url
         * @returns string[]
         */
        export async function getBundleName(url: string) {
            return getBundleInfos().then(infos => {
                for (let i = 0, n = infos.length; i < n; i++) {
                    if (url.indexOf(infos[i].url) == 0)
                        return infos[i].name;
                }
                return null;
            });
        }
    }

    /**
     *  hash算法
     * @param str 
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
     * 公式计算，如：evalFormula('sin(1.57) + 1'), evalFormula('1 + 2 * 3'), evalFormula('180/PI')
     * 其中数学函数或常量不需要加Math前缀，如：PI, sin, cos, tan, sqrt, log, abs, ceil, floor, round, max, min, random, pow
     */
    export function evalFormula(formula: string) {
        //去掉formula内所有空格
        formula = formula.replace(/\s/g, '');
        let a = splitFormula(formula);
        if (typeof a == 'string') {
            return -Number(a.replace('_', ''));
        }
        return a;
    }

    /**
     * 获取字符串中两个字符串之间的内容
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

    function splitFormula(formula: string) {
        const r = Number(formula);
        if (!isNaN(r)) return r;
        //检测有没有math函数，需要支持什么函数可在mathFuncs中添加
        const mathFuncs = ['sin', 'cos', 'tan', 'sqrt', 'log', 'abs', 'ceil', 'floor', 'round', 'max', 'min', 'random', 'pow'];
        for (let i = 0, n = mathFuncs.length; i < n; i++) {
            const func = mathFuncs[i];
            const idx = formula.indexOf(func);
            if (idx > -1) {
                const sss = getStringBetween(formula, '(', ')', idx);
                const args: any[] = sss.split(',');
                args.forEach((a, i) => {
                    const b = splitFormula(a);
                    if (typeof b == 'string' && b.startsWith('_'))
                        args[i] = b.replace('_', '-');
                    else
                        args[i] = b;
                });
                const a = Math[func](...args);
                return splitFormula(formula.replace(`${func}(${sss})`, `${a}`));
            }
        }

        //检测有没有数学常量，需要支持什么常量可在mathConsts中添加
        const mathConsts = ['PI', 'E'];
        for (let i = 0, n = mathConsts.length; i < n; i++) {
            const c = mathConsts[i];
            const idx = formula.indexOf(c);
            if (idx > -1) {
                const a = Math[c];
                return splitFormula(formula.replace(c, `${a}`));
            }
        }

        //检测有没有括号
        const s = getStringBetween(formula, '(', ')');
        if (s) {
            const n = splitFormula(s);
            formula = formula.replace(`(${s})`, `${n}`);
            return splitFormula(formula);
        }
        const ops = ['+', '-', '*', '/'];
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            let j = formula.indexOf(op);
            if (j > -1) {
                let n1: any = formula.substring(0, j);
                let n2: any = formula.substring(j + 1);
                if (isNaN(Number(n1))) {
                    //如果_开头，则替换为-
                    if (n1.startsWith('_')) {
                        n1 = n1.replace('_', '-');
                    } else
                        n1 = splitFormula(n1);
                }
                if (isNaN(Number(n2))) {
                    //如果_开头，则替换为-
                    if (n2.startsWith('_')) {
                        n2 = n2.replace('_', '-');
                    } else
                        n2 = splitFormula(n2);
                }
                let a: number;
                switch (op) {
                    case '+':
                        a = Number(n1) + Number(n2);
                        break;
                    case '-':
                        a = Number(n1) - Number(n2);
                        break;
                    case '*':
                        a = Number(n1) * Number(n2);
                        break;
                    case '/':
                        a = Number(n1) / Number(n2);
                        break;
                }
                //如果a是负数，则加上_，如-1变成_1
                if (a < 0) return '_' + (-a);
                return a;
            }
        }
    }
}
no.addToWindowForDebug('no', no);