
import { _decorator, Component, Node } from './yj';
import { no } from '../../no';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJGetLocalStorage
 * DateTime = Fri Jan 14 2022 15:32:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGetLocalStorage.ts
 * FileBasenameNoExtension = YJGetLocalStorage
 * URL = db://assets/Script/NoUi3/base/localstorage/YJGetLocalStorage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJGetLocalStorage')
@menu('NoUi/localstorage/YJGetLocalStorage(获取本地缓存数据)')
export class YJGetLocalStorage extends Component {
    @property({ displayName: '本地缓存数据的key', tooltip: '多个key用 , 分割' })
    keys: string = '';
    @property(no.EventHandlerInfo)
    calls: no.EventHandlerInfo[] = [];
    @property
    usePreKey: boolean = true;

    onLoad() {
        let v = new Object();
        let ks = this.keys.split(',');
        ks.forEach(key => {
            try {
                v[key] = this.usePreKey ? no.dataCache.getLocal(key) : no.parse2Json(localStorage.getItem(key));
            } catch (e) {
                no.err('no.parse2Json', 'YJGetLocalStorage', key);
            }
        });
        if (ks.length == 0) v = v[ks[0]];
        no.EventHandlerInfo.execute(this.calls, v);
    }
}
