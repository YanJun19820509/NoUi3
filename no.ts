import { dateUtils } from "./extend/dateUtils";
import { RelationQuery } from "./extend/RelationQuery";
import { sysTime } from "./extend/sysTime";
import {
    Component, DEBUG, EDITOR, EventHandler, Material,
    WECHAT, ccclass,
    game, isValid, js, macro, property, sys, Node, EventTarget, _AssetInfo, Button,
    CCObject,
    Toggle, JSB,
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
        if (v === undefined) v = DEBUG;
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

    /**
     * 事件系统
     */
    export class Event {
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
     * 遍历数组或对象
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
    export function forEach(d: Array<any> | Object, func: (k: any, v: any) => boolean) {
        if (d == null) return;
        if (d instanceof Array) {
            for (let i = 0; i < d.length; i++) {
                if (func(i, d[i]) === true) break;
            }
        } else if (d instanceof Object) {
            for (const key in d) {
                if (func(key, d[key]) === true) break;
            }
        }
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
                    let t = dateUtils.zeroTimestamp() + time;
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
            forEach(json, (key, value) => {
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
}
no.addToWindowForDebug('no', no);
