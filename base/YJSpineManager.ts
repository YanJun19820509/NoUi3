import { ccclass, Component, Node, SkeletonData } from '../yj';
import { no } from '../no';
import { singleObject } from '../types';

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
 * URL = db://assets/common/base/YJSpineManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//spine资源加载和缓存管理器
@ccclass('YJSpineManager')
@singleObject('YJSpineManager')
export class YJSpineManager extends no.SingleObject {
    /** 资源释放检查间隔（毫秒）用于定时触发资源回收检测 */
    private static readonly RELEASE_INTERVAL = 2000; // 释放检查间隔
    /** 资源释放超时时间（秒）未被引用的资源超过此时间将被释放 */
    private static readonly RELEASE_TIMEOUT = 10; // 释放超时时间(秒)
    /** Spine资源缓存映射表 key:资源路径 value:资源对象 */
    private static readonly _map = new Map<string, SpineResource>();
    /** 正在加载中的资源记录表 key:资源路径 value:加载Promise对象 */
    private static readonly _loading = new Map<string, Promise<SkeletonData>>();

    /** 定时器ID用于管理资源释放定时器 */
    private _timer: string | null = null;

    /**
     * 获取单例实例
     * @example
     * // 获取管理器实例
     * const spineMgr = YJSpineManager.ins;
     * // 使用实例方法
     * spineMgr.get('character/hero').then(data => { ... });
     */
    public static get ins(): YJSpineManager {
        return this.instance() as YJSpineManager;
    }

    /**
     * 构造函数初始化资源释放定时器
     * @example
     * // 通常不需要手动实例化，通过ins属性获取单例
     * // 特殊情况下需要新建实例：
     * const mgr = new YJSpineManager();
     */
    constructor() {
        super();
        this.startReleaseTimer();
    }

    /**
     * 停止自动释放
     */
    public stopAutoRelease() {
        this.stopReleaseTimer();
    }

    /** 
     * 启动资源释放定时器
     * @description 每RELEASE_INTERVAL毫秒执行一次资源回收检查
     * @example
     * // 手动重启定时器（通常不需要）
     * this.startReleaseTimer();
     */
    private startReleaseTimer(): void {
        this.stopReleaseTimer();
        this._timer = no.setIntervalF(() => this.release(), YJSpineManager.RELEASE_INTERVAL);
    }

    /**
     * 停止资源释放定时器
     * @description 清理定时器并重置定时器ID
     * @example
     * // 手动停止资源回收（特殊情况下使用）
     * this.stopReleaseTimer();
     */
    private stopReleaseTimer(): void {
        if (this._timer) {
            no.clearIntervalF(this._timer);
            this._timer = null;
        }
    }

    /**
     * 规范化资源路径
     * @param path 原始资源路径（支持带db://assets/前缀和扩展名）
     * @returns 标准化后的资源路径（去除前缀和扩展名）
     * @example
     * // 输入: 'db://assets/resources/characters/hero.spine'
     * // 输出: 'resources/characters/hero'
     */
    private normalizePath(path: string): string {
        return path?.replace('db://assets/', '').split('.')[0] ?? '';
    }

    /**
     * 设置/更新Spine资源
     * @param path 资源路径（自动规范化处理）
     * @param data 可选的SkeletonData（用于预加载或手动管理资源）
     * @example
     * // 预加载资源并手动管理
     * const data = await loadSpineData();
     * YJSpineManager.ins.set('character/hero', data);
     * 
     * // 更新现有资源的引用计数
     * YJSpineManager.ins.set('ui/loading');
     */
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

    /**
     * 异步获取Spine资源
     * @param path 资源路径（支持带扩展名的原始路径）
     * @returns Promise包装的SkeletonData或null
     * @example
     * // 基本使用
     * YJSpineManager.ins.get('character/hero').then(data => {
     *     if(data) spine.skeletonData = data;
     * });
     * 
     * @example
     * // 配合async/await使用
     * async function loadCharacter() {
     *     const data = await YJSpineManager.ins.get('characters/main');
     *     if(!data) no.err('角色资源加载失败');
     * }
     * 
     * @example
     * // 处理加载失败
     * YJSpineManager.ins.get('invalid/path').catch(() => {
     *     showErrorToast('资源加载失败');
     * });
     */
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
                        no.err(`Failed to load spine: ${normalizedPath}`);
                        resolve(null);
                        return;
                    }

                    YJSpineManager._map.set(normalizedPath, {
                        data: res,
                        t: no.sysTime.now + 86400, // 初始缓存时间设为24小时后
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

    /**
     * 计算骨骼动画资源的内存占用大小
     * @param res 骨骼动画数据资源
     * @returns 纹理内存总大小（字节）
     * @example
     * // 获取单个spine资源的内存占用
     * const spineData = await YJSpineManager.load('char/hero');
     * const memSize = this.getSize(spineData);
     * no.log(`当前资源占用内存: ${memSize}字节`);
     */
    private getSize(res: SkeletonData): number {
        if (!res?.textures?.length) return 0;
        return res.textures.reduce((sum, texture) =>
            sum + (texture.getGFXTexture()?.size ?? 0), 0);
    }

    /**
     * 执行资源释放逻辑，包含以下功能：
     * 1. 清理超过释放时间阈值的缓存
     * 2. 释放引用计数为0的资源
     * 3. 统计并输出内存使用情况
     * @example
     * // 手动触发资源释放（通常由定时器自动调用）
     * YJSpineManager.instance['release']();
     * 
     * // 开发调试时查看内存状态：
     * // 控制台将输出类似："Spine内存使用: 32MB, 释放数量: 5"
     */
    private release(): void {
        const releaseTime = no.sysTime.now - YJSpineManager.RELEASE_TIMEOUT;
        let totalSize = 0;
        const toRelease: string[] = [];

        // 收集需要释放的资源（同时统计总内存）
        YJSpineManager._map.forEach((resource, key) => {
            totalSize += resource.size;
            // 释放条件：超过缓存时间 且 无外部引用
            if (resource.t <= releaseTime && resource.ref === 0) {
                toRelease.push(key);
            }
        });

        // 执行实际资源释放操作
        for (let i = 0; i < toRelease.length; i++) {
            const key = toRelease[i];
            const resource = YJSpineManager._map.get(key);
            if (resource) {
                totalSize -= resource.size; // 更新剩余内存统计
                no.assetBundleManager.release(resource.data, true); // 强制释放资源
                YJSpineManager._map.delete(key); // 移除缓存记录
            }
        }

        // 开发环境下输出内存使用报告
        if (toRelease.length > 0) {
            no.warn(`Spine内存使用: ${Math.ceil(totalSize / 1048576)}MB, 释放数量: ${toRelease.length}`);
        }
    }

    /**
     * 彻底清理所有Spine资源缓存
     * @description 该方法会：
     * 1. 停止自动释放定时器
     * 2. 清空所有缓存资源（包括正在使用的）
     * 3. 清空正在加载的记录
     * @example
     * // 强制清空所有spine缓存（适用于热更新后资源需要完全重新加载）
     * YJSpineManager.ins.clear();
     * 
     * @example
     * // 配合内存警告使用：
     * no.game.on('memory_warning', () => {
     *     YJSpineManager.ins.clear();
     *     no.log('已清理所有Spine缓存资源');
     * });
     * 
     * @example
     * // 测试环境手动调用验证
     * // 在控制台输入：YJSpineManager.ins.clear()
     */
    public clear(): void {
        this.stopReleaseTimer();
        this.release();
        YJSpineManager._map.clear();
        YJSpineManager._loading.clear();
    }
}
