
import { _decorator, Component, Node } from 'cc';
import { no } from '../no';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJCacheObject
 * DateTime = Fri Jan 14 2022 17:52:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCacheObject.ts
 * FileBasenameNoExtension = YJCacheObject
 * URL = db://assets/Script/NoUi3/base/YJCacheObject.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJCacheObject')
@menu('NoUi/base/YJCacheObject(缓存对象)')
export class YJCacheObject extends Component {
    @property({ displayName: '回收类型' })
    recycleType: string = '';
    @property({ visible() { return !this.resetOnDisable; } })
    recycleOnDisable: boolean = false;

    private _recycled: boolean = false;

    onEnable() {
        this._recycled = false;
    }

    onDisable() {
        this.recycleOnDisable && !this._recycled && this.recycle();
    }

    public recycle(): void {
        this._recycled = true;
        no.cachePool.recycle(this.recycleType, this.node);
    }
}
