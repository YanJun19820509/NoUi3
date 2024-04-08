
import { ccclass, Component, Node, SkeletonData } from '../yj';
import { no } from '../no';
import { singleObject } from '../types';

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
@singleObject()
export class YJSpineManager extends no.SingleObject {
    public static get ins(): YJSpineManager {
        return this.instance();
    }

    private _map: { [path: string]: { data: SkeletonData, ref: number, t: number } } = {};
    private _timer: any;
    constructor() {
        super();

        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        this._timer = setInterval(() => {
            this.release();
        }, 2000);
    }

    public set(path: string, data?: SkeletonData) {
        if (this._map[path]) {
            this._map[path].ref--;
            this._map[path].t = no.sysTime.now;
        } else if (!!data) {
            this._map[path] = { data: data, t: no.sysTime.now, ref: 0 };
        }
    }

    public async get(path: string): Promise<SkeletonData> {
        if (this._map[path]) {
            this._map[path].ref++;
            return this._map[path].data;
        }
        else {
            return new Promise<SkeletonData>(resolve => {
                no.assetBundleManager.loadSpine(path, res => {
                    resolve(res);
                    this._map[path] = { data: res, t: no.sysTime.now + 86400, ref: 1 };
                });
            });
        }
    }

    private release() {
        const a = no.sysTime.now - 5;
        let keys: string[] = [];
        for (const key in this._map) {
            if (this._map[key].t <= a) keys[keys.length] = key;
        }
        keys.forEach(k => {
            // this._map[k].data.decRef();
            if (this._map[k].ref <= 0) {
                no.assetBundleManager.release(this._map[k].data, true);
                delete this._map[k];
            }
        });
    }

    private clear() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }
}
