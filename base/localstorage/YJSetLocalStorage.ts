
import { _decorator, Component, Node } from 'cc';
const { ccclass, property, menu } = _decorator;

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

    public a_set(e: any, v?: string) {
        localStorage.setItem(this.key, v || e);
    }
}
