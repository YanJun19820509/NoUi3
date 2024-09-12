
import { DEBUG, EDITOR, ccclass, property, menu, requireComponent, executeInEditMode, Component, isValid, disallowMultiple } from '../yj';
import { FuckUi } from '../fuckui/FuckUi';
import { no } from '../no';
import { YJFuckUiRegister } from './YJFuckUiRegister';
import { YJJobManager } from './YJJobManager';

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
@requireComponent(YJFuckUiRegister)
@executeInEditMode()
@disallowMultiple()
export class YJDataWork extends Component {
    @property(YJFuckUiRegister)
    register: YJFuckUiRegister = null;

    @property({ displayName: '差异更新', tooltip: '仅修改某key下有变更的值，否则替换该key对应全部值。非差异更新性能较好，默认true' })
    onlyDiff: boolean = true;

    protected _data: no.Data = new no.Data();

    private changedDataKeys: string[] = [];
    private _dataChanged: boolean = false;

    private _loaded: boolean = false;

    protected onDestroy(): void {
    }

    protected onLoad() {
        if (EDITOR) {
            this.register = this.getComponent(YJFuckUiRegister);
            return;
        }
        this._loaded = true;
        this.init();
    }

    protected start() {
        if (EDITOR) return;
        this.register.init();
    }

    onEnable() {
        if (EDITOR) return;
        this.afterInit();
    }

    /**
     * 初始化，可手动执行，或在onLoad时自动执行，若希望当节点在场景中显示出来之前数据就初始化好，就要在创建节点时（加入场景前）执行init并执行数据相关操作
     * @returns
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

    private _checkData() {
        if (!!this.data) {
            this.unschedule(this._checkData);
            const afterDataInit = this['afterDataInit'];
            afterDataInit.call(this);
        }
    }

    public get data(): any {
        return this._data?.data;
    }

    public set data(d: any) {
        for (let key in d) {
            this.setValue(key, d[key]);
        }
    }

    public setDataToDataWork(t: any, d: any) {
        this.data = d || t;
        this.init();
    }

    public getValue(key: string): any {
        return this._data.get(key);
    }

    public setValue(key: string, value: any) {
        this._data?.set(key, value, this.onlyDiff);
        //过滤同一帧内同一key多次赋值的情况
        no.addToArray(this.changedDataKeys, key);
        this._dataChanged = true;
        return this;//支持链式写法
    }

    protected lateUpdate(dt: number): void {
        if (EDITOR || !this._loaded) return;
        if (this._dataChanged) {
            this.setChangedDataToUi();
            this._dataChanged = false;
        }
    }

    public clear(): void {
        this._data.clear();
    }

    private setChangedDataToUi() {
        if (!this?.node?.isValid) return;
        if (!this?.changedDataKeys?.length) return;
        if (!this.register.isInit) this.register.init();

        let keys = this.changedDataKeys.splice(0, this.changedDataKeys.length);
        this.changedDataKeys.length = 0;
        // keys.forEach(k => {
        //     this.onValueChange(k);
        // });
        // keys = null;
        YJJobManager.ins.execute(this.iterateChangedData, this, keys);
    }

    private iterateChangedData(keys: string[]) {
        if (!isValid(this?.node) || !keys?.length) return false;
        let k = keys.shift();
        this.onValueChange(k);
        return true;
    }

    private onValueChange(key: string, value?: any) {
        let ui: FuckUi[] = this.register?.getUis(key) || [];
        if (value == null) value = this.getValue(key);
        this.setUiData(ui, value);
        if (value instanceof Array) {
            value.forEach((v, i) => {
                let ui: FuckUi[] = this.register?.getUis(`${key}.${i}`) || [];
                this.setUiData(ui, v);
            });
        } else if (value instanceof Object) {
            if (DEBUG && value.__classname__) {
                console.warn('不能传递对象类型数据：', key, value);
                return;
            }
            for (let k in value) {
                this.onValueChange(`${key}.${k}`, value[k]);
            }
        }
    }

    private setUiData(uis: FuckUi[], data: any) {
        if (uis == null) return;
        uis.forEach(ui => {
            let keys = ui.bindKeys;
            if (keys.length == 1) {
                ui.setData(no.jsonStringify(data));
            } else {
                let a = {};
                keys.forEach(key => {
                    a[key] = this._data.get(key);
                });
                ui.setData(no.jsonStringify(a));
            }
        });
    }

    //子类实现
    /**此时data不一定有值 */
    protected afterInit() {

    }
    /**此时data一定有值，子类按需实现该方法 */
    // protected afterDataInit() {

    // }


}
