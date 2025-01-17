
import { DEBUG, EDITOR, ccclass, property, menu, requireComponent, executeInEditMode, Component, isValid, disallowMultiple, Node } from '../yj';
import { FuckUi } from '../fuckui/FuckUi';
import { no } from '../no';
import { YJDataWorkManager } from './YJDataWorkManager';

/**
 * Predefined variables
 * Name = YJDataWork
 * DateTime = Thu Jan 13 2022 00:14:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDataWork.ts
 * FileBasenameNoExtension = YJDataWork
 * URL = db://assets/Script/NoUi3/base/YJDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJDataWork')
@menu('NoUi/base/YJDataWork(数据处理基类)')
@disallowMultiple()
export class YJDataWork extends Component {
    @property
    public get autoRegister(): boolean {
        return false;
    }

    public set autoRegister(v: boolean) {
        let list = this.getComponentsInChildren(FuckUi);
        for (let i = 0, n = this.subFuckUiNodes.length; i < n; i++) {
            const sub = this.subFuckUiNodes[i];
            list = list.concat(sub.getComponentsInChildren(FuckUi));
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

    @property(Node)
    subFuckUiNodes: Node[] = [];
    @property({ type: FuckUi })
    subFuckUis: FuckUi[] = [];

    /**
     * 是否启用差异更新
     * 如果为true,则仅修改某key下有变更的值
     * 如果为false,则替换该key对应的全部值
     * 非差异更新性能较好,默认为true
     */
    @property({ displayName: '差异更新', tooltip: '仅修改某key下有变更的值，否则替换该key对应全部值。非差异更新性能较好，默认true' })
    onlyDiff: boolean = true;


    protected _data2ui: Map<string, FuckUi[]> = new Map();

    /**
     * 数据存储对象
     */
    protected _data: no.Data = new no.Data();

    /**
     * 记录已改变数据的key列表
     */
    private changedDataKeys: string[] = [];

    /**
     * 组件是否已加载完成
     */
    private _loaded: boolean = false;

    /**
     * 是否需要更新数据到UI
     */
    private _neecChangeData: boolean = false;

    /**
     * 组件销毁时调用
     */
    protected onDestroy(): void {
        YJDataWorkManager.ins().remove(this);
        this.clear();
    }

    /**
     * 组件加载时调用
     * 在编辑器中获取UI注册器组件
     * 在运行时初始化数据
     */
    protected onLoad() {
        YJDataWorkManager.ins().add(this);
        this._loaded = true;
        this._neecChangeData = false;
        this.init();
    }

    /**
     * 组件启用时调用
     * 在运行时执行afterInit
     */
    onEnable() {
        if (EDITOR) return;
        this.afterInit();
    }

    /**
     * 使用指定数据初始化
     * @param d 初始数据
     */
    public initWithData(d: any) {
        this.data = d;
        this.init();
    }

    /**
     * 初始化，可手动执行，或在onLoad时自动执行
     * 若希望当节点在场景中显示出来之前数据就初始化好，就要在创建节点时（加入场景前）执行init并执行数据相关操作
     */
    public init() {
        this.bindSubFuckUis();
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
     * 检查数据是否存在
     * 如果存在则执行afterDataInit
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
     */
    public get data(): any {
        return this._data?.data;
    }

    /**
     * 设置数据对象
     * @param d 要设置的数据
     */
    public set data(d: any) {
        if (typeof d != 'object') return;
        this.bindSubFuckUis();
        for (let key in d) {
            this.setValue(key, d[key]);
        }
    }

    /**
     * 设置数据到DataWork并初始化
     * @param t 数据对象1
     * @param d 数据对象2,优先使用d
     */
    public setDataToDataWork(t: any, d: any) {
        this.data = d || t;
        this.init();
    }

    /**
     * 获取指定key的值
     * @param key 数据的key
     */
    public getValue(key: string): any {
        return this._data.get(key);
    }

    /**
     * 设置指定key的值,并同步到UI
     * @param key 数据的key
     * @param value 要设置的值
     */
    public setValue(key: string, value: any) {
        this._data?.set(key, value, this.onlyDiff);
        //过滤同一帧内同一key多次赋值的情况
        // no.addToArray(this.changedDataKeys, key);
        this.onValueChange(key, value);
        return this;//支持链式写法
    }

    /**
     * 仅更新某个key的值，不同步到ui
     * @param key 数据的key
     * @param value 要设置的值
     */
    public onlyUpdateValue(key: string, value: any) {
        this._data?.set(key, value, false);
        return this;//支持链式写法
    }

    /**
     * 通过ui设置/修改值，会调用onUIValueChange方法
     * @param key 数据的key
     * @param value 要设置的值
     */
    public changeValueByUi(key: string, value: any) {
        this.setValue(key, value);
        this['onUIValueChange']?.(key, value);
        this.getComponent('YJUpdatePreDataWork')?.['updateData'](this.data);
    }

    /**
     * 清空所有数据
     */
    public clear(): void {
        this._data.clear();
    }

    /**
     * 将已改变的数据同步到UI
     */
    public syncDataToUi() {
        // if (!this?.node?.isValid) return;
        // if (!this?.changedDataKeys?.length) return;
        // const keys = this.changedDataKeys.slice();
        // this.changedDataKeys.length = 0;
        // for (let i = 0, n = keys.length; i < n; i++) {
        //     this.onValueChange(keys[i]);
        // }
        for (let i = 0, n = this.subFuckUis.length; i < n; i++) {
            const ui = this.subFuckUis[i];
            ui.syncData();
        }
    }

    /**
     * 处理数据变化,更新到对应的UI组件
     * @param key 变化的数据key
     * @param value 变化的值
     */
    private onValueChange(key: string, value?: any) {
        let ui: FuckUi[] = this.getUis(key);
        if (value == null) value = this.getValue(key);
        this.setUiData(ui, value);
        //为提升性能，暂时不支持数组和对象子元素的更新
        // if (value instanceof Array) {
        //     value.forEach((v, i) => {
        //         let ui: FuckUi[] = this.getUis(`${key}.${i}`);
        //         this.setUiData(ui, v);
        //     });
        // }
        // else if (value instanceof Object) {
        //     if (DEBUG && value.__classname__) {
        //         console.warn('不能传递对象类型数据：', key, value);
        //         return;
        //     }
        //     for (let k in value) {
        //         this.onValueChange(`${key}.${k}`, value[k]);
        //     }
        // }
    }

    /**
     * 设置数据到UI组件
     * @param uis UI组件列表
     * @param data 要设置的数据
     */
    private setUiData(uis: FuckUi[], data: any) {
        if (!uis?.length) return;
        for (let i = 0, n = uis.length; i < n; i++) {
            const ui = uis[i];
            ui.dataDirty = true;
            if (ui.once) {
                this.remove(ui);
            }
        }
    }

    private getUis(key: string): FuckUi[] {
        return this._data2ui.get(key);
    }

    private remove(ui: FuckUi) {
        let keys = ui.bindKeys;
        for (let j = 0, n = keys.length; j < n; j++) {
            let a: FuckUi[] = this.getUis(keys[j]);
            if (a) {
                let i = a.indexOf(ui);
                a.splice(i, 1);
            }
        }
    }

    private _isBound: boolean = false;
    private bindSubFuckUis() {
        if (this._isBound) return;
        this._isBound = true;
        let list = this.subFuckUis;
        for (let i = 0, n = list.length; i < n; i++) {
            let ui = list[i];
            ui['setData'](this._data.data);
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
     * 初始化后调用,此时data不一定有值
     * 子类按需实现该方法
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
