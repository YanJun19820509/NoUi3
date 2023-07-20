import { YJDataWork } from '../../NoUi3/base/YJDataWork';
import { ccclass, js, property } from '../yj';
import { YJGameData } from './YJGameData';

/**
 * 数据映射
 * Author mqsy_yj
 * DateTime Tue Jul 11 2023 16:28:37 GMT+0800 (中国标准时间)
 *
 */
@ccclass('YJDataMapInfo')
export class YJDataMapInfo {
    @property({ displayName: '数据key', tooltip: '如果对应多个key用,分隔，将解析为kv结构' })
    dataKeys: string = '';
    @property
    uiKey: string = '';

    public getData(dataSource: YJGameData): any {
        const keys = this.dataKeys.split(',');
        if (keys.length == 1) return dataSource.get(keys[0]);
        let a: any = {};
        keys.forEach(k => {
            let v = dataSource[k];
            if (v == null) v = dataSource.get(k);
            a[k] = v;
        });
        return a;
    }
}
@ccclass('YJDataMap')
export class YJDataMap extends YJDataWork {
    @property({ displayName: '数据源', tooltip: '数据对象类名，继承YJGameData' })
    dataSourceClassName: string = '';
    @property({ type: YJDataMapInfo })
    keyMaps: YJDataMapInfo[] = [];

    private _dataSource: YJGameData;

    protected afterInit() {
        if (!this._dataSource) {
            const c = js.getClassByName(this.dataSourceClassName) as (typeof YJGameData);
            this._dataSource = c.instance();
            if (this._dataSource) {
                this.update = (dt: number) => {
                    super.update?.(dt);
                    if (this._dataSource.checkStateChange(this)) this.syncWithDataSource();
                };
            }
        }
        this.syncWithDataSource();
    }

    protected syncWithDataSource() {
        if (!this._dataSource) return;
        this.keyMaps.forEach(km => {
            this.setValue(km.uiKey, km.getData(this._dataSource));
        });
    }
}