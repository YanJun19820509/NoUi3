
import { ccclass, property, menu, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJSetLocalStorage
 * DateTime = Fri Jan 14 2022 15:32:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetLocalStorage.ts
 * FileBasenameNoExtension = YJSetLocalStorage
 * URL = db://assets/Script/NoUi3/base/localstorage/YJSetLocalStorage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJSetLocalStorage')
@menu('NoUi/localstorage/YJSetLocalStorage(设置本地缓存数据)')
export class YJSetLocalStorage extends Component {
    @property({ displayName: '本地缓存数据的key' })
    key: string = '';
    @property
    usePreKey: boolean = true;

    public a_set(e: any, v?: string) {
        this.usePreKey ? no.dataCache.setLocal(this.key, v || e) : localStorage.setItem(this.key, v || e);
    }
}
