
import { EDITOR, ccclass, property, menu, Component, disallowMultiple, Node } from '../yj';
import { HackUi } from '../ui/HackUi';
import { no } from '../no';
import { YJDataWorkManager } from './YJDataWorkManager';

/**
 * Predefined variables
 * Name = YJDataWork
 * DateTime = Thu Jan 13 2022 00:14:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDataWork.ts
 * FileBasenameNoExtension = YJDataWork
 * URL = db://assets/Script/common/base/YJDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJDataWork')
@menu('NoUi/base/YJDataWork(数据处理基类)')
@disallowMultiple()
export class YJDataWork extends Component {
    /**
     * 自动注册子级FuckUi组件
     * @property 设置后会立即扫描并注册所有子节点中的FuckUi组件
     * @example
     * // 在编辑器勾选autoRegister属性
     * // 或在代码中设置：
     * this.autoRegister = true;
     */
    @property({
        displayName: '自动注册',
        tooltip: '自动注册当前节点及子节点中的所有FuckUi组件\n（编辑器设置后立即生效）'
    })
    public get autoRegister(): boolean {
        return false;
    }

    public set autoRegister(v: boolean) {
        let list = this.getComponentsInChildren(HackUi);
        for (let i = 0, n = this.subFuckUiNodes.length; i < n; i++) {
            const sub = this.subFuckUiNodes[i];
            list = list.concat(sub.getComponentsInChildren(HackUi));
        }
        for (let i = 0, n = list.length; i < n; i++) {
            const a = list[i];
            if (!a.registerNode) {
                a.registerNode = this.node;
            }
        }

        this.subFuckUis = [];
        for (let i = 0, n = list.length; i < n; i++) {
            const a = list[i];
            if (a.registerNode == this.node && a.bind_keys != '') {
                this.subFuckUis[this.subFuckUis.length] = a;
            }
        }
    }

    /** 
     * 需要注册的额外UI节点列表 
     * @example 
     * // 包含子面板的节点
     * // 包含HUD元素的节点
     */
    @property(Node)
    subFuckUiNodes: Node[] = [];

    /** 
     * 已注册的FuckUi组件列表 
     * @example
     * // 包含绑定'hp'的进度条组件
     * // 包含绑定'gold'的文本组件
     */
    @property({ type: HackUi })
    subFuckUis: HackUi[] = [];

    /**
     * 是否启用差异更新
     * 如果为true,则仅修改某key下有变更的值
     * 如果为false,则替换该key对应的全部值
     * 非差异更新性能较好,默认为true
     * @example
     * // 当需要更新复杂对象时建议关闭差异更新：
     * this.onlyDiff = false;
     * 
     * // 当需要高效更新简单数据时保持开启：
     * this.onlyDiff = true;
     */
    @property({ displayName: '差异更新', tooltip: '仅修改某key下有变更的值，否则替换该key对应全部值。非差异更新性能较好，默认true' })
    onlyDiff: boolean = true;


    /**
     * 数据键到UI组件的映射关系
     * @example
     * // 当'hp'值变化时，更新所有绑定该键的进度条和文本组件
     * this._data2ui.set('hp', [progressBar, textLabel]);
     */
    protected _data2ui: Map<string, HackUi[]> = new Map();

    /**
     * 数据存储对象（使用no.js的数据管理）
     * @example
     * // 访问当前血量值
     * const currentHP = this._data.get('hp');
     */
    protected _data: no.Data = new no.Data();

    /**
     * 组件加载状态标识
     * @example
     * // 在异步操作中检查组件是否已加载
     * if (this._loaded) {
     *     this.updateUI();
     * }
     */
    private _loaded: boolean = false;

    /**
     * 组件销毁时调用
     * 执行资源清理和反注册操作
     * @example
     * // 节点销毁时自动调用
     * node.destroy();
     */
    protected onDestroy(): void {
        YJDataWorkManager.ins().remove(this);
        this.clear();
    }

    /**
     * 组件加载时调用
     * 在编辑器中获取UI注册器组件
     * 在运行时初始化数据
     * @example
     * // 重写onLoad方法时需调用super.onLoad()
     * protected onLoad() {
     *     super.onLoad();
     *     // 自定义初始化逻辑
     * }
     */
    protected onLoad() {
        YJDataWorkManager.ins().add(this);
        this._loaded = true;
        // this.init();
    }

    /**
     * 组件启用时调用
     * 在运行时执行afterInit进行后期初始化
     * @example
     * // 在组件激活时初始化玩家数据
     * onEnable() {
     *     super.onEnable();
     *     this.initPlayerData();
     * }
     */
    onEnable() {
        if (EDITOR) return;
        this.afterInit();
    }

    /**
     * 使用指定数据初始化组件
     * @param d 初始数据（可以是对象或JSON字符串）
     * @example
     * // 初始化玩家数据
     * const data = { hp: 100, level: 5 };
     * this.getComponent(YJDataWork).initWithData(data);
     * 
     * @example
     * // 从JSON字符串初始化
     * const json = '{"score": 2000, "name": "player1"}';
     * this.initWithData(JSON.parse(json));
     */
    public initWithData(d: any) {
        this.data = d;
        this.init();
        return this;
    }

    /**
     * 初始化数据组件
     * @description 
     * - 在组件加载时自动调用
     * - 可手动调用进行重新初始化
     * - 如果数据未就绪会启动定时检查（每帧检查，最多180次）
     * @example
     * // 手动重新初始化组件
     * this.getComponent(YJDataWork).init();
     * 
     * @example
     * // 在节点加入场景前初始化
     * const node = instantiate(prefab);
     * node.getComponent(YJDataWork).init();
     * scene.addChild(node);
     */
    public init() {
        if (!this._loaded) return;
        const afterDataInit = this['afterDataInit'];
        if (typeof afterDataInit == 'function') {
            this.unschedule(this._checkData);
            if (!this.data)
                this.schedule(this._checkData, 0, 180);
            else afterDataInit.call(this);
        }
    }

    /**
     * 数据就绪检查方法
     * @private
     * @description 当数据加载完成后：
     * 1. 停止定时检查
     * 2. 执行后续初始化回调（afterDataInit）
     * @remarks 由init方法自动调度，无需手动调用
     */
    private _checkData() {
        if (!!this.data) {
            this.unschedule(this._checkData);
            const afterDataInit = this['afterDataInit'];
            afterDataInit.call(this);
        }
    }

    /**
     * 获取数据对象
     * @returns {any} 当前存储的数据对象
     * @example
     * // 获取玩家数据对象
     * const playerData = this.dataWork.data;
     */
    public get data(): any {
        return this._data?.data;
    }

    /**
     * 设置数据对象
     * @param d 要设置的数据（必须是对象类型）
     * @example
     * // 设置初始用户数据
     * this.dataWork.data = { name: '张三', level: 1 };
     */
    public set data(d: any) {
        if (typeof d != 'object') return;
        for (let key in d) {
            this.setValue(key, d[key]);
        }
    }

    /**
     * 设置数据到DataWork并初始化
     * @param t 基础数据对象（当d为空时使用）
     * @param d 优先使用的数据对象
     * @example
     * // 优先使用服务器数据，没有则用本地缓存
     * dataWork.setDataToDataWork(localData, serverData);
     */
    public setDataToDataWork(t: any, d: any) {
        this.data = d || t;
        this.init();
    }

    /**
     * 获取指定key的值
     * @param key 数据的key
     * @returns {any} 对应的值（不存在返回undefined）
     * @example
     * // 获取玩家等级
     * const level = this.getValue('playerLevel');
     */
    public getValue(key: string): any {
        return this._data.get(key);
    }

    /**
     * 设置指定key的数据（支持差异更新）
     * @param key 数据的key
     * @param value 要设置的值
     * @returns {YJDataWork} 返回自身以支持链式调用
     * @example
     * // 更新分数并立即同步UI
     * this.setValue('score', 100)
     *    .setValue('time', 60);
     */
    public setValue(key: string, value: any) {
        if (key == null) return this;
        this.bindSubFuckUis();
        this._data?.set(key, value, this.onlyDiff);
        return this.repeatSetValue(key);
    }

    /**
     * 重复设置值，并触发onValueChange回调
     * @param key 数据的key
     * @returns {YJDataWork} 返回自身以支持链式调用
     */
    public repeatSetValue(key: string) {
        this.onValueChange(key);
        return this;//支持链式写法
    }

    /**
     * 重置指定key的数据（强制全量更新）
     * @param key 数据的key
     * @param value 要设置的值
     * @returns {YJDataWork} 返回自身以支持链式调用
     * @example
     * // 强制更新玩家装备数据
     * this.resetValue('equipment', {
     *   weapon: 'sword',
     *   armor: 'steel'
     * });
     */
    public resetValue(key: string, value: any) {
        this.bindSubFuckUis();
        this._data?.set(key, value, false);
        return this.repeatSetValue(key);
    }

    /**
     * 仅更新某个key的值，不同步到ui
     * @param key 数据的key
     * @param value 要设置的值
     * @returns {YJDataWork} 返回自身以支持链式调用
     * @example
     * // 临时更新调试数据但不影响UI显示
     * this.onlyUpdateValue('debugMode', true)
     *    .onlyUpdateValue('logLevel', 3);
     */
    public onlyUpdateValue(key: string, value: any) {
        this._data?.set(key, value, false);
        return this;//支持链式写法
    }

    /**
     * 通过ui设置/修改值，会调用onUIValueChange方法
     * @param key 数据的key
     * @param value 要设置的值
     * @example
     * // 当输入框内容变化时调用
     * inputField.node.on('text-changed', (input) => {
     *    this.changeValueByUi('playerName', input.string);
     * });
     * 
     * // 会自动触发onUIValueChange回调进行数据验证
     */
    public changeValueByUi(key: string, value: any) {
        this.setValue(key, value);
        this['onUIValueChange']?.(key, value);
        this.getComponent('YJUpdatePreDataWork')?.['updateData'](this.data);
    }

    /**
     * 清空所有数据
     * @example
     * // 重置表单数据时调用
     * this.clear();
     * // 会触发所有绑定UI的清除操作
     */
    public clear() {
        this._data.clear();
        return this;
    }

    /**
     * 将已改变的数据同步到UI
     * @example
     * // 批量更新后手动同步UI
     * this.setValue('hp', 100)
     *    .setValue('mp', 50)
     *    .syncDataToUi();
     * 
     * // 适合在加载完所有数据后统一刷新UI
     */
    public syncDataToUi() {
        if (!this.isValid) {
            YJDataWorkManager.ins().remove(this);
            return;
        }
        for (let i = 0, n = this.subFuckUis.length; i < n; i++) {
            const ui = this.subFuckUis[i];
            ui.syncData();
        }
    }

    /**
     * 处理数据变化,更新到对应的UI组件
     * @param key 变化的数据key
     * @param value 变化的值
     * @example
     * // 当hp值变化时自动更新血条UI
     * this.onValueChange('hp', currentHP);
     * 
     * // 当经验值变化时自动更新经验条和等级显示
     * this.onValueChange('exp', newExp);
     */
    private onValueChange(key: string) {
        let ui: HackUi[] = this.getUis(key);
        this.setUiDataDirty(ui);
    }

    /**
     * 设置数据到UI组件
     * @param uis UI组件列表
     * @param data 要设置的数据
     * @remarks 会标记UI数据脏状态，若为一次性UI则自动移除绑定
     * @example
     * // 设置多个分数显示UI
     * this.setUiDataDirty([scoreUI1, scoreUI2], 100);
     * 
     * // 设置临时提示UI并自动移除
     * this.setUiDataDirty([tempTipUI], '奖励已获得');
     */
    private setUiDataDirty(uis: HackUi[]) {
        if (!uis?.length) return;
        for (let i = 0, n = uis.length; i < n; i++) {
            const ui = uis[i];
            ui.dataDirty = true;
            if (ui.once) {
                this.remove(ui);
            }
        }
    }

    /**
     * 获取绑定指定key的UI组件列表
     * @param key 数据键
     * @returns 对应的UI组件数组
     * @example
     * // 获取所有绑定金币显示的UI
     * const goldUIs = this.getUis('gold');
     */
    private getUis(key: string): HackUi[] {
        return this._data2ui.get(key);
    }

    /**
     * 移除UI组件绑定
     * @param ui 要移除的UI组件
     * @example
     * // 移除过期的提示UI
     * this.remove(expiredTipUI);
     */
    private remove(ui: HackUi) {
        let keys = ui.bindKeys;
        for (let j = 0, n = keys.length; j < n; j++) {
            let a: HackUi[] = this.getUis(keys[j]);
            if (a) {
                let i = a.indexOf(ui);
                a.splice(i, 1);
            }
        }
    }

    private _isBound: boolean = false;
    /**
     * 绑定子UI组件
     * @remarks 初始化时自动建立数据与UI的映射关系
     * @example
     * // 自动绑定所有子节点中的FuckUi组件
     * this.bindSubFuckUis();
     */
    private bindSubFuckUis() {
        if (this._isBound) return;
        this._isBound = true;
        let list = this.subFuckUis;
        for (let i = 0, n = list.length; i < n; i++) {
            let ui = list[i];
            ui['setData'](this._data);
            let keys = ui.bindKeys;
            for (let j = 0, n = keys.length; j < n; j++) {
                const key = keys[j];
                if (!!key) {
                    let a = this._data2ui.get(key);
                    if (!a) {
                        a = [];
                        this._data2ui.set(key, a);
                    }
                    a.push(ui);
                }
            }
        }
    }

    /**
     * 初始化后调用（此时data不一定有值）
     * @remarks 子类可重写该方法实现自定义初始化逻辑
     * @example
     * // 在子类中初始化默认值
     * protected afterInit() {
     *    this.setValue('hp', 100);
     *    this.setValue('mp', 50);
     * }
     */
    protected afterInit() {

    }

    /**
     * 数据初始化后调用,此时data一定有值
     * 子类按需实现该方法
     */
    // protected afterDataInit() {

    // }

}
