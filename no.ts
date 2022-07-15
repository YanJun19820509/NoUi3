
import { _decorator, Component, Node, EventHandler, game, color, Color, Vec2, AnimationClip, Asset, assetManager, AssetManager, AudioClip, director, instantiate, JsonAsset, Material, Prefab, Rect, Size, sp, SpriteAtlas, SpriteFrame, TextAsset, Texture2D, TiledMapAsset, Tween, v2, v3, Vec3, UITransform, tween, UIOpacity, Quat, EventTarget, EffectAsset, Vec4, v4, view, __private, js } from 'cc';
import { EDITOR, WECHAT } from 'cc/env';
import { AssetInfo } from '../../extensions/auto-create-prefab/@types/packages/asset-db/@types/public';

const { ccclass, property } = _decorator;

export namespace no {
    class Event {
        private _map: any;

        constructor() {
            this._map = {};
        }

        public on(type: string, handler: Function, target?: any): void {
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
            let a: { h: Function, t: any, o: boolean }[] = this._map[type];
            if (!a) return;
            a.forEach(b => {
                b.h.apply(b.t, args);
            });
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
    }
    /**
    * 消息系统
    */
    export const evn = new Event();

    class State {
        private _states: any;
        private _watchers: any;

        constructor() {
            this._states = {};
            this._watchers = {};
        }

        public set(type: string, value?: any): void {
            this._states[type] = { v: value, t: Date.now() };
        }

        public on(type: string, target: Component) {
            this._watchers[type] = this._watchers[type] || {};
            this._watchers[type][target.uuid] = Date.now();
        }


        public off(type: string, target: Component) {
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

        public check(type: string, target: Component): { state: boolean, value?: any } {
            let c = { state: false, value: null };
            let b: { v: any, t: number } = this._states[type];
            if (!b) return c;
            let a = this._watchers[type];
            if (!a) {
                this._watchers[type] = {};
            } else if (a[target.uuid] == b.t) return c;
            this._watchers[type][target.uuid] = b.t;
            c.state = true;
            c.value = b.v;
            return c;
        }

        public async checkTrue(type: string, target: Component): Promise<any> {
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

        public get now(): number {
            return this._time;
        }

        public set now(v: number) {
            this._time = v;
        }

        constructor() {
            this._time = Math.floor((new Date()).getTime() / 1000);
            setInterval(() => {
                this._time++;
            }, 1000);

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


        public static execute(handlers: EventHandlerInfo[], ...args: any[]): void {
            if (handlers.length == 0) return;
            handlers.forEach(handler => {
                handler.execute.apply(handler, args);
            });
        }

        public execute(...args: any[]): void {
            this.handler.emit(args);
        }
    }

    /**debug用时间日志 */
    @ccclass('TimeWatcher')
    export class TimeWatcher {
        public static get new(): TimeWatcher {
            return new TimeWatcher();
        }

        private t: number;
        constructor() {
            this.t = timestampMs();
            err('TimeWatcher', 'start', this.t);
        }

        public blink(Evn?: string): void {
            let t = timestampMs();
            err('TimeWatcher', Evn || 'blink', t, t - this.t);
            this.t = t;
        }
    }

    export function log(...Evns: any[]): void {
        console.log.call(console, '#NoUi#', Evns);
    }

    export function err(...Evns: any[]): void {
        console.error.call(console, '#NoUi#', Evns);
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

    export async function emitAndOnceCallbackAsync(emitType: string, callbackType: string, args?: any[], target?: any): Promise<any> {
        return new Promise<any>(resolve => {
            this.emitAndOnceCallback(emitType, callbackType, resolve, args, target);
        });
    }

    /**
     * 等待事件
     * @param type 事件类型
     * @param target
     * @param arg 标识，当事件触发时会将这个值返回
     */
    export async function waitForEvent(type: string, target?: any, arg?: any): Promise<any> {
        return new Promise<any>(resolve => {
            evn.once(type, () => {
                resolve(arg);
            }, target);
        });
    }

    /**
     * 等待方法成立
     * @param express 
     * @returns 
     */
    export async function waitFor(express: (dt?: number) => boolean, comp: Component): Promise<void> {
        return new Promise<void>(resolve => {
            this.callUntil(express, resolve, comp);
        });
    }

    /**
     * 等待有返回值的事件
     * @param type 
     * @param target 
     * @returns 
     */
    export async function waiForEventValue(type: string, target?: any): Promise<any> {
        return new Promise<any>(resolve => {
            evn.once(type, resolve, target);
        });
    }

    /**
     * 等待事件返回值与预期值相等
     * @param type 
     * @param equalValue 预期值
     * @param target 
     * @returns 
     */
    export async function waiForEventValueEqual(type: string, equalValue: any, target?: any): Promise<void> {
        return new Promise<void>(resolve => {
            evn.on(type, (v: any) => {
                if (v == equalValue) {
                    evn.typeOff(type);
                    resolve();
                }
            }, target);
        });
    }

    export function callUntil(express: (dt?: number) => boolean, callback: () => void, comp: Component): void {
        if (!comp?.isValid) return;
        comp?.scheduleOnce((dt: number) => {
            if (express(dt)) {
                callback?.();
            } else callUntil(express, callback, comp);
        });
    }

    /**
     * 根据模板格式化字符串
     * @param formatter 模板，如'{a}:{b}:{c}' {0}:{1}:{2}
     * @param data 需要替换的数据，如{'a':1,'b':2,'c':3}，返回1:2:3  [1,2,3] 1:2:3
     */
    export function formatString(formatter: string, data: any[] | object): string {
        var s = formatter;
        let keys = Object.keys(data);
        keys.forEach(k => {
            s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), data[k]);
        });
        return s;
    }

    export function evalFormateStr(formatter: string, data: any) {
        let str = this.formatString(formatter, data);
        return this.eval(str);
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
        if (n < 1000) return String(n);
        let unit = ['k', 'm', 'b'];
        var a = '';
        let s = String(n);
        let len = s.length;
        let l = len % 3;
        if (l == 1) {
            a = s[0] + '.' + s[1];
        } else {
            a = s[0] + s[1] + (l == 0 ? s[2] : '');
        }
        return a + unit[Math.floor(len / 3) - 1 - (l == 0 ? 1 : 0)];
    }

    /**
     * 从数组里随机n个元素
     * @param arr
     * @param n
     */
    export function arrayRandom(arr: any, n = 1): any {
        if (!arr || arr.length == 0) return null;
        if (arr.length == 1) return arr[0];
        let a = [].concat(arr);
        let c = [];
        for (var i = 0; i < n; i++) {
            let al = a.length;
            if (al == 0) break;
            let b = Math.floor(Math.random() * al);
            c = [].concat(c, a.splice(b, 1));
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
        return this.getValue(data, k) || def
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
        this.setValue(data, k, value)
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
        return this.joinStrings('.', ...strs);
    }

    /**
     * 将一维数组转成2维数组
     * @param array 原数组
     * @param num 子数组最大长度
     */
    export function arrayToArrays(array: any[], num: number): any[] {
        var dd = [];
        let length = Math.ceil(array.length / num);
        for (var ii = 0; ii < length; ii++) {
            dd[ii] = [];
            for (var jj = 0; jj < num; jj++) {
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
        if (array == null) return -1;
        let len = array.length;
        for (let i = 0; i < len; i++) {
            if (array[i][key] == item || (array[i][key] == item[key] && item[key] != undefined)) {
                return i;
            }
        }
        return -1;
    }

    export function itemOfArray<T>(array: any[], value: any, key: string): T {
        let i = this.indexOfArray(array, value, key);
        if (i == -1) return null;
        return array[i];
    }

    export function addToArray(array: any[], value: any, key?: string): void {
        if (key == null && array.indexOf(value) == -1) {
            array[array.length] = value;
        } else if (key != null && this.indexOfArray(array, value, key) == -1) {
            array[array.length] = value;
        }
    }

    /**
     * 在数据后插入新数据
     * @param array
     * @param value
     */
    export function pushToArray(array: any[], value: any): void {
        if (value == null) return;
        array[array.length] = value;
    }

    export function removeFromArray(array: any[], value: any, key?: string): void {
        let i = -1;
        if (key == null) {
            i = array.indexOf(value);
        } else {
            i = this.indexOfArray(array, value, key);
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
     * 遍历kv对象
     * @param d kv对象
     * @param func return true时终止遍历
     */
    export function forEachKV(d: any, func: (k: any, v: any) => boolean) {
        if (d == null) return;
        let keys = Object.keys(d);
        for (const key of keys) {
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
     * 创建一个EventHandler
     * @param target
     * @param component
     * @param handler
     * @param arg
     */
    export function createEventHandler(target: Node, component: string, handler: string, arg = ''): EventHandler {
        let a = new EventHandler();
        a.target = target;
        a.component = component;
        a.handler = handler;
        a.customEventData = arg;
        return a;
    }

    /**克隆 */
    export function clone(d: any): any {
        if (d instanceof Array) return JSON.parse(JSON.stringify(d));
        else if (d instanceof Object) return instantiate(d);
        else return d;
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
            if (component != null) {
                component.scheduleOnce(resolve, duration);
            } else {
                window.setTimeout(resolve, duration * 1000);
            }
        });
    }

    // 两个数相除百分比
    export function twoNumPercentage2Num(min, max, maxNum) {
        if (min > max) {
            min = max;
        }
        return Math.floor(min / max * maxNum);
    }

    /**
     * 取两值之间的随机值
     * @param min
     * @param max
     */
    export function randomBetween(min: number, max: number): number {
        if (min == max) return min;
        if (min == null || max == null) return min || max;
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 将秒数解析为日时分秒
     * @param v 总秒数
     */
    export function parseSeconds(v: number): { d: number, h: number, M: number, s: number } {
        let d = Math.floor(v / 86400);
        let h = Math.floor(v / 3600) % 24;
        let M = Math.floor((v % 3600) / 60);
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
        return Math.floor(a.getTime() / 1000) + v;
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
        return Math.floor(a.getTime() / 1000) + v;
    }

    /**转换为当前零点时间戳（秒） */
    export function toZeroTimestamp(v: number): number {
        let a = new Date(v * 1000);
        a.setHours(0, 0, 0, 0);
        return Math.floor(a.getTime() / 1000);
    }

    /**
     * 将时间长度转成时分秒
     * @param time 时间长度，秒
     * @returns x小时x分x秒
     */
    export function time2LocalFormat(time: number): string {
        let h: number, m: number, s: number;
        h = Math.floor(time / 3600);
        m = Math.floor((time % 3600) / 60);
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
        h = Math.floor(seconds / 3600);
        m = Math.floor((seconds % 3600) / 60);
        s = seconds % 60;
        let a = '';
        if (h > 0) a = `${h}`;
        if (m > 0) a = `${a}`;
        if (s > 0) a = `${a}`;
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
            return this.formatString(formatter, { h: a, m: a, s: a });
        }
        let d = Math.floor(sec / 3600 / 24);
        let h = Math.floor(sec / 3600) % 24;
        if (d > 0) {
            // todo i18n
            formatter = `{d}{h}`;
            return this.formatString(formatter, { h: h, d: d });
        }

        let m: any = Math.floor(sec / 60 % 60);
        let s: any = Math.floor(sec % 60);

        // if (h<=9){h = `0${h}`}
        if (m <= 9 && show0) { m = `0${m}` }
        if (s <= 9 && show0) { s = `0${s}` }

        return formatString(formatter, { h: h, m: m, s: s });
    }

    function formatSeconds(sec: number, formatter: string, show0: boolean): string {
        if (sec <= 0) {
            let a = show0 ? '00' : '0';
            return formatString(formatter, { h: a, M: a, s: a });
        }
        let h: any, m: any, s: any;
        h = Math.floor(sec / 3600);
        m = Math.floor((sec % 3600) / 60);
        s = sec % 60;
        if (m <= 9 && show0) { m = `0${m}`; }
        if (s <= 9 && show0) { s = `0${s}`; }
        return formatString(formatter, { h: h, M: m, s: s });
    }

    function formatTime(sec: number, formatter: string, show0: boolean): string {
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
        return formatTime(sec, '{y}.{m}.{d} {h}:{M}:{s}', show0);
    }

    export function formatTime_yymmdd(sec: number, show0 = true): string {
        return formatTime(sec, '{y}.{m}.{d}', show0);
    }

    export function formatTime_hhMMss(sec: number, show0 = true): string {
        return formatSeconds(sec, '{h}:{M}:{s}', show0);
    }

    export function formatTime_hhMM(sec: number, show0 = true): string {
        return formatSeconds(sec, '{h}:{M}', show0);
    }

    export function formatTime_MMss(sec: number, show0 = true): string {
        return formatSeconds(sec, '{M}:{s}', show0);
    }

    export function formatTime_ss(sec: number, show0 = true): string {
        return formatSeconds(sec, '{s}', show0);
    }

    /**
     * 节点的世界坐标
     * @param node
     */
    export function nodeWorldPosition(node: Node, out?: Vec3): Vec3 {
        out = out || v3();
        node.parent.getComponent(UITransform).convertToWorldSpaceAR(node.position, out);
        return out;
    }

    /**
     * 某节点坐标转换到另一个节点内
     * @param node
     * @param otherNode
     */
    export function nodePositionInOtherNode(node: Node, otherNode: Node, out?: Vec3): Vec3 {
        out = out || v3();
        let p = this.nodeWorldPosition(node, out);
        otherNode.getComponent(UITransform).convertToNodeSpaceAR(p, out);
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
        origin = this.nodeWorldPosition(node, origin);
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
        let rect = this.nodeBoundingBox(node, offset, subSize);
        return rect.contains(point);
    }

    /**
     * 判断两个节点是否相交
     * @param node
     * @param otherNode
     * @returns
     */
    export function nodeIntersects(node: Node, otherNode: Node): boolean {
        let rect = this.nodeBoundingBox(node),
            rect1 = this.nodeBoundingBox(otherNode);
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
    export function weightRandom(weight: number[]): number {
        let sum = 0;
        weight.forEach(w => {
            sum += w;
        });
        let r = Math.random() * sum;
        let n = weight.length;
        let a = 0;
        for (let i = 0; i < n; i++) {
            if (weight[i] == 0) continue;
            a += weight[i];
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
        let a: number[] = [];
        weight.forEach(item => {
            a[a.length] = Number(item[key]);
        });
        return this.weightRandom(a);
    }

    export enum TweenSetType {
        Node = 'node',
        Transform = 'transform',
        Opacity = 'opacity'
    }

    export class TweenSet {

        private map: any;
        constructor(node: Node) {
            this.map = {};
            this.map[TweenSetType.Node] = tween(node);
            this.map[TweenSetType.Transform] = node.getComponent(UITransform) ? tween(node.getComponent(UITransform)) : null;
            this.map[TweenSetType.Opacity] = node.getComponent(UIOpacity) ? tween(node.getComponent(UIOpacity)) : null;
        }

        public start(): Promise<void> {
            return new Promise<void>(resolve => {
                for (const key in this.map) {
                    let t: Tween<unknown> = this.map[key];
                    if (key == TweenSetType.Node) {
                        t.call(resolve).start();
                    } else
                        t?.start();
                }
            });
        }

        public stop() {
            for (const key in this.map) {
                let t: Tween<unknown> = this.map[key];
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
                            np['scale'] = new Vec3(v[0], v[1], v[2]);
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

                if (data.by) {
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].by(data.duration, np, { easing: data.easing });
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.by(data.duration, tp, { easing: data.easing });
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.by(data.duration, op, { easing: data.easing });
                } else if (data.to) {
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].to(data.duration, np, { easing: data.easing });
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.to(data.duration, tp, { easing: data.easing });
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.to(data.duration, op, { easing: data.easing });
                } else if (data.set) {
                    if (np) this.map[TweenSetType.Node] = this.map[TweenSetType.Node].set(np);
                    if (tp) this.map[TweenSetType.Transform] = this.map[TweenSetType.Transform]?.set(tp);
                    if (op) this.map[TweenSetType.Opacity] = this.map[TweenSetType.Opacity]?.set(op);
                }
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
            if (v < 0) v = 999;
            for (const key in this.map) {
                this.map[key] = this.map[key]?.repeat(v, this.map[key]);
            }
        }

        public static play(tweenSet: TweenSet | TweenSet[], endCall?: () => void) {
            if (tweenSet instanceof Array) {
                tweenSet.forEach((t, i) => {
                    if (i == 0)
                        t.start().then(endCall);
                    else t.start();
                });
            } else tweenSet.start().then(endCall);
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
     *      easing?: 'quadIn',
     *      repeat?: 0,//-1是无限次，>-1为执行次数为 repeat+1
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
     * 注解 用于向类中添加元数据.
     * @param key 元数据key
     * @param value 元数据值
     * @returns
     */
    export function addMeta(key: string, value: string) {
        return function (target: Function) {
            target.prototype[key] = value;
        };
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
     * 获取或设置节点宽
     * @param node 节点
     * @param width 为空时则返回当前宽；否则修改当前宽
     * @returns
     */
    export function width(node: Node, width?: number): number {
        if (!node) return;
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
        if (!node) return;
        if (height != undefined)
            node.getComponent(UITransform).height = height;
        return node.getComponent(UITransform).height;
    }

    /**
     * 获取或设置节点透明度
     * @param node 节点
     * @param opacity 为空时则返回当前opacity；否则修改当前opacity
     * @returns
     */
    export function opacity(node: Node, opacity?: number): number {
        if (!node) return;
        let op = node.getComponent(UIOpacity);
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
     * 解析带function的json字符串
     * @param s 
     * @returns 
     */
    export function parse2Json(s: string): any {
        return JSON.parse(s, function (k, v) {
            if (!WECHAT)//微信小游戏平台不支持
                if (v.indexOf && v.indexOf('function') > -1) {
                    // return eval("(function(){return " + v + " })()");
                    let FN = Function;
                    return new FN(`return ${v}`)();
                }
            return v;
        });
    }

    /**
     * 序列化带function的json对象
     * @param json 
     * @returns 
     */
    export function jsonStringify(json: any): string {
        return JSON.stringify(json, function (key, val) {
            if (!WECHAT)//微信小游戏平台不支持
                if (typeof val === 'function') {
                    return val + '';
                }
            return val;
        });
    }

    export async function getAssetUrlInEditorMode(uuid: string): Promise<string> {
        if (!EDITOR) return null;
        let info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
        return info.url;
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
        let zeroTime = zeroTimestamp(),
            now = sysTime.now,
            resetTime = (isInterval ? now : zeroTime) + time;
        let lastResetTime = JSON.parse(dataCache.getLocal('reset_data_check_time') || '{}');
        let lt = lastResetTime[dataKey] || zeroTime - 1;
        if (resetTime > lt && resetTime <= now) {
            dataCache.setLocal(dataKey, value);
            lastResetTime[dataKey] = now;
            dataCache.setLocal('reset_data_check_time', JSON.stringify(lastResetTime));
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
            return JSON.stringify(this._data);
        }

        /**将json string转成data */
        public set json(v: string) {
            this._data = JSON.parse(v);
            this.emit(Data.DataChangeEvent, this);
        }

        /**
         * 读
         * @param path
         */
        public get(paths?: string | string[]): any {
            if (this._data == null) return null;
            if (paths == null || paths == '*') return this._data;
            paths = [].concat(paths);
            if (paths.length == 1) {
                return no.getValue(this._data, paths[0]);
            } else {
                let p = paths.join('.');
                let a = no.getValue(this._data, p);
                if (!a) return null;
                return clone(a);
            }
        }
        /**
         * 写
         * @param path
         * @param value 如果value为null，则不处理
         */
        public set(path: string, value: any) {
            if (this._data == null) {
                this._data = {};
            }
            if (value instanceof Object && value['constructor'] === Object) {
                if (Object.keys(value).length == 0) {
                    no.setValue(this._data, path, value);
                } else {
                    for (let key in value) {
                        let v = value[key];
                        this.set(path + '.' + key, v);
                    }
                }
            } else {
                no.setValue(this._data, path, value);
            }
            this.handleDataChange();
        }

        private async handleDataChange() {
            if (await Throttling.ins(this).wait(0.1))
                this.emit(Data.DataChangeEvent, this);
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
            return no.deleteValue(this._data, path);
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
    class DataCache extends EventTarget {
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
         */
        public getLocal(key: string): any {
            key = `${this._localPreKey}_${key}`;
            let a = localStorage.getItem(key);
            if (a == null) return null;
            return JSON.parse(a);
        }
        /**
         * 写入本地数据
         * @param key
         * @param value
         */
        public setLocal(key: string, value: any): void {
            key = `${this._localPreKey}_${key}`;
            if (value === null)
                localStorage.removeItem(key);
            else
                localStorage.setItem(key, JSON.stringify(value));
            this.emit(key, value);
        }

        /**
         * 获取配置数据
         * @param path 如a.b.c 或[a,b,c]
         */
        public getJSON(path?: string | string[]): any {
            return this._json.get(path);
        }

        /**
         * 写入配置数据
         * @param json
         */
        public setJSON(json: Object): void {
            forEachKV(json, (key, value) => {
                this._json.set(key, value);
                return false;
            });
        }
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

    class AssetPath {
        public bundle: string;
        public file: string;
        public type: typeof Asset;

        constructor(bundle?: string, file?: string, type?: typeof Asset) {
            this.bundle = bundle;
            this.file = file;
            this.type = type;
        }
    }
    class AssetBundleManager {

        private needReleaseAssets: Asset[] = [];

        public constructor() {
            //用于设置下载的最大并发连接数，若当前连接数超过限制，将会进入等待队列。
            assetManager.downloader.maxConcurrency = 10;
            //用于设置每帧发起的最大请求数，从而均摊发起请求的 CPU 开销，避免单帧过于卡顿
            assetManager.downloader.maxRequestsPerFrame = 10;
            assetManager.downloader.maxRetryCount = 2;
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
                callback && callback(i / n);
                i < n && this._loadB(paths, i, callback);
            });
        }
        /**
         * 预加载files
         * @param bundleName
         * @param filePaths
         * @param onProgress
         */
        public preloadFiles(bundleName: string, filePaths: string[], onProgress: (progress: number) => void): void {
            let bundle = this.getBundle(bundleName);
            if (bundle == null) {
                this.loadBundle(bundleName, () => {
                    this.preloadFiles(bundleName, filePaths, onProgress);
                });
            } else {
                bundle.preload(filePaths, Asset, (finished, total, requestItem) => {
                    onProgress && onProgress(finished / total);
                }, (err, items) => {
                    if (items == null || items.length == 0) {
                        onProgress && onProgress(1);
                        no.log('preloadFiles', filePaths, err.message);
                    }
                });
            }
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
                    no.log('preloadScene', name, err.message);
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
        public loadBundle(name: string, callback: () => void): void {
            let bundle = this.getBundle(name);
            if (bundle != null) {
                callback && callback();
                return;
            }
            assetManager.loadBundle(name, (err, b) => {
                if (err != null) {
                    no.log('loadBundle', name, err);
                } else {
                    callback && callback();
                }
            });
        }
        /**
         * 获取已加载的bundle
         * @param name
         */
        public getBundle(name: string): AssetManager.Bundle {
            return assetManager.getBundle(name);
        }

        /**
         * 通用资源加载
         * @param path
         * @param type
         * @param callback
         */
        public loadFile(path: string, type: typeof Asset, callback: (asset: Asset) => void): void {
            let p = this.assetPath(path);
            this.load(p.bundle, p.file, type, (asset: Asset) => {
                callback(asset);
            });
        }
        /**
         * 加载bundle中的文件
         * @param bundleName
         * @param fileName
         * @param type
         * @param callback
         */
        private load(bundleName: string, fileName: string, type: typeof Asset, callback: (asset: Asset) => void): void {
            if (bundleName == null || bundleName == '') {
                assetManager.loadAny({ 'url': fileName, 'type': type }, (err, item) => {
                    if (item == null) {
                        no.log('load', fileName, err.message);
                    } else {
                        this.addRef(item);//增加引用计数
                        callback && callback(item);
                    }
                });
            }
            else {
                let bundle = this.getBundle(bundleName);
                if (bundle != null) {
                    bundle.load(fileName, type, (err, item) => {
                        if (item == null) {
                            no.log('load', fileName, err.message);
                        } else {
                            this.addRef(item);//增加引用计数
                            callback && callback(item);
                            this.loadDepends(item['_uuid']);
                        }
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

        public loadSpine(path: string, callback: (item: sp.SkeletonData) => void): void {
            this.loadFile(path, sp.SkeletonData, callback);
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

        public loadTiledMap(path: string, callback: (item: TiledMapAsset) => void): void {
            this.loadFile(path, TiledMapAsset, callback);
        }

        public loadMaterial(path: string, callback: (item: Material) => void): void {
            this.loadFile(path, Material, callback);
        }

        public loadEffect(path: string, callback: (item: EffectAsset) => void): void {
            this.loadFile(path, EffectAsset, callback);
        }

        // public loadDragonBonesAtlasAsset(path: string, callback: (item: dragonBones.DragonBonesAtlasAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAtlasAsset, callback);
        // }

        // public loadDragonBonesAsset(path: string, callback: (item: dragonBones.DragonBonesAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAsset, callback);
        // }

        public loadFiles<T extends Asset>(bundleName: string, filePaths: string[], onProgress: (progress: number) => void, onComplete: (items: T[]) => void): void {
            let bundle = this.getBundle(bundleName);
            bundle.load<T>(filePaths, (finished, total, requestItem) => {
                onProgress && onProgress(finished / total);
            }, (err, items) => {
                if (items == null || items.length == 0) {
                    onProgress && onProgress(0);
                    no.log('loadFiles', filePaths, err.message);
                } else {
                    items.forEach(item => {
                        this.addRef(item);//增加引用计数
                        this.loadDepends(item['_uuid']);
                    });
                    onComplete && onComplete(items);
                }
                no.log('loadFiles', items);
            });
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
            assetManager.loadRemote<T>(url, (err, file) => {
                if (file == null) {
                    no.log('loadRemoteFile', url, err.message);
                    callback && callback(null);
                } else {
                    this.addRef(file);//增加引用计数
                    callback && callback(file);
                }
            });
        }

        public loadRemoteText(url: string, callback: (file: TextAsset) => void) {
            this.loadRemoteFile<TextAsset>(url, callback);
        }

        /**
         * 获取bundle路径，文件名及文件类型
         * @param path
         * @returns  `{'bundle','file','type'}
         */
        public assetPath(path: string): AssetPath {
            let p = path.split('/');
            let file = p.pop().split('.');
            let fileName = file[0],
                fileType = file[1];
            let bundle = p.shift();
            p[p.length] = fileName;
            fileName = p.join('/');
            let a = new AssetPath(bundle, fileName);
            let s: typeof Asset;
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
                        s = Texture2D;
                        break;
                    case 'prefab':
                        s = Prefab;
                        break;
                    case 'atlas':
                        s = SpriteAtlas;
                        break;
                    case 'tmx':
                        s = TiledMapAsset;
                        break;
                }
                a.type = s;
            }
            return a;
        }

        public loadAllFilesInBundle(bundleName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let bundle = this.getBundle(bundleName);
            if (bundle != null) {
                let paths = Object.keys(bundle['_config'].paths._map);
                this.loadFiles(bundleName, paths, onProgress, onComplete);
            } else {
                this.loadBundle(bundleName, () => {
                    this.loadAllFilesInBundle(bundleName, onProgress, onComplete);
                });
            }
        }

        public preloadAllFilesInBundle(bundleName: string, onProgress: (progress: number) => void) {
            let bundle = this.getBundle(bundleName);
            if (bundle != null) {
                let paths = Object.keys(bundle['_config'].paths._map);
                this.preloadFiles(bundleName, paths, onProgress);
            } else {
                this.loadBundle(bundleName, () => {
                    this.preloadAllFilesInBundle(bundleName, onProgress);
                });
            }
        }

        public loadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                no.err(`${folderName}没有设置ab包`);
                return;
            }
            p.file += '/';
            let bundle = this.getBundle(p.bundle);
            let keys = Object.keys(bundle['_config'].paths._map);
            let paths: string[] = [];
            keys.forEach(key => {
                if (key.indexOf(p.file) == 0) {
                    paths.push(key);
                }
            });
            this.loadFiles(p.bundle, paths, onProgress, onComplete);
        }

        public preloadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void) {
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                no.err(`${folderName}没有设置ab包`);
                return;
            }
            p.file += '/';
            let bundle = this.getBundle(p.bundle);
            let keys = Object.keys(bundle['_config'].paths._map);
            let paths: string[] = [];
            keys.forEach(key => {
                if (key.indexOf(p.file) == 0) {
                    paths.push(key);
                }
            });
            this.preloadFiles(p.bundle, paths, onProgress);
        }

        public async loadFileInEditorMode<T extends Asset>(url: string, type: typeof Asset, callback: (file: T, info: AssetInfo) => void, onErr?: () => void) {
            if (!EDITOR) return;
            let info = await Editor.Message.request('asset-db', 'query-asset-info', url);
            if (!info) {
                onErr?.();
                return;
            }
            assetManager.loadAny({ 'uuid': info.uuid, 'type': type }, (err, item: T) => {
                if (err) {
                    console.log(url, err);
                    onErr?.();
                }
                else
                    callback(item, info);
            });
        }

        public async loadSpriteFrameInEditorMode(url: string, callback: (file: SpriteFrame, info: any) => void, onErr?: () => void) {
            if (!EDITOR) return;
            let info = await Editor.Message.request('asset-db', 'query-asset-info', url);
            if (!info) {
                onErr?.();
                return;
            }
            for (const key in info.subAssets) {
                let sub = info.subAssets[key];
                if (sub.type == 'cc.SpriteFrame') {
                    assetManager.loadAny({ 'uuid': sub.uuid, 'type': SpriteFrame }, (err, item: SpriteFrame) => {
                        if (err) {
                            console.log(url, err);
                            onErr?.();
                        }
                        else {
                            callback(item, sub);
                        }
                    });
                    break;
                }
            }
        }

        public loadByUuid<T extends Asset>(uuid: string, type: typeof Asset, callback?: (file: T) => void) {
            assetManager.loadAny({ 'uuid': uuid, 'type': type }, (e: Error, f: T) => {
                if (e != null) {
                    no.err(uuid, e.stack);
                }
                this.addRef(f);//增加引用计数
                callback?.(f);
            });
        }

        public addRef(asset: Asset): void {
            asset?.addRef();
        }

        public decRef(asset: Asset): void {
            asset?.decRef();
        }

        /**
         * 加载依赖的资源
         * @param uuid 依赖资源的uuid数组
         */
        private loadDepends(uuid: string) {
            let a: any[] = [];
            let list = assetManager.dependUtil.getDepsRecursively(uuid);
            if (list.length == 0) return;
            list.forEach(uuid => {
                a.push({ uuid: uuid });
            });
            assetManager.loadAny(a, (e, item) => {
                if (item == null) no.err(uuid, e.message);
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
                asset = asset._uuid;
            }
            if (typeof asset == 'string') {
                asset = asset.split('@')[0];
                asset = assetManager.assets.get(asset);
            }
            if (!asset) return;
            if (force) assetManager.releaseAsset(asset);
            else asset.decRef();
        }

        public getAssetFromCache(uuid: string): Asset {
            return assetManager.assets.get(uuid);
        }

    }

    /**全局资源管理器 */
    export const assetBundleManager = new AssetBundleManager();

    /**缓存池 */
    class CachePool {
        private cacheMap: Map<string, { o: any, t: number }[]>;
        private checkDuration = 60;
        constructor() {
            this.cacheMap = new Map<string, any[]>();
            setInterval(() => {
                this.checkClear();
            }, this.checkDuration * 500);
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
                this.clear(object);
                return;
            }
            if (!this.cacheMap.has(type)) this.cacheMap.set(type, []);
            if (object instanceof Node) {
                object.parent = null;
                object.active = false;
            }
            let a = this.cacheMap.get(type);
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
                t: no.sysTime.now + (canRelease ? 0 : 999999)
            });
            this.cacheMap.set(type, a);
        }

        public clearAll(): void {
            let types = no.MapKeys2Array(this.cacheMap);
            let n = types.length;
            for (let i = 0; i < n; i++) {
                this.clear(types[i]);
            }
        }

        public clear(type: string): void {
            let arr = this.cacheMap.get(type);
            this.cacheMap.delete(type);
            for (let i = arr.length - 1; i >= 0; i--) {
                let a = arr[i];
                this._clear(a.o);
            }
        }


        private _clear(obj: any): void {
            if (obj instanceof Node) obj.destroy();
            else if (obj instanceof Asset) no.assetBundleManager.release(obj);
            else obj = null;
        }

        private checkClear() {
            let t = no.timestamp();
            let types = no.MapKeys2Array(this.cacheMap);
            types.forEach(type => {
                let arr = this.cacheMap.get(type);
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
            this.data.set(type, v);
            this.emit(type, v, type);
        }

        public changeHint(type: string, v: number): void {
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
    }
    /**全局节点管理类 */
    export const nodeTargetManager = new NodeTargetManager();


    let units = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",];
    /**用科学计数格式表示的字符串 */
    export class ScientificString {
        private _coefficient: number = 0;
        /**指数 */
        public index: number = 0;

        constructor(v?: string | number) {
            this.value = String(v || 0);
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
                this.coefficient = float(this._coefficient + other._coefficient * Math.pow(10, other.index - this.index));
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
                this.coefficient = float(this._coefficient - other._coefficient * Math.pow(10, other.index - this.index));
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
                this.coefficient = float(this._coefficient * other._coefficient);
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
                this.coefficient = float(this._coefficient / other._coefficient);
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
                return `${Math.floor(this._coefficient * Math.pow(10, this.index))}`;
            }
            let a = Math.floor(this.index / 3),
                b = this.index % 3,
                u: string;
            if (a < 4) {
                u = ["k", "m", "b"][a - 1];
            } else {
                u = this.getUnit(a - 3);
            }
            return `${Math.floor(this._coefficient * Math.pow(10, b + 2)) / 100}${u}`;
        }

        public getUnit(a: number): string {
            let u: string;
            let len = units.length;
            a -= 1;
            if (a < len)
                u = units[a];
            else {
                let c = Math.floor(a / len);
                u = units[a % len];
                u = this.getUnit(c) + u;
            }
            return u;
        }

        public get numberValue(): number {
            return this._coefficient * Math.pow(10, this.index);
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
                return `${float(this._coefficient * Math.pow(10, this.index), digits)}`;
            }
            let a = Math.floor(this.index / step),
                b = this.index % step,
                u: string = units[a - 1];
            return `${float(this._coefficient * Math.pow(10, b), digits)}${u}`;
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
                    let a = JSON.parse(response);
                    cb?.(a);
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
                data = JSON.stringify(data);
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
        private static _instance: Throttling;

        public static ins(c?: any): Throttling {
            if (c != null) {
                c['Throttling_instance'] = c['Throttling_instance'] || new Throttling();
                return c['Throttling_instance'];
            }
            if (this._instance == null) this._instance = new Throttling();
            return this._instance;
        }

        public async wait(duration: number, firstWait = false): Promise<boolean> {
            this.duration = duration;
            return new Promise<boolean>(async (resolve, reject) => {
                if (this.isCd) {
                    resolve(false);
                } else {
                    if (firstWait)
                        await this.setCd();
                    else
                        this.setCd();

                    resolve(true);
                }
            });
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
}
