
import { ccclass, Component, Node, SkeletonData } from '../yj';
import { no } from '../no';
import { singleObject } from '../types';
import { sp } from 'cc';

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

    private static _map: { [path: string]: { data: SkeletonData, ref: number, t: number, size: number } } = {};
    private static _loading: { [x: string]: sp.SkeletonData | PromiseLike<sp.SkeletonData> } = {};

    private _timer: any;
    constructor() {
        super();

        if (this._timer) {
            no.clearIntervalF(this._timer);
            this._timer = null;
        }
        this._timer = no.setIntervalF(() => {
            this.release();
        }, 2000);
    }

    public set(path: string, data?: SkeletonData) {
        if (YJSpineManager._map[path]) {
            YJSpineManager._map[path].ref--;
            YJSpineManager._map[path].t = no.sysTime.now;
        } else if (!!data) {
            YJSpineManager._map[path] = { data: data, t: no.sysTime.now, ref: 0, size: this.getSize(data) };
        } else {
        }
    }

    public async get(path: string): Promise<SkeletonData> {
        // 如果资源已经在加载中，则等待它完成
        if (YJSpineManager._loading[path]) {
            await YJSpineManager._loading[path];
            return this.get(path);
        }

        if (YJSpineManager._map[path]) {
            YJSpineManager._map[path].ref++;
            return YJSpineManager._map[path].data;
        } else {
            // 在检查完成后，将要加载该路径的请求记录下来
            YJSpineManager._loading[path] = new Promise<SkeletonData>(resolve => {
                no.assetBundleManager.loadSpine(path, res => {
                    // 执行完回调后，从加载中的路径列表中移除该路径
                    delete YJSpineManager._loading[path];
                    // 将资源添加到管理器中
                    YJSpineManager._map[path] = { data: res, t: no.sysTime.now + 86400, ref: 1, size: this.getSize(res) };
                    resolve(res);
                });
            });
            return YJSpineManager._loading[path];
        }
    }

    private getSize(res: SkeletonData): number {
        let size = 0;
        res?.textures.forEach(t => size += t.getGFXTexture().size);
        return size;
    }

    private release() {
        const a = no.sysTime.now - 10;
        let keys: string[] = [], size = 0;
        for (const key in YJSpineManager._map) {
            if (YJSpineManager._map[key].t <= a) keys[keys.length] = key;
            size += YJSpineManager._map[key].size;
        }

        keys.forEach(k => {
            if (YJSpineManager._map[k].ref == 0) {
                size -= YJSpineManager._map[k].size;
                no.assetBundleManager.release(YJSpineManager._map[k].data, true);
                delete YJSpineManager._map[k];
            }
        });

        // no.warn(`当前spine内存大小 size: ${Math.ceil(size / 1048576)}M`);
    }

    public clear() {
        if (this._timer) {
            no.clearIntervalF(this._timer);
            this._timer = null;
        }
    }
}
