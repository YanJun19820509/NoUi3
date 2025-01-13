import { ccclass, Component, Node, SkeletonData } from '../yj';
import { no } from '../no';
import { singleObject } from '../types';
import { sp } from 'cc';

interface SpineResource {
    data: SkeletonData;
    ref: number;
    t: number;
    size: number;
}

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
    private static readonly RELEASE_INTERVAL = 2000; // 释放检查间隔
    private static readonly RELEASE_TIMEOUT = 10; // 释放超时时间(秒)
    private static readonly _map = new Map<string, SpineResource>();
    private static readonly _loading = new Map<string, Promise<SkeletonData>>();

    private _timer: string | null = null;

    public static get ins(): YJSpineManager {
        return this.instance();
    }

    constructor() {
        super();
        this.startReleaseTimer();
    }

    private startReleaseTimer(): void {
        this.stopReleaseTimer();
        this._timer = no.setIntervalF(() => this.release(), YJSpineManager.RELEASE_INTERVAL);
    }

    private stopReleaseTimer(): void {
        if (this._timer) {
            no.clearIntervalF(this._timer);
            this._timer = null;
        }
    }

    private normalizePath(path: string): string {
        return path?.replace('db://assets/', '').split('.')[0] ?? '';
    }

    public set(path: string, data?: SkeletonData): void {
        if (!path) return;

        const normalizedPath = this.normalizePath(path);
        const resource = YJSpineManager._map.get(normalizedPath);

        if (resource) {
            resource.ref--;
            resource.t = no.sysTime.now;
        } else if (data) {
            YJSpineManager._map.set(normalizedPath, {
                data,
                t: no.sysTime.now,
                ref: 0,
                size: this.getSize(data)
            });
        }
    }

    public async get(path: string): Promise<SkeletonData | null> {
        if (!path) return null;

        const normalizedPath = this.normalizePath(path);

        try {
            // 检查是否正在加载
            if (YJSpineManager._loading.has(normalizedPath)) {
                await YJSpineManager._loading.get(normalizedPath);
                return this.get(normalizedPath);
            }

            // 检查缓存
            const resource = YJSpineManager._map.get(normalizedPath);
            if (resource) {
                resource.ref++;
                return resource.data;
            }

            // 新建加载请求
            const loadingPromise = new Promise<SkeletonData>((resolve, reject) => {
                no.assetBundleManager.loadSpine(normalizedPath, (res: SkeletonData) => {
                    if (!res) {
                        reject(new Error(`Failed to load spine: ${normalizedPath}`));
                        return;
                    }

                    YJSpineManager._map.set(normalizedPath, {
                        data: res,
                        t: no.sysTime.now + 86400,
                        ref: 1,
                        size: this.getSize(res)
                    });
                    resolve(res);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });

            YJSpineManager._loading.set(normalizedPath, loadingPromise);

            const result = await loadingPromise;
            YJSpineManager._loading.delete(normalizedPath);
            return result;

        } catch (error) {
            YJSpineManager._loading.delete(normalizedPath);
            no.warn(`加载Spine资源失败: ${normalizedPath}, 错误: ${error.message}`);
            return null;
        }
    }

    private getSize(res: SkeletonData): number {
        if (!res?.textures?.length) return 0;
        return res.textures.reduce((sum, texture) =>
            sum + (texture.getGFXTexture()?.size ?? 0), 0);
    }

    private release(): void {
        const releaseTime = no.sysTime.now - YJSpineManager.RELEASE_TIMEOUT;
        let totalSize = 0;
        const toRelease: string[] = [];

        // 收集需要释放的资源
        YJSpineManager._map.forEach((resource, key) => {
            totalSize += resource.size;
            if (resource.t <= releaseTime && resource.ref === 0) {
                toRelease.push(key);
            }
        });

        // 释放资源
        toRelease.forEach(key => {
            const resource = YJSpineManager._map.get(key);
            if (resource) {
                totalSize -= resource.size;
                no.assetBundleManager.release(resource.data, true);
                YJSpineManager._map.delete(key);
            }
        });

        // 输出内存使用情况
        if (toRelease.length > 0) {
            no.warn(`Spine内存使用: ${Math.ceil(totalSize / 1048576)}MB, 释放数量: ${toRelease.length}`);
        }
    }

    public clear(): void {
        this.stopReleaseTimer();
        YJSpineManager._map.clear();
        YJSpineManager._loading.clear();
    }
}
