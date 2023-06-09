
import { _decorator, Component, Node, sp } from 'cc';
import { no } from '../no';
import { resolve } from 'path';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJSpineManager
 * DateTime = Tue May 09 2023 18:36:50 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSpineManager.ts
 * FileBasenameNoExtension = YJSpineManager
 * URL = db://assets/NoUi3/base/YJSpineManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//spine资源加载和缓存管理器
@ccclass('YJSpineManager')
export class YJSpineManager extends no.SingleObject {
    public static get ins(): YJSpineManager {
        return super.ins;
    }

    private _map: { [path: string]: { data: sp.SkeletonData, t: number } } = {};

    public set(path: string, data?: sp.SkeletonData) {
        if (this._map[path]) {
            this._map[path].t = no.sysTime.now;
        } else if (!!data) {
            this._map[path] = { data: data, t: no.sysTime.now };
        }
    }

    public async get(path: string): Promise<sp.SkeletonData> {
        // if (this._map[path]) return this._map[path].data;
        // else {
        return new Promise<sp.SkeletonData>(resolve => {
            no.assetBundleManager.loadSpine(path, res => {
                resolve(res);
                this._map[path] = { data: res, t: no.sysTime.now + 86400 };
            });
        });
        // }
    }

    public release(duration: number) {
        const a = no.sysTime.now - duration;
        let keys: string[] = [];
        for (const key in this._map) {
            if (this._map[key].t <= a) keys[keys.length] = key;
        }
        keys.forEach(k => {
            this._map[k].data.decRef();
            this._map[k] = null;
        });
    }
}
