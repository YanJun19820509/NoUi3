/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 11:15:57 GMT+0800 (中国标准时间)
 *
 */

import { warn } from "console";
import { uuid } from "../../../extensions/ccc-ext-APS/@types/packages/engine/@types/editor-extends/utils/uuid";
import { no } from "../no";
import { _AssetInfo, AnimationClip, Asset, assetManager, AudioClip, BufferAsset, Bundle, director, EffectAsset, Font, ImageAsset, isValid, JsonAsset, Material, Prefab, rect, resources, Size, SkeletonData, SpriteAtlas, SpriteFrame, TextAsset, Texture2D, TTFFont } from "../yj";
import { stringUtils } from "./stringUtils";
import { scheduleUtils } from "./scheduleUtils";
import { sysTime } from "./sysTime";

//用于设置下载的最大并发连接数，若当前连接数超过限制，将会进入等待队列。
assetManager.downloader.maxConcurrency = 10;
//用于设置每帧发起的最大请求数，从而均摊发起请求的 CPU 开销，避免单帧过于卡顿
assetManager.downloader.maxRequestsPerFrame = 10;
assetManager.downloader.maxRetryCount = 2;
export namespace assetUtils {
    /**资源管理 */

    export type AssetPath = { bundle?: string, path?: string, file?: string, type?: typeof Asset };
    export class AssetBundleManager {

        // 远程资源缓存（键：资源路径，值：资源对象）
        private remoteAssetsCache: { [url: string]: { asset: Asset, t: number, ref: number, loading: boolean, cbs: ((sf: SpriteFrame | null) => void)[] } } = {};
        // 资源缓存映射表（键：资源路径，值：资源实例）
        private _cacheAsset: Map<string, Asset> = new Map();
        // 资源引用计数与时间戳（用于资源回收）
        private _cacheAssetRef: { [k: string]: { ref: number, time: number } } = {};
        // TTF字体缓存（键：字体名称，值：字体资源）
        private _ttfFont: { [fontFamily: string]: TTFFont } = {};
        // 资源路径到UUID的映射（用于快速查找）
        private _pathToUuid: Map<string, string> = new Map();
        // 正在加载中的资源列表（键：资源路径，值：加载状态）
        private _loadingAssets: Map<string, number> = new Map();

        /**
         * 获取/设置资源服务器地址
         * @example
         * // 获取当前资源服务器地址
         * const currentServer = assetBundleManager.server;
         * 
         * // 设置远程资源服务器
         * assetBundleManager.server = 'https://cdn.example.com/game-assets/';
         */
        public get server(): string {
            return assetManager.downloader.remoteServerAddress;
        }

        public set server(v: string) {
            assetManager.downloader['_remoteServerAddress'] = v;
        }

        /**
         * 获取所有远程资源包列表
         * @example
         * // 获取所有远程资源包名称
         * const bundles = assetBundleManager.remoteBundles;
         * console.no.log(bundles); // ['characters', 'scenes', 'effects']
         */
        public get remoteBundles(): readonly string[] {
            return assetManager.downloader.remoteBundles;
        }

        /**
         * 检查是否为远程资源包
         * @param bundleName - 资源包名称
         * @example
         * // 检查角色包是否为远程资源
         * const isRemote = assetBundleManager.isRemoteBundle('characters');
         */
        public isRemoteBundle(bundleName: string): boolean {
            return this.remoteBundles.includes(bundleName);
        }

        /**
         * 获取资源包版本号
         * @param bundleName - 资源包名称
         * @example
         * // 获取主资源包版本
         * const version = assetBundleManager.bundleVer('main');
         * console.no.log(version); // '1.2.3'
         */
        public bundleVer(bundleName: string): string {
            return assetManager.downloader.bundleVers[bundleName];
        }

        /**
         * 获取完整资源包URL
         * @param bundleName - 资源包名称
         * @example
         * // 获取远程角色包URL
         * const url = assetBundleManager.bundleUrl('characters');
         * // 返回：'https://cdn.example.com/game-assets/remote/characters'
         * 
         * // 获取本地UI包路径
         * const localPath = assetBundleManager.bundleUrl('ui');
         * // 返回：'ui'
         */
        public bundleUrl(bundleName: string): string {
            if (this.isRemoteBundle(bundleName)) {
                return this.server + stringUtils.pathjoin('remote', bundleName);
            }
            return bundleName;
        }

        /**
         * 检查资源是否已缓存
         * @param path - 资源路径
         * @example
         * // 检查玩家模型是否已加载
         * if (assetBundleManager.hasAsset('player/model')) {
         *   // 使用缓存资源...
         * }
         */
        public hasAsset(path: string): boolean {
            return this._pathToUuid.has(path);
        }

        /**
         * 从缓存加载资源（增加引用计数）
         * @param path - 资源路径
         * @returns 资源实例或null
         * @example
         * // 加载UI按钮资源
         * const buttonAsset = assetBundleManager.loadInCache('ui/button');
         * if (buttonAsset) {
         *   const buttonNode = instantiate(buttonAsset);
         *   // 使用完成后需要调用release...
         * }
         * 
         * // 注意：调用方需负责释放资源引用
         */
        public loadInCache(path: string) {
            const uuid = this._pathToUuid.get(path);
            if (uuid) {
                const asset = assetManager.assets.get(uuid);
                asset.addRef();
                return asset;
            }
            return null;
        }

        /**
         * 设置资源加载状态（用于处理并发加载同一资源的情况）
         * @param path 资源路径
         * @example
         * // 在开始加载资源前标记加载状态
         * if (!assetBundleManager.isAssetLoading('characters/hero')) {
         *   assetBundleManager.loadingAsset('characters/hero');
         *   this.loadRemoteAsset('characters/hero', (err, asset) => { ... });
         * }
         */
        public loadingAsset(path: string) {
            this._loadingAssets.set(path, 1);
        }

        /**
         * 检查资源是否正在加载中
         * @param path 资源路径
         * @returns 是否正在加载
         * @example
         * // 避免重复加载正在请求的资源
         * if (assetBundleManager.isAssetLoading('effects/fire')) {
         *   return; // 已有加载中的请求
         * }
         */
        public isAssetLoading(path: string): boolean {
            return this._loadingAssets.has(path);
        }

        /**
         * 标记资源加载完成（无论成功失败都需要调用）
         * @param path 资源路径
         * @example
         * // 在加载回调中始终调用结束标记
         * loadRemoteAsset('bgm/battle', (err, clip) => {
         *   assetBundleManager.assetLoadingEnd('bgm/battle');
         *   // ...处理资源
         * });
         */
        public assetLoadingEnd(path: string) {
            this._loadingAssets.delete(path);
        }

        /**
         * 清空所有缓存资源（切换场景时建议调用）
         * @example
         * // 切换关卡时清理缓存
         * onLevelChange() {
         *   assetBundleManager.clearCachedAssets();
         *   // ...其他清理逻辑
         * }
         */
        public clearCachedAssets() {
            for (const [key, asset] of this._cacheAsset) {
                this.release(asset, true);
            }
            this._cacheAsset.clear();
        }

        public clearBundle(name: string) {
            const bundle = this.getLoadedBundle(name);
            if (bundle == null) return;
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
        }

        /**
         * 顺序预加载多个资源包（支持进度回调）
         * @param paths 需要加载的bundle路径数组
         * @param onProgress 加载进度回调（0-1）
         * @example
         * // 预加载游戏核心资源
         * const bundles = ['base-res', 'characters', 'ui'];
         * assetBundleManager.loadBundles(bundles, (progress) => {
         *   this.loadingBar.progress = progress; // 更新进度条
         * });
         * 
         * // 加载单个bundle
         * assetBundleManager.loadBundles(['dialogue'], null);
         */
        public loadBundles(paths: string[], onProgress: (progress: number) => void): void {
            if (paths == null) {
                onProgress && onProgress(1);
                return;
            }
            this._loadB(paths, 0, onProgress);
        }

        /**
         * 递归加载bundle的内部实现
         * @param paths 所有需要加载的路径数组
         * @param i 当前加载的索引
         * @param callback 进度回调函数
         */
        private _loadB(paths: string[], i: number, callback: (p: number) => void) {
            let p = paths[i];
            let n = paths.length;
            this.loadBundle(p, () => {
                i++;
                callback?.(i / n);
                i < n && this._loadB(paths, i, callback);
            });
        }
        /**
         * 预加载指定资源包内的多个文件资源
         * @param bundleName - 资源包名称（如'characters'、'ui'）
         * @param filePaths - 需要预加载的资源路径数组（相对于资源包的路径）
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 预加载角色包中的纹理和动画资源
         * assetBundleManager.preloadFiles('characters', [
         *   'textures/hero_01',
         *   'animations/attack'
         * ], (p) => {
         *   console.no.log(`加载进度：${(p * 100).toFixed(1)}%`);
         * });
         * 
         * // 预加载UI包中的多个音效文件
         * assetBundleManager.preloadFiles('ui', [
         *   'sounds/click',
         *   'sounds/notification'
         * ], null);
         */
        public preloadFiles(bundleName: string, filePaths: string[], onProgress?: (progress: number) => void): void {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle == null) {
                this.loadBundle(bundleName, () => {
                    this.preloadFiles(bundleName, filePaths, onProgress);
                });
            } else {
                bundle.preload(filePaths, Asset, (finished, total, item) => {
                    onProgress && onProgress(finished / total);
                }, (e, items) => {
                    if (e) no.err('preloadFiles', e.message);
                });
            }
        }

        /**
         * 通用预加载方法（支持混合类型资源加载）
         * @param requests - 预加载请求数组，支持以下格式：
         *   - uuid: 资源唯一标识符
         *   - url: 远程资源地址
         *   - path: 本地资源路径（格式：'bundle/path/to/asset'）
         *   - dir: 目录路径（加载整个目录）
         *   - scene: 场景名称
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 同时预加载场景、目录和单个资源
         * assetBundleManager.preloadAny([
         *   { scene: 'Level2' },
         *   { dir: 'models/enemies' },
         *   { path: 'effects/fire' }
         * ], (p) => {
         *   this.loadingLabel.string = `资源加载中 ${p * 100}%`;
         * });
         * 
         * // 预加载远程服务器资源
         * assetBundleManager.preloadAny([
         *   { url: 'https://cdn.example.com/weapons/sword.png' }
         * ], null);
         */
        public preloadAny(requests: {
            uuid?: string,
            url?: string,
            path?: string,
            dir?: string,
            scene?: string
        }[], onProgress: (progress: number) => void): void {
            assetManager.preloadAny(requests, (finished, total, requestItem) => {
                onProgress && onProgress(finished / total);
            }, (e, items) => {
                if (items == null || items.length == 0) {
                    onProgress && onProgress(1);
                    no.err('preloadAny', requests, e.message);
                }
            });
        }

        /**
         * 预加载指定场景资源
         * @param name - 场景名称（需在构建配置中存在的场景）
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 预加载关卡场景并在完成后跳转
         * assetBundleManager.preloadScene('Level3', (progress) => {
         *   this.progressBar.width = 300 * progress;
         * });
         * 
         * // 静默预加载主菜单场景
         * assetBundleManager.preloadScene('MainMenu', null);
         */
        public preloadScene(name: string, onProgress: (progress: number) => void): void {
            director.preloadScene(name, (finished, total, item) => {
                // 引擎暂不提供精确进度，保留占位符
            }, (err) => {
                if (err) {
                    no.log('preloadScene', name, err.message);
                } else {
                    onProgress && onProgress(1);
                }
            });
        }
        /**
         * 加载资源包（支持本地/远程资源包）
         * @param name - 资源包名称或远程URL地址
         * @param callback - 加载完成回调函数
         * @param force - 是否强制重新加载（默认false）
         * @example
         * // 加载本地resources包
         * assetBundleManager.loadBundle('resources', (bundle) => {
         *   console.no.log('Bundle loaded:', bundle.name);
         * });
         * 
         * // 强制重新加载远程包
         * assetBundleManager.loadBundle('https://cdn.example.com/characters', (b) => {
         *   this.loadCharacterAssets();
         * }, true);
         * 
         * // 加载配置表包
         * assetBundleManager.loadBundle('configs', null);
         */
        public loadBundle(name: string, callback?: (bundle: Bundle) => void, force = false): void {
            let bundle = this.getLoadedBundle(name);
            if (bundle != null) {
                if (force) assetManager.removeBundle(bundle);
                else {
                    callback?.(bundle);
                    return;
                }
            }
            const url = this.bundleUrl(name);
            no.log('load bundle', name, url);
            if (!url) {
                callback?.(null);
                return;
            }
            assetManager.loadBundle(url, { scriptAsyncLoading: false }, (e, b) => {
                no.log('load bundle end', url, e);
                if (e != null) {
                    no.err('loadBundle', url, e.message);
                } else {
                    callback?.(b);
                }
            });
        }

        /**
         * 获取已加载的资源包实例
         * @param name - 资源包名称
         * @returns 已加载的资源包对象，未找到返回null
         * @example
         * // 获取已加载的UI包
         * const uiBundle = assetBundleManager.getLoadedBundle('ui');
         * if (uiBundle) {
         *   this.loadUIComponents();
         * }
         */
        public getLoadedBundle(name: string): Bundle {
            const a = assetManager.getBundle(name);
            if (!a) {
                no.err(`getLoadedBundle 包${name}未加载`);
            }
            return a;
        }

        /**
         * 通用资源加载方法（支持bundle内/远程资源）
         * @param path - 资源路径（支持格式：'bundleName:path/to/asset' 或完整URL）
         * @param type - 资源类型（如SpriteFrame, Prefab等）
         * @param callback - 加载完成回调
         * @example
         * // 加载远程图片
         * assetBundleManager.loadFile('https://example.com/image.png', SpriteFrame, (frame) => {
         *   this.sprite.spriteFrame = frame;
         * });
         * 
         * // 加载bundle内预制体
         * assetBundleManager.loadFile('characters:prefabs/hero', Prefab, (prefab) => {
         *   instantiate(prefab).parent = this.node;
         * });
         * 
         * // 加载本地JSON配置
         * assetBundleManager.loadFile('configs:data/levels', JsonAsset, (json) => {
         *   this.initLevels(json.json);
         * });
         */
        public loadFile(path: string, type: typeof Asset, callback: (asset: Asset) => void): void {
            let p = this.assetPath(path);
            if (p.bundle) {
                this.load(p.bundle, p.path, type, (asset: Asset) => {
                    callback(asset);
                });
            }
            else {
                assetManager.loadAny({ 'url': path }, (e, item) => {
                    if (e) no.err('loadFile', path, e.message);
                    callback(item);
                });
            }
        }

        /**
         * 加载指定资源包内的文件（自动处理包加载依赖）
         * @param bundleName - 资源包名称（空字符串表示加载远程资源）
         * @param fileName - 资源在包内的路径
         * @param type - 资源类型
         * @param callback - 加载完成回调
         * @example
         * // 加载角色包内的动画资源
         * assetBundleManager.load('characters', 'animations/warrior', AnimationClip, (clip) => {
         *   this.anim.addClip(clip);
         * });
         * 
         * // 直接加载远程音效文件
         * assetBundleManager.load('', 'https://example.com/sound.mp3', AudioClip, (audio) => {
         *   this.playSound(audio);
         * });
         * 
         * // 加载本地包内场景资源
         * assetBundleManager.load('scenes', 'level3', SceneAsset, (scene) => {
         *   director.loadScene(scene);
         * });
         */
        public load(bundleName: string, fileName: string, type: typeof Asset, callback: (asset: Asset) => void): void {
            if (bundleName == null || bundleName == '') {
                assetManager.loadAny({ 'url': fileName, 'type': type }, (err, item) => {
                    if (item == null) {
                        no.log('load', fileName, err.message);
                    } else {
                        this.addRef(item);
                    }
                    callback?.(item);
                });
            }
            else {
                let bundle = this.getLoadedBundle(bundleName);
                if (bundle != null) {
                    bundle.load(fileName, type, (error, item) => {
                        if (item == null) {
                            no.err('load', fileName, error.message);
                            no.evn.emit('load_file_fail');
                        } else if (!isValid(item)) {
                            no.err('资源被释放', fileName);
                            no.evn.emit('load_file_fail');
                            item = null;
                        } else {
                            this.addRef(item);
                        }
                        callback?.(item);
                    });
                } else {
                    this.loadBundle(bundleName, () => {
                        this.load(bundleName, fileName, type, callback);
                    });
                }
            }
        }

        /**
         * 加载文本资源文件（支持.txt/.xml/.csv等文本格式）
         * @param path - 资源路径或远程URL地址（格式：'bundle/path/to/file' 或 'http://example.com/data.txt'）
         * @param callback - 加载完成回调函数，接收TextAsset对象
         * @example
         * // 加载本地包内对话文本
         * assetBundleManager.loadText('texts/dialogue', (asset) => {
         *   if (asset) {
         *     const dialogueLines = asset.text.split('\n');
         *     this.showDialogue(dialogueLines);
         *   } else {
         *     console.error('对话文本加载失败');
         *   }
         * });
         * 
         * // 加载远程配置文件
         * const configURL = 'https://example.com/game_config.csv';
         * assetBundleManager.loadText(configURL, (csvAsset) => {
         *   if (csvAsset) {
         *     this.parseConfig(csvAsset.text);
         *   }
         * });
         * 
         * // 加载多语言文本资源
         * const langPath = `localization/${this.currentLang}/ui_text`;
         * assetBundleManager.loadText(langPath, (textAsset) => {
         *   this.uiStrings = JSON.parse(textAsset.text);
         * });
         */
        public loadText(path: string, callback: (item: TextAsset) => void): void {
            this.loadFile(path, TextAsset, callback);
        }

        /**
         * 加载JSON配置文件
         * @param path - JSON文件路径（格式：'bundle/path/to/file' 或远程URL）
         * @param callback - 加载完成回调，接收JsonAsset对象
         * @example
         * // 加载本地游戏配置
         * assetBundleManager.loadJSON('config/game_settings', (asset) => {
         *   if (asset) {
         *     this.difficulty = asset.json.difficultyLevel;
         *     this.enemyCount = asset.json.enemySettings.count;
         *   }
         * });
         * 
         * // 加载远程排行榜数据
         * assetBundleManager.loadJSON('https://api.example.com/leaderboard', (data) => {
         *   this.updateLeaderboard(data?.json);
         * });
         */
        public loadJSON(path: string, callback: (item: JsonAsset) => void): void {
            this.loadFile(path, JsonAsset, callback);
        }

        /**
         * 加载精灵帧资源（适用于UI元素、2D精灵）
         * @param path - 精灵帧路径（格式：'bundle/path/to/spriteFrame'）
         * @param callback - 加载完成回调，接收SpriteFrame对象
         * @example
         * // 加载角色头像
         * assetBundleManager.loadSprite('characters/avatars/hero', (frame) => {
         *   if (frame) {
         *     this.avatar.spriteFrame = frame;
         *   }
         * });
         * 
         * // 加载技能图标
         * assetBundleManager.loadSprite('ui/skill_icons/fireball', (iconFrame) => {
         *   skillButton.getComponent(Sprite).spriteFrame = iconFrame;
         * });
         */
        public loadSprite(path: string, callback: (item: SpriteFrame) => void): void {
            this.loadFile(path, SpriteFrame, callback);
        }

        /**
         * 加载Spine骨骼动画资源
         * @param path - Spine资源路径（格式：'bundle/path/to/spine'）
         * @param callback - 加载完成回调，接收SkeletonData对象
         * @example
         * // 加载角色动画
         * assetBundleManager.loadSpine('spines/characters/warrior', (skeletonData) => {
         *   if (skeletonData) {
         *     const skeleton = this.node.addComponent(sp.Skeleton);
         *     skeleton.skeletonData = skeletonData;
         *     skeleton.setAnimation(0, 'idle', true);
         *   }
         * });
         */
        public loadSpine(path: string, callback: (item: SkeletonData) => void): void {
            this.loadFile(path, SkeletonData, callback);
        }

        /**
         * 加载图集资源（包含多个精灵帧的集合）
         * @param path - 图集路径（格式：'bundle/path/to/atlas'）
         * @param callback - 加载完成回调，接收SpriteAtlas对象
         * @example
         * // 加载UI图集并获取具体精灵帧
         * assetBundleManager.loadAtlas('ui/atlas/main_ui', (atlas) => {
         *   const closeBtnFrame = atlas.getSpriteFrame('close_btn');
         *   this.closeButton.spriteFrame = closeBtnFrame;
         * });
         */
        public loadAtlas(path: string, callback: (item: SpriteAtlas) => void): void {
            this.loadFile(path, SpriteAtlas, callback);
        }

        /**
         * 加载纹理资源（适用于3D模型贴图、背景图等）
         * @param path - 纹理路径（格式：'bundle/path/imgName/texture' 或远程URL）
         * @param callback - 加载完成回调，接收Texture2D对象
         * @example
         * // 加载场景背景纹理
         * assetBundleManager.loadTexture('textures/backgrounds/forest', (texture) => {
         *   this.terrainMaterial.setProperty('mainTexture', texture);
         * });
         * 
         * // 加载远程图片作为动态背景
         * assetBundleManager.loadTexture('https://example.com/dynamic_bg.jpg', (bgTexture) => {
         *   this.bgSprite.spriteFrame = new SpriteFrame(bgTexture);
         * });
         */
        public loadTexture(path: string, callback: (item: Texture2D) => void): void {
            this.loadFile(path, Texture2D, callback);
        }

        /**
         * 加载音频资源（支持mp3/wav等格式）
         * @param path - 音频路径（格式：'bundle/path/to/audio' 或远程URL）
         * @param callback - 加载完成回调，接收AudioClip对象
         * @example
         * // 加载背景音乐
         * assetBundleManager.loadAudio('sounds/bgm_main', (clip) => {
         *   if (clip) {
         *     AudioEngine.playMusic(clip, true);
         *   }
         * });
         * 
         * // 加载远程音效
         * assetBundleManager.loadAudio('https://cdn.example.com/sfx/explosion.mp3', (sfx) => {
         *   this.explosionSound = sfx;
         * });
         */
        public loadAudio(path: string, callback: (item: AudioClip) => void): void {
            this.loadFile(path, AudioClip, callback);
        }

        /**
         * 加载预制体资源（包含节点结构和组件配置）
         * @param path - 预制体路径（格式：'bundle/path/to/prefab'）
         * @param callback - 加载完成回调，接收Prefab对象
         * @example
         * // 实例化UI弹窗预制体
         * assetBundleManager.loadPrefab('ui/popups/settings', (prefab) => {
         *   const popup = instantiate(prefab);
         *   popup.parent = this.canvasNode;
         * });
         */
        public loadPrefab(path: string, callback: (item: Prefab) => void): void {
            this.loadFile(path, Prefab, callback);
        }

        /**
         * 加载动画剪辑资源（包含关键帧动画数据）
         * @param path - 动画路径（格式：'bundle/path/to/animation'）
         * @param callback - 加载完成回调，接收AnimationClip对象
         * @example
         * // 为角色添加攻击动画
         * assetBundleManager.loadAnimationClip('characters/hero/attack', (clip) => {
         *   this.animationComponent.addClip(clip, 'attack');
         *   this.animationComponent.play('attack');
         * });
         */
        public loadAnimationClip(path: string, callback: (item: AnimationClip) => void): void {
            this.loadFile(path, AnimationClip, callback);
        }

        /**
         * 加载材质资源（包含着色器参数配置）
         * @param path - 材质路径（格式：'bundle/path/to/material'）
         * @param callback - 加载完成回调，接收Material对象
         * @example
         * // 更换武器材质
         * assetBundleManager.loadMaterial('materials/weapons/gold', (mat) => {
         *   this.weaponRenderer.setMaterial(0, mat);
         * });
         */
        public loadMaterial(path: string, callback: (item: Material) => void): void {
            this.loadFile(path, Material, callback);
        }

        /**
         * 加载特效资源（包含着色器效果配置）
         * @param path - 特效路径（格式：'bundle/path/to/effect'）
         * @param callback - 加载完成回调，接收EffectAsset对象
         * @example
         * // 应用屏幕后处理特效
         * assetBundleManager.loadEffect('effects/bloom', (effect) => {
         *   this.postProcess.effectAsset = effect;
         * });
         */
        public loadEffect(path: string, callback: (item: EffectAsset) => void): void {
            this.loadFile(path, EffectAsset, callback);
        }

        /**
         * 加载字体资源（支持TTF/位图字体）
         * @param path - 字体路径（格式：'bundle/path/to/font'）
         * @param callback - 加载完成回调，接收Font对象
         * @example
         * // 更换UI字体
         * assetBundleManager.loadFont('fonts/arial', (font) => {
         *   this.label.font = font;
         * });
         */
        public loadFont(path: string, callback: (item: Font) => void): void {
            this.loadFile(path, Font, callback);
        }

        /**
         * 加载二进制数据（适用于自定义数据格式）
         * @param path - 数据路径（格式：'bundle/path/to/buffer'）
         * @param callback - 加载完成回调，接收BufferAsset对象
         * @example
         * // 读取配置文件二进制数据
         * assetBundleManager.loadBuffer('configs/game_data.bin', (buffer) => {
         *   const view = new DataView(buffer.buffer);
         *   this.maxLevel = view.getUint16(0);
         * });
         */
        public loadBuffer(path: string, callback: (item: BufferAsset) => void): void {
            this.loadFile(path, BufferAsset, callback);
        }

        // public loadDragonBonesAtlasAsset(path: string, callback: (item: dragonBones.DragonBonesAtlasAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAtlasAsset, callback);
        // }

        // public loadDragonBonesAsset(path: string, callback: (item: dragonBones.DragonBonesAsset) => void): void {
        //     this.loadFile(path, dragonBones.DragonBonesAsset, callback);
        // }

        /**
         * 批量加载资源文件（支持进度回调与引用计数管理）
         * @param bundleName - 资源包名称（本地或远程包）
         * @param filePaths - 要加载的资源路径数组（格式：['path/to/file1', 'path/to/file2']）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载成功的资源数组）
         * @example
         * // 加载多个UI纹理和预制体
         * assetBundleManager.loadFiles('ui', [
         *   'textures/btn_play',
         *   'prefabs/player_info',
         *   'animations/character'
         * ], (progress) => {
         *   this.loadingBar.progress = progress;
         * }, (items) => {
         *   if (items) {
         *     this.btnTexture = items[0] as ImageAsset;
         *     this.playerPrefab = items[1] as Prefab;
         *   }
         * });
         * 
         * // 加载远程角色包资源
         * assetBundleManager.loadFiles('characters', [
         *   'hero/body',
         *   'hero/weapon'
         * ], null, (models) => {
         *   this.initCharacter(models);
         * });
         */
        public loadFiles<T extends Asset>(bundleName: string, filePaths: string[], onProgress: (progress: number) => void, onComplete: (items: T[]) => void): void {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                bundle.load<T>(filePaths, (finished, total, requestItem) => {
                    onProgress && onProgress(finished / total);
                }, (err, items) => {
                    if (items == null || items.length == 0) {
                        onComplete && onComplete(null);
                        // no.log('loadFiles', filePaths, err.message);
                    } else {
                        for (let i = 0; i < items.length; i++) {
                            this.addRef(items[i]);// 增加引用计数防止自动释放
                            // this.loadDepends(items[i]._uuid);
                        }
                        onComplete && onComplete(items);
                    }
                });
            } else {
                this.loadBundle(bundleName, () => {
                    this.loadFiles(bundleName, filePaths, onProgress, onComplete);
                });
            }
        }

        /**
         * 加载并切换场景
         * @param name - 场景名称（需在构建配置中存在的场景）
         * @param callback - 场景加载完成后的回调函数
         * @example
         * // 加载主菜单场景
         * assetBundleManager.loadScene('MainMenu', () => {
         *   console.no.log('场景切换完成');
         * });
         * 
         * // 带加载过渡的场景切换
         * this.showLoadingScreen();
         * assetBundleManager.loadScene('Level3', () => {
         *   this.hideLoadingScreen();
         * });
         */
        public loadScene(name: string, callback?: () => void): void {
            director.loadScene(name, callback);
        }

        private parseExt(path: string): '.png' | '.jpg' | '.webp' | '.txt' | '.mp3' | '.json' {
            const ext = path.split('.').pop();
            switch (ext) {
                case 'png':
                    return '.png';
                case 'jpg':
                    return '.jpg';
                case 'webp':
                    return '.webp';
                case 'txt':
                    return '.txt';
                case 'mp3':
                    return '.mp3';
                case 'json':
                    return '.json';
            }
            return null;
        }

        /**
         * 从远程服务器加载任意类型资源文件（带缓存机制）
         * @param url - 远程资源完整URL地址
         * @param callback - 加载完成回调函数（成功返回资源实例，失败返回null）
         * @example
         * // 加载远程JSON配置文件
         * assetBundleManager.loadRemoteFile<JsonAsset>('https://cdn.example.com/configs/items.json', (json) => {
         *   if (json) this.initItemConfig(json.json);
         * });
         * 
         * // 加载远程音频文件
         * assetBundleManager.loadRemoteFile<AudioClip>('https://cdn.example.com/sounds/bgm.mp3', (clip) => {
         *   if (clip) audioEngine.playMusic(clip);
         * });
         */
        public loadRemoteFile<T extends Asset>(url: string, callback: (file: T | null) => void) {
            assetManager.loadRemote<T>(url, (err, file) => {
                if (file == null) {
                    no.log('loadRemoteFile', url, err.message);
                    callback?.(null);
                } else {
                    callback?.(file);
                }
            });
        }

        /**
         * 加载远程文本文件（返回文件内容string）,文件内容不缓存
         * @param url - 文本文件URL地址
         * @param callback - 加载完成回调
         * @example
         * // 加载游戏公告文本
         * assetBundleManager.loadRemoteText('https://cdn.example.com/notice.txt', (str) => {
         *   if (str) this.noticeLabel.string = str;
         * });
         */
        public loadRemoteText(url: string, callback: (text: string) => void) {
            this.loadRemoteFile<TextAsset>(url, (file: TextAsset) => {
                if (file) {
                    callback?.(file.text);
                } else {
                    callback?.('');
                }
            });
        }

        public createSpriteFrameWithTrim(imageAsset: ImageAsset, trimPixels: number = 1): SpriteFrame {
            const spriteFrame = SpriteFrame.createWithImage(imageAsset);
            spriteFrame['_uuid'] = uuid();
            if (spriteFrame && spriteFrame.texture && imageAsset.width > trimPixels * 2 && imageAsset.height > trimPixels * 2) {
                // 裁剪边缘，排除边缘的 trimPixels 像素
                const trimRect = rect(
                    trimPixels,
                    trimPixels,
                    imageAsset.width - trimPixels * 2,
                    imageAsset.height - trimPixels * 2
                );
                spriteFrame.rect = trimRect;
                // 调整原始尺寸，使其与实际显示区域一致
                spriteFrame.originalSize = new Size(trimRect.width, trimRect.height);
            }

            return spriteFrame;
        }

        /**
         * 加载远程图片并转换为SpriteFrame（支持PNG/JPG格式）
         * @param url - 图片文件URL地址
         * @param ext - 文件扩展名（必须指定为.png或.jpg）
         * @param callback - 加载完成回调（返回可直接使用的精灵帧）
         * @example
         * // 加载玩家头像
         * assetBundleManager.loadRemoteImage('https://cdn.example.com/avatars/123.png', '.png', (sf) => {
         *   if (sf) this.avatar.spriteFrame = sf;
         * });
         * 
         * // 加载游戏背景图
         * assetBundleManager.loadRemoteImage('https://cdn.example.com/bg/level1.jpg', '.jpg', (sf) => {
         *   if (sf) this.bgImage.spriteFrame = sf;
         * });
         */
        public loadRemoteImage(url: string, callback: (sf: SpriteFrame | null) => void) {
            if (this.remoteAssetsCache[url]?.loading) {
                this.remoteAssetsCache[url].cbs.push(callback);
                return;
            } else if (this.remoteAssetsCache[url]?.asset?.isValid) {
                this.remoteAssetsCache[url].ref++;
                this.remoteAssetsCache[url].t = sysTime.now;
                callback?.(this.remoteAssetsCache[url].asset as SpriteFrame);
            } else {
                this.remoteAssetsCache[url] = { asset: null, t: 0, ref: 0, loading: true, cbs: [callback] };
                this._loadRemoteImage(url);
            }
        }

        private _loadRemoteImage(url: string) {
            assetManager.loadRemote<ImageAsset>(url, null, (err, file) => {
                let sf = null;
                if (file == null) {
                    no.log('loadRemoteImage', url, err.message);
                } else {
                    sf = this.createSpriteFrameWithTrim(file, 1);
                    sf.addRef();
                }
                if (!this.remoteAssetsCache[url]) {
                    this.remoteAssetsCache[url] = { asset: null, t: 0, ref: 0, loading: true, cbs: [] };
                }
                this.remoteAssetsCache[url].loading = false;
                let cbs = this.remoteAssetsCache[url].cbs;
                cbs.forEach(cb => cb(sf));
                if (sf) {
                    this.remoteAssetsCache[url].asset = sf;
                    this.remoteAssetsCache[url].ref = cbs.length;
                    this.remoteAssetsCache[url].t = sysTime.now;
                    this.remoteAssetsCache[url].cbs.length = 0;
                } else {
                    delete this.remoteAssetsCache[url];
                }
            });
        }

        /**
         * 放回远程图片
         * @param url - 图片文件URL地址
         */
        public putbackRemoteImage(uuid: string) {
            let info: any;
            for (const key in this.remoteAssetsCache) {
                info = this.remoteAssetsCache[key];
                if (info.asset?.uuid == uuid) {
                    info.ref--;
                    info.t = sysTime.now;
                    break;
                }
            }
        }

        public preloadRemoteImage(url: string, onComplete?: () => void) {
            this.loadRemoteFile(url, onComplete);

        }

        public async loadRemoteFileAsync<T extends Asset>(url: string): Promise<T | null> {
            return new Promise<T>((resolve, reject) => {
                this.loadRemoteFile<T>(url, (file) => {
                    resolve(file);
                });
            });
        }

        public async loadRemoteImageAsync(url: string): Promise<SpriteFrame | null> {
            return new Promise<SpriteFrame | null>(resolve => {
                this.loadRemoteImage(url, (sf) => {
                    resolve(sf);
                });
            });
        }

        public async preloadRemoteImageAsync(url: string): Promise<void> {
            return new Promise<void>(resolve => {
                this.preloadRemoteImage(url, resolve);
            });
        }

        /**
         * 预加载远程图片
         * @param url - 图片文件URL地址
         * @param onComplete - 加载完成回调
         */
        public preloadRemoteImages(urls: string[], onComplete?: () => void) {
            const promises: Promise<Asset>[] = [];
            let url: string;
            for (let i = 0, n = urls.length; i < n; i++) {
                url = urls[i];
                promises.push(this.loadRemoteFileAsync(url));
            }
            Promise.all(promises).then(() => {
                onComplete?.();
            });
        }

        /**
         * 加载远程资源包（支持版本控制和异步加载配置）
         * @param url - 资源包URL地址
         * @param opts - 加载选项 { version?: 版本号, scriptAsyncLoading?: 是否异步加载脚本 }
         * @param callback - 加载完成回调（返回资源包实例）
         * @example
         * // 加载带版本号的角色资源包
         * assetBundleManager.loadRemoteBundle('https://cdn.example.com/bundles/characters', {
         *   version: '1.2.3',
         *   scriptAsyncLoading: true
         * }, (bundle) => {
         *   if (bundle) this.setupCharacters(bundle);
         * });
         * 
         * // 加载基础资源包（无版本控制）
         * assetBundleManager.loadRemoteBundle('https://cdn.example.com/bundles/base', null, (b) => {
         *   if (b) this.preloadBaseAssets();
         * });
         */
        public loadRemoteBundle(url: string, opts?: { version?: string, scriptAsyncLoading?: boolean }, callback?: (bundle: Bundle) => void) {
            assetManager.loadBundle(url, opts, (e, bundle) => {
                if (e) no.err(e.stack);
                callback?.(bundle);
            });
        }

        private _assetPathCache: { bundle: string, file: string, type: typeof Asset, path: string } = { bundle: '', file: '', type: null, path: '' };
        /**
         * 解析资源路径获取bundle名称、文件名及资源类型
         * @param path - 完整资源路径，格式应为包含assets目录的路径（如：'assets/bundleName/.../fileName.ext'）
         * @returns 包含以下属性的对象:
         *  - bundle: 资源所属bundle名称（当路径不包含有效bundle时返回空）
         *  - file: 文件名（不含扩展名）
         *  - type: 资源类型（根据扩展名自动识别）
         *  - path: 完整资源路径（不含assets前缀和文件扩展名）
         * 
         * @example
         * // 有效路径示例
         * const path1 = 'assets/characters/player/avatar.png';
         * const result1 = assetPath(path1);
         * // 返回: { 
         * //   bundle: 'characters',
         * //   file: 'avatar',
         * //   type: ImageAsset,
         * //   path: 'player/avatar'
         * // }
         * 
         * // 无效路径示例（不包含有效bundle）
         * const path2 = 'assets/invalid_path/test.json';
         * const result2 = assetPath(path2);
         * // 返回: {}
         */
        public assetPath(path: string): AssetPath {
            // 移除路径中的assets前缀并分割路径层级
            path = path.split('/assets/').pop();
            let p = path.split('/');

            this._assetPathCache.bundle = '';
            this._assetPathCache.file = '';
            this._assetPathCache.type = null;
            this._assetPathCache.path = '';
            const bundles: string[] = assetManager['_projectBundles'];
            // 遍历路径层级查找有效bundle名称
            for (let i = 0, n = p.length; i < n; i++) {
                const b = p.shift();
                if (bundles.includes(b)) {
                    this._assetPathCache.bundle = b;
                    break;
                }
            }

            // 未找到有效bundle时返回空对象
            if (!this._assetPathCache.bundle) {
                return this._assetPathCache;
            }

            // 解析文件名和扩展名
            let file = p.pop().split('.');
            let fileType = file.pop();
            this._assetPathCache.file = file.join('.') || fileType;

            // 构建返回对象基础信息
            p[p.length] = this._assetPathCache.file;
            this._assetPathCache.path = p.join('/');

            // 根据文件扩展名确定资源类型
            let s: any;
            if (fileType != null) {
                switch (fileType.toLowerCase()) {
                    case 'json':
                        s = JsonAsset;
                        break;
                    case 'mp3':
                        s = AudioClip;
                        break;
                    case 'png':
                    case 'jpg':
                        s = ImageAsset;
                        break;
                    case 'prefab':
                        s = Prefab;
                        break;
                    case 'atlas':
                        s = SpriteAtlas;
                        break;
                }
                this._assetPathCache.type = s;
            }
            return this._assetPathCache;
        }

        /**
         * 加载指定资源包内的所有文件资源（自动过滤子资源和指定类型）
         * @param bundleName - 要加载的资源包名称（如'characters'、'ui'）
         * @param exceptAssetTypes - 需要排除的资源类型数组（如[AudioClip, TTFFont]）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载的资源数组）
         * @example
         * // 加载整个角色资源包（排除音频和预制体）
         * assetBundleManager.loadAllFilesInBundle(
         *   'characters',
         *   [AudioClip, Prefab],
         *   (p) => console.no.log(`加载进度：${p * 100}%`),
         *   (items) => console.no.log('已加载角色资源', items)
         * );
         * 
         * // 加载整个配置包（不排除任何类型）
         * assetBundleManager.loadAllFilesInBundle(
         *   'configs',
         *   null,
         *   null,
         *   (configs) => this.initGameConfig(configs)
         * );
         */
        public loadAllFilesInBundle(bundleName: string, exceptAssetTypes: (typeof Asset | typeof ImageAsset)[], onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                const assetInfos = bundle['_config'].assetInfos._map;
                let requests: any[] = [];
                // 遍历资源包内所有资源信息
                for (const uuid in assetInfos) {
                    const info = assetInfos[uuid];
                    // 过滤条件：排除子资源（@符号）、无构造函数资源、指定排除类型
                    if (!info.path?.endsWith('/texture') && (uuid.includes('@') || !info.ctor)) continue;
                    if (exceptAssetTypes && exceptAssetTypes.includes(info.ctor)) continue;
                    requests[requests.length] = { uuid: uuid };
                }
                this.loadAnyFiles(requests, onProgress, onComplete);
            } else {
                // 如果资源包未加载，先加载资源包再递归调用
                this.loadBundle(bundleName, () => {
                    this.loadAllFilesInBundle(bundleName, exceptAssetTypes, onProgress, onComplete);
                });
            }
        }

        /**
         * 预加载资源包内的所有主资源（自动过滤子资源）
         * @param bundleName - 要预加载的资源包名称
         * @param onProgress - 预加载进度回调（0-1）
         * @example
         * // 预加载整个UI包
         * assetBundleManager.preloadAllFilesInBundle('ui', (p) => {
         *   this.loadingBar.progress = p;
         * });
         * 
         * // 预加载特效包并在完成后显示进入游戏按钮
         * assetBundleManager.preloadAllFilesInBundle('effects', null, () => {
         *   this.startButton.active = true;
         * });
         * 
         * // 预加载字体包（排除TTF字体）
         * assetBundleManager.preloadAllFilesInBundle('fonts', [TTFFont], (p) => {
         *   console.no.log(`字体预加载进度：${p}`);
         * });
         */
        public preloadAllFilesInBundle(bundleName: string, onProgress?: (progress: number) => void) {
            let bundle = this.getLoadedBundle(bundleName);
            if (bundle != null) {
                const assetInfos = bundle['_config'].assetInfos._map;
                let paths: string[] = [];
                // 收集所有有效资源路径（过滤子资源和不受支持的类型）
                for (const uuid in assetInfos) {
                    const a = assetInfos[uuid];
                    if (a.path && !uuid.includes('@') && this.loadTypes.includes(a.ctor.name)) {
                        paths[paths.length] = a.path;
                    }
                }
                // 直接调用资源包的preload方法进行批量预加载
                bundle.preload(paths, Asset, (finished, total, item: any) => {
                    onProgress && onProgress(finished / total);
                }, (e, items) => {
                    if (e) no.err('preloadFiles', e.message);
                });
            } else {
                // 资源包未加载时先加载资源包
                this.loadBundle(bundleName, () => {
                    this.preloadAllFilesInBundle(bundleName, onProgress);
                });
            }
        }

        /**
         * 加载指定文件夹内的所有资源文件
         * @param folderName - 资源文件夹路径（格式：'assets/bundleName/path/to/folder'）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载的资源数组）
         * @param specialTypes - 指定需要加载的特殊资源类型数组（如只加载[ImageAsset, AudioClip]）
         * @example
         * // 加载角色包中所有模型资源
         * assetBundleManager.loadAllFilesInFolder(
         *   'assets/characters/models',
         *   (p) => console.no.log(`加载进度：${p * 100}%`),
         *   (items) => this.initCharacters(items),
         *   [Mesh, Material]
         * );
         * 
         * // 加载UI包中某个目录下的所有资源
         * assetBundleManager.loadAllFilesInFolder(
         *   'assets/ui/main_menu',
         *   null,
         *   (items) => this.setupMainMenuUI()
         * );
         */
        public loadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void, specialTypes?: typeof Asset[]) {
            // 解析资源路径获取bundle信息
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                no.err(`${folderName}没有设置ab包`);
                return;
            }

            // 确保路径以斜杠结尾用于前缀匹配
            p.path += '/';
            let bundle = this.getLoadedBundle(p.bundle);
            const assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];

            // 遍历资源信息表收集符合要求的资源
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                // 处理特殊类型过滤
                if (specialTypes) {
                    if (info.path?.indexOf(p.path) == 0 && specialTypes.includes(info.ctor))
                        requests[requests.length] = { path: info.path, bundle: p.bundle, type: info.ctor };
                    continue;
                }
                // 跳过子资源（如@texture等）
                if (uuid.includes('@')) continue;
                // 匹配路径前缀
                if (info.path?.indexOf(p.path) == 0) {
                    requests[requests.length] = { path: info.path, bundle: p.bundle, type: info.ctor };
                }
            }
            this.loadAnyFiles(requests, onProgress, onComplete);
        }

        /**
         * 预加载指定文件夹内的所有资源文件
         * @param folderName - 资源文件夹路径（格式：'assets/bundleName/path/to/folder'）
         * @param onProgress - 预加载进度回调（0-1）
         * @param onComplete - 预加载完成回调（返回预加载的资源数组）
         * @example
         * // 预加载音效目录资源
         * assetBundleManager.preloadAllFilesInFolder(
         *   'assets/audio/sound_effects',
         *   (p) => this.updateLoadingBar(p),
         *   (items) => this.onSoundEffectsLoaded()
         * );
         * 
         * // 预加载过场动画资源
         * assetBundleManager.preloadAllFilesInFolder(
         *   'assets/cutscenes/intro',
         *   null,
         *   () => this.playIntroCutscene()
         * );
         */
        public preloadAllFilesInFolder(folderName: string, onProgress: (progress: number) => void, onComplete: (items: Asset[]) => void) {
            let p = this.assetPath(folderName);
            if (p.bundle == '') {
                no.err(`${folderName}没有设置ab包`);
                return;
            }

            let bundle = this.getLoadedBundle(p.bundle);
            // 获取目录下的所有资源信息
            let infos = bundle.getDirWithPath(p.path);
            let requests: { path: string, bundle: string, type: typeof Asset }[] = [];

            // 过滤子资源并构建请求列表
            for (let i = 0; i < infos.length; i++) {
                let a = infos[i];
                if (a.uuid.indexOf('@') == -1) {
                    requests[requests.length] = { path: a.path, bundle: p.bundle, type: Asset };
                }
            }
            this.loadAnyFiles(requests, onProgress, onComplete);
        }

        /**
         * 通过UUID加载资源（自动管理引用计数）
         * @param uuid - 资源唯一标识符
         * @param callback - 加载完成回调函数
         * @example
         * // 加载预制体资源
         * assetBundleManager.loadByUuid<Prefab>('fcmRqXJITKedlPeuQp13S6', (prefab) => {
         *   if (prefab) {
         *     const node = instantiate(prefab);
         *     this.node.addChild(node);
         *   }
         * });
         * 
         * // 加载纹理资源
         * assetBundleManager.loadByUuid<Texture2D>('2emRwXJITKedlPeuQp13SX', (texture) => {
         *   this.spriteFrame.texture = texture;
         * });
         */
        public loadByUuid<T extends Asset>(uuid: string, callback?: (file: T) => void) {
            if (uuid == '') {
                no.err('uuid 为空')
                return;
            }
            assetManager.loadAny({ 'uuid': uuid }, (e: Error, f: T) => {
                if (e != null) {
                    callback?.(f);
                    no.err(uuid, e.stack);
                } else {
                    this.addRef(f);//增加引用计数
                    callback?.(f);
                }
            });
        }

        /**
         * 加载单一资源（支持多种加载方式）
         * @param request 加载请求参数:
         *   - url: 完整资源路径（自动解析bundle和路径）
         *   - path: 相对于包的资源路径
         *   - uuid: 资源唯一标识符
         *   - bundle: 资源包名称
         *   - type: 资源类型（自动推断时可省略）
         * @param callback 加载完成回调
         * @example
         * // 通过完整URL加载角色贴图
         * assetBundleManager.loadAny({
         *   url: 'assets/characters/hero/texture.png',
         *   type: ImageAsset
         * }, (image) => {
         *   this.updateCharacterTexture(image);
         * });
         * 
         * // 通过bundle+path加载音效
         * assetBundleManager.loadAny({
         *   bundle: 'audio',
         *   path: 'sfx/explosion',
         *   type: AudioClip
         * }, (clip) => {
         *   this.playSoundEffect(clip);
         * });
         */
        public loadAny<T extends Asset>(request: { url?: string, path?: string, uuid?: string, bundle?: string, type?: typeof Asset }, callback?: (file: T) => void): void {
            if (request.url) {
                const p = this.assetPath(request.url);
                this.load(p.bundle, p.path, p.type, callback);
            } else if (request.bundle && request.path && request.type) {
                this.load(request.bundle, request.path, request.type, callback);
            } else {
                assetManager.loadAny({ uuid: request.uuid }, (e: Error, f: T) => {
                    if (e != null) {
                        no.err(request.uuid, e.stack);
                    }
                    this.addRef(f);//增加引用计数
                    callback?.(f);
                });
            }
        }

        /**
         * 增加资源引用计数（特殊处理TTF字体资源）
         * @param asset 需要增加引用的资源
         * @example
         * // 加载后手动增加引用
         * assetBundleManager.loadByUuid<Font>('23fRwXJITKedlPeuQp13Sr', (font) => {
         *   this.addRef(font); // 确保字体资源不被自动释放
         * });
         */
        public addRef(asset: Asset): void {
            if (!asset) return;
            if (asset instanceof TTFFont) {
                this._ttfFont[asset._fontFamily] = asset;
            }
            asset.addRef();
            if (asset instanceof SkeletonData) {
                asset.textures.forEach(texture => {
                    texture.addRef();
                });
            }
        }

        /**
         * 减少资源引用计数（延迟0.02秒执行防止同一帧内多次操作）
         * @param asset 需要减少引用的资源
         * @example
         * // 使用完成后安全释放资源
         * onDestroy() {
         *   this.decRef(this.weaponModel); // 递减模型资源引用
         *   this.decRef(this.skillEffect); // 递减特效资源引用
         * }
         */
        public decRef(asset: Asset): void {
            if (!asset) return;
            if (asset.refCount > 0) {
                asset.decRef();
            }
        }

        /**
         * 加载依赖的资源
         * @param uuid 依赖资源的uuid数组
         */
        private loadDepends(uuid: string) {
            return;
            let a: any[] = [];
            let list = assetManager.dependUtil.getDepsRecursively(uuid);
            if (list.length == 0) return;
            list.forEach(uuid => {
                a.push({ uuid: uuid });
            });
            // no.log('loadDepends', a);
            assetManager.loadAny(a, (e, item) => {
                if (item == null) no.err(uuid, e.message);
            });
        }

        /**
         * 释放资源（支持通过资源对象、uuid或SpriteFrame进行释放）
         * @param asset - 需要释放的资源对象/资源uuid/SpriteFrame
         * @param force - 是否强制立即释放（默认false采用延迟释放机制）
         * @example
         * // 释放精灵帧资源
         * const sf = this.getComponent(Sprite).spriteFrame;
         * assetBundleManager.release(sf);
         * 
         * // 通过uuid强制立即释放
         * assetBundleManager.release('23fRwXJITKedlPeuQp13Sr', true);
         * 
         * // 释放预制体资源
         * assetBundleManager.release(this.characterPrefab);
         */
        public release(asset: Asset | string, force = false): void {
            if (!asset) return;
            if (asset instanceof SpriteFrame) {
                asset = asset._uuid;
            }
            if (typeof asset == 'string') {
                asset = asset.split('@')[0];
                asset = assetManager.assets.get(asset);
            }
            if (!asset) return;
            if (force) {
                if (asset instanceof SkeletonData) {
                    asset.textures?.forEach(texture => {
                        assetManager.releaseAsset(texture);
                    });
                }
                assetManager.releaseAsset(asset);
            } else {
                scheduleUtils.scheduleOnce(() => {
                    if (asset instanceof SkeletonData) {
                        asset.textures?.forEach(texture => {
                            texture.decRef();
                        });
                    }
                    (<Asset>asset).decRef();
                }, .02);
            }
        }

        /**
         * 从缓存中获取资源实例
         * @param uuid - 资源唯一标识符
         * @returns 资源实例（可能为null）
         * @example
         * // 获取已缓存的字体资源
         * const font = assetBundleManager.getAssetFromCache('5tH3sK9jQpL2vR8x');
         * if (font) this.label.font = font;
         */
        public getAssetFromCache(uuid: string): Asset {
            return assetManager.assets.get(uuid);
        }

        /**
         * 批量加载多种类型资源（支持混合加载远程/本地资源）
         * @param requests - 加载请求数组，支持以下格式：
         *   - url: 完整远程资源路径（需要带扩展名）
         *   - path: 本地资源路径（格式：'bundle/path/to/asset'）
         *   - uuid: 资源唯一标识符
         *   - bundle: 资源所属包名（当使用path时需要）
         *   - type: 指定资源类型（可选，用于类型断言）
         * @param onProgress - 加载进度回调（0-1）
         * @param onComplete - 加载完成回调（返回加载的资源数组）
         * @example
         * // 混合加载远程图片和本地预制体
         * assetBundleManager.loadAnyFiles([
         *   { 
         *     url: 'https://cdn.example.com/items/sword.png',
         *     type: ImageAsset 
         *   },
         *   {
         *     path: 'characters/hero',
         *     bundle: 'models',
         *     type: Prefab
         *   }
         * ], (progress) => {
         *   console.no.log(`加载进度：${progress * 100}%`);
         * }, (items) => {
         *   if (items.length === 2) {
         *     this.initHero(items[1] as Prefab);
         *   }
         * });
         * 
         * // 通过uuid加载特定资源
         * assetBundleManager.loadAnyFiles([
         *   { uuid: '5tH3sK9jQpL2vR8x' } // 字体资源
         * ], null, (fonts) => {
         *   this.applyGlobalFont(fonts[0]);
         * });
         */
        public loadAnyFiles(requests: { 'url'?: string, 'path'?: string, 'uuid'?: string, 'bundle'?: string, 'type'?: typeof Asset | typeof ImageAsset }[], onProgress?: (progress: number) => void, onComplete?: (items: Asset[]) => void) {
            if (requests.length == 0) {
                onProgress?.(1);
                onComplete?.([]);
                return;
            }
            assetManager.loadAny(requests, (finished, total, requestItem) => {
                onProgress && onProgress(finished / total);
            }, (e, items) => {
                if (e) {
                    onProgress && onProgress(1);
                    onComplete?.([]);
                    no.err('loadAnyFiles', requests, e.stack);
                } else {
                    items = [].concat(items);
                    for (let i = 0; i < items.length; i++) {
                        this.addRef(items[i]);
                    }
                    onComplete?.(items);
                }
            });
        }

        /**
         * 内部方法：单文件加载封装为Promise
         * @param request - 单个加载请求参数
         * @returns Promise包装的加载结果
         * @example
         * // 在async函数中使用
         * const asset = await assetBundleManager._loadAnyFile({
         *   path: 'ui/popups/settings',
         *   bundle: 'interface'
         * });
         */
        private _loadAnyFile(request: { 'url'?: string, 'path'?: string, 'uuid'?: string, 'bundle'?: string, 'type'?: typeof Asset }) {
            return new Promise<Asset>(resolve => {
                this.loadAny(request, item => {
                    resolve(item);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 通过资源路径获取资源UUID
         * @param path - 资源路径（格式：'assets/bundleName/path/to/asset.ext'）
         * @returns 资源唯一标识符或null
         * @example
         * // 获取角色预制体的UUID
         * const uuid = assetBundleManager.getUuidFromPath('assets/characters/hero/prefab.prefab');
         * // 可能返回：'5tH3sK9jQpL2vR8x'
         * 
         * // 获取不存在的资源路径UUID
         * const invalidUuid = assetBundleManager.getUuidFromPath('invalid/path');
         * // 返回：null
         */
        public getUuidFromPath(path: string): string | null {
            let a = this.assetPath(path);
            return this.getLoadedBundle(a.bundle)?.getInfoWithPath(a.path, a.type)?.uuid;
        }

        /**
         * 通过UUID获取资源完整URL地址
         * @param uuid - 资源唯一标识符
         * @returns 可用于远程访问的资源URL
         * @example
         * // 获取角色贴图的下载地址
         * const url = assetBundleManager.getUrlWithUuid('5tH3sK9jQpL2vR8x');
         * // 返回：'https://cdn.example.com/remote/characters/hero/texture.png'
         */
        public getUrlWithUuid(uuid: string): string {
            return assetManager.utils.getUrlWithUuid(uuid);
        }

        /**
         * 根据资源UUID查找所属资源包名称
         * @param uuid - 资源唯一标识符
         * @returns 资源包名称（未找到返回undefined）
         * @example
         * // 查找音效资源所属包
         * const bundleName = assetBundleManager.getBundleNameByUuid('7kL9mN2oPqR4sT6u');
         * // 可能返回：'sound-effects'
         */
        public getBundleNameByUuid(uuid: string): string {
            const bundles = assetManager.bundles;
            let name: string;
            bundles.forEach((bundle, key) => {
                if (bundle.getAssetInfo(uuid)) name = bundle.name;
            });
            return name;
        }

        /**
         * 获取资源包版本号（需资源包已加载）
         * @param bundleName - 资源包名称
         * @returns 当前加载的版本号字符串
         * @example
         * // 获取UI包版本号
         * const version = assetBundleManager.getBundleVersion('ui');
         * // 可能返回：'1.2.3'
         */
        public getBundleVersion(bundleName: string): string {
            return assetManager.downloader.bundleVers[bundleName];
        }

        /**
         * 自动释放远程资源（引用计数为0且超过60秒未使用）
         */
        public autoReleaseRemoteAssets() {
            setInterval(() => {
                let now = sysTime.now;
                let info: any;
                for (const key in this.remoteAssetsCache) {
                    info = this.remoteAssetsCache[key];
                    if (!info.asset?.isValid) {
                        no.log('autoReleaseRemoteAssets', key, 'not valid')
                        delete this.remoteAssetsCache[key];
                        continue;
                    }
                    if (now - info.t > 10) {
                        if (info.ref <= 0) {
                            no.log('autoReleaseRemoteAssets', key);
                            (info.asset as SpriteFrame).texture.destroy();
                            info.asset.destroy();
                            info.asset = null;
                            delete this.remoteAssetsCache[key];
                        }
                    }
                }
            }, 10000);
        }

        public releaseRemoteAssets() {
            let asset: Asset;
            for (const key in this.remoteAssetsCache) {
                asset = this.remoteAssetsCache[key].asset;
                if (asset?.isValid) {
                    asset.decRef();
                }
                if (asset.refCount == 0) {
                    assetManager.releaseAsset(asset);
                }
            }
            this.remoteAssetsCache = {};
        }

        /**
         * 释放所有已加载资源（慎用，会清空所有缓存）
         * @example
         * // 切换场景时彻底清理资源
         * onSceneChange() {
         *   assetBundleManager.clear();
         *   // ...其他清理逻辑
         * }
         */
        public clear(all: boolean = false) {
            this._cacheAsset.forEach(asset => {
                this.release(asset, true);
            });
            this._cacheAsset.clear();
            this._pathToUuid.clear();
            this._loadingAssets.clear();
            this.releaseRemoteAssets();
            if (all) {
                assetManager.releaseAll();
            }
        }

        public clearFontCache() {
            for (const key in this._ttfFont) {
                this.release(this._ttfFont[key], true);
            }
            this._ttfFont = {};
        }

        /**
         * 检查指定路径的资源是否存在于资源包中
         * @param path - 资源路径（格式：'assets/bundleName/path/to/resource'）
         * @returns 资源是否存在
         * @example
         * // 检查角色纹理是否存在
         * if (assetBundleManager.has('assets/characters/hero/texture.png')) {
         *   this.loadCharacterTexture();
         * }
         * 
         * // 验证配置文件是否存在
         * const hasConfig = assetBundleManager.has('assets/configs/game_settings.json');
         */
        public has(path: string) {
            const p = this.assetPath(path);
            let bundle = this.getLoadedBundle(p.bundle);
            if (bundle != null) {
                return bundle['_config'].paths.has(p.path);
            } else {
                no.err(`assetBundleManager [has]:${p.bundle}未加载`, path);
                return false;
            }
        }

        /**
         * 从缓存获取纹理或创建新纹理（自动缓存管理）
         * @param img - 图像资源对象
         * @returns 关联的Texture2D对象
         * @example
         * // 获取或创建角色贴图纹理
         * assetBundleManager.loadAny({url: 'assets/characters/hero.png'}, (image) => {
         *   const texture = assetBundleManager.getCachedTexture(image);
         *   this.sprite.texture = texture;
         * });
         */
        public getCachedTexture(img: ImageAsset): Texture2D | null {
            const uuid = img._uuid;
            let texture = this.getCachedAsset<Texture2D>(uuid);
            if (!texture) {
                texture = new Texture2D();
                texture.image = img;
                this.cacheAsset(uuid, texture);
            }
            return texture;
        }

        /**
         * 获取缓存的资源对象
         * @param k - 资源唯一标识符（uuid或url）
         * @returns 缓存的资源实例
         * @example
         * // 获取缓存的音效资源
         * const clip = assetBundleManager.getCachedAsset<AudioClip>('sfx/explosion');
         * audioSource.playOneShot(clip);
         */
        public getCachedAsset<T>(k: string): T {
            return this._cacheAsset.get(k) as T;
        }

        /**
         * 缓存资源对象（支持自定义键名）
         * @param k - 资源唯一标识符（uuid或自定义键名）
         * @param asset - 要缓存的资源对象
         * @example
         * // 缓存网络加载的纹理
         * assetBundleManager.loadRemoteImage('https://example.com/bg.jpg', '.jpg', (sf) => {
         *   assetBundleManager.cacheAsset('remote_bg', sf.texture);
         * });
         */
        public cacheAsset(k: string, asset: any) {
            this._cacheAsset.set(k, asset);
        }

        /**
         * 清理缓存资源并释放引用
         * @param k - 要清理的资源标识符
         * @example
         * // 清理过期的场景资源
         * onSceneUnload() {
         *   assetBundleManager.cleanCacheAsset('scene1_bg_texture');
         *   assetBundleManager.cleanCacheAsset('23fRwXJITKedlPeuQp13Sr');
         * }
         */
        public cleanCacheAsset(k: string) {
            let asset = this._cacheAsset.get(k);
            if (asset) {
                assetBundleManager.decRef(asset);
                this._cacheAsset.delete(k);
                this._cacheAsset.delete(asset._uuid);
            }
        }

        /**
         * 缓存纹理资源并初始化引用计数
         * @param image - 需要缓存的Texture2D纹理对象
         * @example
         * // 缓存新加载的纹理资源
         * assetBundleManager.loadRemoteImage('https://example.com/icon.png', '.png', (sf) => {
         *   if (sf.texture) assetBundleManager.cacheImage(sf.texture);
         * });
         */
        public cacheImage(image: Texture2D) {
            this.cacheAsset(image._uuid, image);
            this._cacheAssetRef[image._uuid] = { ref: 0, time: sysTime.now };
            this.releaseUnuseImage();
        }

        /**
         * 检查指定uuid的图片是否已缓存
         * @param uuid - 资源唯一标识符
         * @returns 是否存在于缓存中
         * @example
         * // 检查角色头像是否已缓存
         * if (!assetBundleManager.hasImage('char_avatar_123')) {
         *   this.loadCharacterAvatar();
         * }
         */
        public hasImage(uuid: string): boolean {
            return !!this.getCachedAsset(uuid);
        }

        /**
         * 获取图集JSON配置信息（用于动态图集操作）
         * @param uuid - 图集资源uuid
         * @returns 图集JSON配置
         * @example
         * // 获取UI图集配置信息
         * const atlasConfig = assetBundleManager.getCachedAtlasJson('ui_atlas_01');
         * if (atlasConfig) this.parseAtlas(atlasConfig);
         */
        public getCachedAtlasJson(uuid: string) {
            return this.getCachedAsset(uuid);
        }

        /**
         * 从缓存获取纹理并增加引用计数
         * @param uuid - 纹理资源uuid
         * @returns Texture2D对象或null
         * @example
         * // 获取缓存纹理并设置给精灵
         * const texture = assetBundleManager.getTextureFromCache('item_icon_456');
         * if (texture) this.itemSprite.spriteFrame.texture = texture;
         */
        public getTextureFromCache(uuid: string): Texture2D | null {
            const image = this.getCachedAsset<Texture2D>(uuid);
            if (!image) return null;

            let a = this._cacheAssetRef[image._uuid];
            a.ref++;
            a.time = sysTime.now;
            return image;
        }

        /**
         * 通过缓存纹理创建精灵帧（自动关联纹理）
         * @param uuid - 纹理资源uuid
         * @returns 新创建的SpriteFrame对象
         * @example
         * // 动态创建技能图标精灵帧
         * const sf = assetBundleManager.createSpriteFrameFromCache('skill_icon_789');
         * if (sf) this.skillButton.spriteFrame = sf;
         */
        public createSpriteFrameFromCache(uuid: string): SpriteFrame | null {
            const t = this.getTextureFromCache(uuid);
            if (!t) return null;
            const s = new SpriteFrame();
            s._uuid = uuid;
            s.texture = t;
            return s;
        }

        /**
         * 减少缓存图片的引用计数（当引用为0且超时后会被自动释放）
         * @param uuid - 纹理资源uuid
         * @example
         * // 在节点销毁时减少引用
         * onDestroy() {
         *   assetBundleManager.deRefCachedImage('player_equip_tex');
         * }
         */
        public deRefCachedImage(uuid: string) {
            let a = this._cacheAssetRef[uuid];
            if (!a) return;
            a.ref--;
            a.time = sysTime.now;
            this.releaseUnuseImage();
        }

        /**
         * 获取缓存图片的详细信息（引用计数和缓存时间）
         * @param uuid - 纹理资源uuid
         * @returns 包含引用计数和缓存时间的对象
         * @example
         * // 调试特定纹理的缓存状态
         * const info = assetBundleManager.getCachedImageInfo('boss_texture');
         * console.no.log(`引用次数：${info.ref} 缓存时间：${Date.now() - info.time}ms`);
         */
        public getCachedImageInfo(uuid: string) {
            return this._cacheAssetRef[uuid];
        }

        /**
         * 显示所有缓存的图片信息（用于调试）
         * @example
         * // 在控制台查看当前所有缓存的图片状态
         * assetBundleManager.showCachedImage();
         * // 输出示例：
         * // <<<<<<<<缓存的Image
         * //     uuid: skill_icon_123,
         * //     ref: 2,
         * //     time: 45000
         * // >>>>>>>> 
         */
        public showCachedImage() {
            const now = sysTime.now;
            for (const uuid in this._cacheAssetRef) {
                const a = this._cacheAssetRef[uuid];
                no.log(`
                    <<<<<<<<缓存的Image
                        uuid: ${uuid},
                        ref: ${a.ref},
                        time: ${now - a.time}
                    >>>>>>>>
                    `);
            }
        }

        /**
         * 自动释放未使用的图片资源（引用计数为0且超过60秒未使用）
         * @private 内部维护用，通常不需要手动调用
         * @example
         * // 在定时任务中自动清理
         * setInterval(() => {
         *   assetBundleManager['releaseUnuseImage']();
         * }, 30000);
         */
        private releaseUnuseImage() {
            const now = sysTime.now;
            for (const k in this._cacheAssetRef) {
                const a = this._cacheAssetRef[k];
                if (a.ref < 1 && now - a.time > 60) {
                    warn('释放未使用的图片资源', k);
                    this.removeCachedImage(k);
                }
            }
        }

        /**
         * 强制移除指定缓存图片（立即释放资源）
         * @param uuid - 要移除的纹理资源uuid
         * @example
         * // 手动释放不再需要的大图资源
         * assetBundleManager.removeCachedImage('scene_bg_high_quality');
         * 
         * // 在场景切换时清理资源
         * onSceneChange() {
         *   assetBundleManager.removeCachedImage('previous_scene_textures');
         * }
         */
        public removeCachedImage(uuid: string) {
            // 注意：这里显式调用destroy可能导致重复释放，具体取决于引擎管理方式
            // this._cacheAsset[uuid]?.destroy();
            this._cacheAsset.delete(uuid);
            delete this._cacheAssetRef[uuid];
            this.release(uuid, true);
        }

        private loadTypes: string[] = ['Texture2D', 'Prefab', 'JsonAsset'];

        /**
         * 加载目录下所有资源并放入缓存中（支持预制体/纹理/JSON类型）
         * @param folder - 资源目录路径（格式：'assets/bundleName/path/to/folder'）
         * @param onComplete - 加载完成回调
         * @example
         * // 加载UI目录下的所有资源到缓存
         * assetBundleManager.loadFolderFilesToCache('assets/ui/main_menu', () => {
         *   console.no.log('主菜单资源已缓存完成');
         *   this.showMainMenu();
         * });
         * 
         * // 加载角色包中的配置目录
         * assetBundleManager.loadFolderFilesToCache('assets/characters/configs');
         */
        public loadFolderFilesToCache(folder: string, onComplete?: () => void) {
            const p = this.assetPath(folder);
            no.log('loadFolderFilesToCache', p);
            if (p.bundle) {
                const bundle = this.getLoadedBundle(p.bundle),
                    infos = bundle.getDirWithPath(p.path),
                    base = 'db://' + bundle.base.replace(this.server + 'remote', 'assets');
                let requests: { path?: string, uuid?: string }[] = [];
                for (let i = 0; i < infos.length; i++) {
                    const a = infos[i];
                    if (a.uuid.indexOf('@') == -1 && this.loadTypes.includes(a.ctor.name)) {
                        requests[requests.length] = { path: a.path, uuid: a.uuid };
                    }
                }
                this.loadAnyFiles(requests, null, items => {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item instanceof Prefab) {
                        } else if (item instanceof Texture2D) {
                            this.cacheImage(item);
                        } else if (item instanceof JsonAsset) {
                            this.cacheAsset(item._uuid, item.json);
                        }
                    }
                    onComplete?.();
                });
            }
        }

        /**
         * 加载指定资源包内的所有预制体资源
         * @param bundleName - 要加载的资源包名称
         * @param onComplete - 加载完成回调
         * @example
         * // 加载特效包中的所有预制体
         * assetBundleManager.loadAllPrefabsInBundle('effects', () => {
         *   this.initializeSpecialEffects();
         * });
         * 
         * // 加载NPC预制体后实例化
         * assetBundleManager.loadAllPrefabsInBundle('npcs', () => {
         *   const npcPrefab = assetBundleManager.getAssetFromCache('npc_01');
         *   this.spawnNPC(instantiate(npcPrefab));
         * });
         */
        public loadAllPrefabsInBundle(bundleName: string, onComplete?: () => void) {
            const bundle = this.getLoadedBundle(bundleName),
                assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                if (info.ctor?.name == 'Prefab')
                    requests[requests.length] = info.path;
            }
            bundle.load(requests, onComplete);
        }

        /**
         * 加载指定资源包内的所有图片资源
         * @param bundleName - 要加载的资源包名称
         * @param type - 图片资源类型（Texture2D: 纹理对象 / SpriteFrame: 精灵帧 / ImageAsset: 原始图片数据）
         * @param onComplete - 加载完成回调
         * @example
         * // 加载UI包中的所有纹理
         * assetBundleManager.loadAllImagesInBundle('ui', 'Texture2D', () => {
         *   this.updateAllUITextures();
         * });
         * 
         * // 加载角色包中的精灵帧
         * assetBundleManager.loadAllImagesInBundle('characters', 'SpriteFrame', () => {
         *   this.setupCharacterPortraits();
         * });
         * 
         * // 加载原始图片数据用于处理
         * assetBundleManager.loadAllImagesInBundle('gallery', 'ImageAsset', () => {
         *   this.processImageData();
         * });
         */
        public loadAllImagesInBundle(bundleName: string, type: 'Texture2D' | 'SpriteFrame' | 'ImageAsset', onComplete?: () => void) {
            const bundle = this.getLoadedBundle(bundleName),
                assetInfos = bundle['_config'].assetInfos._map;
            let requests: any[] = [];
            for (const uuid in assetInfos) {
                const info = assetInfos[uuid];
                if (info.ctor?.name == type)
                    requests[requests.length] = info.path;
            }
            bundle.load(requests, onComplete);
        }

        /**
         * 根据资源类型名称获取对应的资源类定义
         * @param typeName - 资源类型名称（不区分大小写）
         * @returns 对应的资源类构造函数，未找到时返回null
         * @example
         * // 获取纹理资源类
         * const textureType = assetBundleManager.getAssetTypeByName('texture2d');
         * // textureType === Texture2D
         * 
         * // 动态加载预制体资源
         * const prefabType = assetBundleManager.getAssetTypeByName('Prefab');
         * assetBundleManager.loadAny({ path: 'ui/popup', bundle: 'interface', type: prefabType }, (prefab) => {
         *   instantiate(prefab).parent = this.node;
         * });
         */
        public getAssetTypeByName(typeName: string): typeof Asset | typeof ImageAsset {
            switch (typeName.toLowerCase()) {  // 添加小写转换增强容错性
                case 'imageasset':
                    return ImageAsset;
                case 'texture2d':
                    return Texture2D;
                case 'prefab':
                    return Prefab;
                case 'jsonasset':
                    return JsonAsset;
                default:
                    return null;
            }
        }

        /**
         * 预加载所有配置的远程资源包（自动处理依赖关系）
         * @param cb - 全部加载完成后的回调函数
         * @example
         * // 游戏启动时预加载所有远程包
         * assetBundleManager.preloadRemoteBundles(() => {
         *   this.showMainMenu();
         * });
         * 
         * // 关卡加载前预加载资源
         * onLevelStart(levelId) {
         *   assetBundleManager.remoteBundles = [`level_${levelId}_assets`];
         *   assetBundleManager.preloadRemoteBundles(() => this.initLevel());
         * }
         * 
         * // 带进度显示的预加载
         * assetBundleManager.preloadRemoteBundles(() => {
         *   console.no.log('所有远程资源加载完成');
         * });
         */
        public preloadRemoteBundles(cb?: () => void) {
            const bundles = this.remoteBundles.slice();  // 创建副本避免原数组被修改
            if (!bundles.length) return cb?.();

            no.log('开始预加载远程包', bundles);
            this.loadBundles(bundles, (progress) => {
                // 可在此处添加进度更新逻辑
                if (progress >= 1) {
                    no.log('预加载远程包完成');
                    cb?.();
                }
            });
        }
    }

    /**全局资源管理器 */
    export const assetBundleManager = new AssetBundleManager();

    /**
     * 资源加载管理器（处理resources包内资源的加载和缓存）
     * @example
     * // 初始化游戏时预加载核心资源
     * resourcesLoader.preloadFiles(['textures/icon', 'sounds/click'], (p) => {
     *   console.no.log(`预加载进度: ${p * 100}%`);
     * });
     * 
     * // 动态加载角色预制体
     * resourcesLoader.load('characters/hero', Prefab, (prefab) => {
     *   if (prefab) instantiate(prefab).parent = this.node;
     * });
     */
    class ResourcesLoader {
        /** 资源路径到UUID的映射缓存 */
        private _pathToUuid: Map<string, string> = new Map();
        /** 正在加载中的资源记录（用于防止重复加载） */
        private _loadingAssets: Map<string, number> = new Map();

        /**
         * 预加载多个资源文件
         * @param filePaths - 需要预加载的资源路径数组（格式：'textures/icon'）
         * @param onProgress - 加载进度回调（0-1）
         * @example
         * // 预加载界面所需资源
         * resourcesLoader.preloadFiles([
         *   'ui/main/button',
         *   'ui/main/bg',
         *   'fonts/main_font'
         * ], (progress) => {
         *   this.loadingBar.progress = progress;
         * });
         */
        public preloadFiles(filePaths: string[], onProgress?: (progress: number) => void): void {
            resources.preload(filePaths, Asset, (finished, total, item) => {
                onProgress && onProgress(finished / total);
            }, (e, items) => {
                if (e) no.err('preloadFiles', e.message);
            });
        }

        /**
         * 异步加载指定资源（自动处理缓存和引用计数）
         * @param path - 资源路径（格式：'db://assets/resources/textures/icon' 或 'textures/icon'）
         * @param type - 资源类型（支持引擎所有Asset派生类型）
         * @param onComplete - 加载完成回调（失败时返回null）
         * @example
         * // 加载音效资源
         * resourcesLoader.load('sounds/explosion', AudioClip, (clip) => {
         *   if (clip) audioSource.playOneShot(clip);
         * });
         * 
         * // 加载JSON配置
         * resourcesLoader.load('configs/level1', JsonAsset, (jsonAsset) => {
         *   if (jsonAsset) this.levelConfig = jsonAsset.json;
         * });
         * 
         * // 加载失败处理
         * resourcesLoader.load('invalid/path', Texture2D, (texture) => {
         *   if (!texture) this.showErrorToast('资源加载失败');
         * });
         */
        public load(path: string, type: typeof Asset, onComplete: (asset: Asset) => void) {
            const uuid = this._pathToUuid.get(path);
            if (uuid) {
                const asset = assetManager.assets.get(uuid);
                asset.addRef();
                return onComplete?.(asset);
            };

            // 防止重复加载
            if (this._loadingAssets.has(path)) {
                warn(`资源 ${path} 正在加载中，请勿重复请求`);
                return;
            }
            this._loadingAssets.set(path, 1);

            // 转换资源路径格式
            const p = path.replace('db://assets/resources/', '');
            resources.load(p, type, null, (e, asset) => {
                if (e) {
                    no.err('resources.load', path, e.stack);
                    return onComplete?.(null);
                }

                // 缓存路径到UUID的映射
                this._pathToUuid.set(path, asset._uuid);
                asset.addRef(); // 增加引用计数防止自动释放
                onComplete?.(asset);
                this.assetLoadingEnd(path);
            });
        }

        /**
         * 从缓存中立即获取已加载的资源（不会触发异步加载）
         * @param path - 资源路径
         * @param type - 资源类型
         * @returns 已缓存的资源实例或null
         * @example
         * // 快速获取已加载的纹理
         * const texture = resourcesLoader.loadInCache('effects/fire', Texture2D);
         * if (texture) this.sprite.texture = texture;
         */
        public loadInCache(path: string, type: typeof Asset) {
            const uuid = this._pathToUuid.get(path);
            if (uuid) {
                const asset = assetManager.assets.get(uuid);
                asset.addRef();
                return asset;
            }
            return null;
        }

        /**
         * 检查指定资源是否正在加载中
         * @param path - 资源路径
         * @returns 是否处于加载状态
         * @example
         * // 防止重复加载
         * if (!resourcesLoader.isAssetLoading('ui/popup')) {
         *   resourcesLoader.load('ui/popup', Prefab, this.showPopup.bind(this));
         * }
         */
        public isAssetLoading(path: string): boolean {
            return this._loadingAssets.has(path);
        }

        /**
         * 标记资源加载完成（内部维护用）
         * @param path - 资源路径
         * @example
         * // 在自定义加载流程中手动标记
         * customLoader.load('model', (model) => {
         *   resourcesLoader.assetLoadingEnd('characters/model');
         * });
         */
        public assetLoadingEnd(path: string) {
            this._loadingAssets.delete(path);
        }
    }
    /**resources包资源加载器 */
    export const resourcesLoader = new ResourcesLoader();



    /**
     * 在编辑器模式下获取资源（仅在Cocos Creator编辑器环境下可用）
     * @example
     * // 获取场景中使用的纹理资源信息
     * const textureInfo = await EditorMode.getAssetInfo('fcmR3XnlRK6QHYdTQxFc1S');
     * 
     * // 批量加载角色图集资源
     * const atlases = await EditorMode.loadSpriteAtlas(['characters/hero.plist', 'characters/enemy.plist']);
     */
    export namespace EditorMode {

        /**
         * 获取资源信息（支持跨包查询）
         * @param param 资源标识符，可以是uuid/url/path
         * @returns 资源信息对象（包含uuid、路径、类型等元数据）
         * @example
         * // 通过uuid查询
         * const info = await EditorMode.getAssetInfo('fcmR3XnlRK6KdTQxFc1S');
         * 
         * // 通过路径查询
         * const sceneInfo = await EditorMode.getAssetInfo('db://assets/resources/scenes/Main.fire');
         */
        export async function getAssetInfo(param: string) {
            return Editor.Message.request('asset-db', 'query-asset-info', param);
        }

        /**
         * 获取资源元数据（包含导入选项、依赖关系等）
         * @param url 资源url（格式：db://assets/...）
         * @returns 资源元数据对象
         * @example
         * // 获取预制体的元数据
         * const meta = await EditorMode.getAssetMeta('db://assets/resources/prefabs/Player.prefab');
         */
        export async function getAssetMeta(url: string) {
            return Editor.Message.request('asset-db', 'query-asset-meta', url);
        }

        /**
         * 获取指定类型的所有资源信息
         * @param ccType 资源类型标识，支持：'cc.SpriteFrame' | 'cc.AudioClip' | 'cc.Prefab' 等
         * @returns 符合类型的所有资源信息数组
         * @example
         * // 获取所有预制体资源
         * const prefabs = await EditorMode.getAssetInfosByCCType('cc.Prefab');
         */
        export async function getAssetInfosByCCType(ccType: string) {
            return Editor.Message.request('asset-db', 'query-assets', { ccType: ccType });
        }

        /**
         * 获取所有Asset Bundle配置信息
         * @returns 包含所有Asset Bundle信息的数组
         * @example
         * // 获取所有资源包信息
         * const bundles = await EditorMode.getBundleInfos();
         * console.log('当前项目包含的包:', bundles.map(b => b.name));
         */
        export async function getBundleInfos() {
            return Editor.Message.request('asset-db', 'query-assets', { isBundle: true });
        }

        /**
         * 获取所有Asset Bundle名称
         * @returns 资源包名称数组
         * @example
         * // 列出所有资源包名称
         * const bundleNames = await EditorMode.getBundleNames();
         * console.log('资源包列表:', bundleNames);
         */
        export async function getBundleNames() {
            return getBundleInfos().then(infos => {
                let names = [];
                for (let i = 0, n = infos.length; i < n; i++) {
                    names.push(infos[i].name);
                }
                return names;
            });
        }

        /**
         * 根据资源UUID获取完整资源路径
         * @param uuid 资源唯一标识符
         * @returns 格式为'bundleName/path/to/asset'的资源路径
         * @example
         * // 获取角色预制体路径
         * const path = await EditorMode.getAssetUrlByUuid('fcmR3XnlRK6KdTQxFc1S');
         * console.log('资源路径:', path); // 输出：'resources/prefabs/Player'
         */
        export async function getAssetUrlByUuid(uuid: string) {
            return Promise.all([getAssetInfo(uuid), getBundleNames()]).then(([info, bundleNames]) => {
                const url: string = info.path.replace('ad://assets/', '');
                const a: string[] = url.split('/')
                let bundleName = null;
                for (let i = 0, n = a.length; i < n; i++) {
                    if (bundleNames.includes(a[i])) {
                        bundleName = a[i];
                        break;
                    }
                }
                return bundleName ? `${bundleName}${url.split(bundleName)[1]}` : url;
            });
        }

        /**
         * 根据资源路径获取UUID
         * @param url 资源路径（格式：'bundleName/path/to/asset'）
         * @returns 资源唯一标识符
         * @example
         * // 获取主场景的UUID
         * const uuid = await EditorMode.getAssetUuidByUrl('resources/scenes/Main');
         */
        export async function getAssetUuidByUrl(url: string) {
            return getAssetInfo(url).then(info => {
                return info?.uuid;
            });
        }

        /**
         * 通用资源加载方法
         * @param url 资源路径（格式：'bundleName/path/to/asset'）
         * @returns 加载完成的资源对象
         * @example
         * // 加载SpriteFrame
         * const texture = await EditorMode.loadAnyFile<cc.SpriteFrame>('resources/textures/icon');
         */
        export async function loadAnyFile<T extends Asset>(url: string) {
            const uuid = await getAssetUuidByUrl(url);
            console.log('loadAnyFile', uuid);
            if (!uuid) {
                return null;
            }
            return new Promise<T>(resolve =>
                assetBundleManager.loadByUuid<T>(uuid, asset => resolve(asset))
            ).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 批量加载图集资源
         * @param urls 图集路径或路径数组（支持.plist或图集资源路径）
         * @returns 加载完成的图集资源数组
         * @example
         * // 加载多个图集
         * const atlases = await EditorMode.loadSpriteAtlas([
         *   'ui/atlas/common',
         *   'ui/atlas/equipment'
         * ]);
         */
        export async function loadSpriteAtlas(urls: string | string[]) {
            let requests: any[] = [];
            urls = [].concat(urls);
            for (let i = 0, n = urls.length; i < n; i++) {
                let info = await getAssetInfo(urls[i]);
                if (!info)
                    no.log('query-asset-info url无效', urls[i]);
                else {
                    requests[requests.length] = { 'uuid': info.uuid };
                }
            }
            if (!requests.length) {
                return [];
            }

            return new Promise<any>(resolve => {
                assetBundleManager.loadAnyFiles(requests, null, items => {
                    resolve(items);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }

        /**
         * 获取指定文件夹下特定类型的资源信息
         * @param folderUrl 文件夹路径（格式：'bundleName/path/to/folder'）
         * @param ccType 资源类型标识
         * @returns 符合条件的资源信息数组
         * @example
         * // 获取resources/audio下所有音频资源信息
         * const audioInfos = await EditorMode.loadAssetInfosOfCCTypeUnderFolder('resources/audio', 'cc.AudioClip');
         */
        export async function loadAssetInfosOfCCTypeUnderFolder(folderUrl: string, ccType: string) {
            return getAssetInfosByCCType(ccType).then((infos: any[]) => {
                let a: _AssetInfo[] = [];
                for (let i = 0, n = infos.length; i < n; i++) {
                    const info = infos[i];
                    if (info.url.indexOf(folderUrl) > -1) a[a.length] = info;
                }
                return a;
            });
        }

        /**
         * 加载指定文件夹下特定类型的所有资源
         * @param folderUrl 文件夹路径
         * @param ccType 资源类型标识
         * @returns 加载完成的资源数组
         * @example
         * // 加载resources/items下所有预制体
         * const items = await EditorMode.loadAssetsOfCCTypeUnderFolder('resources/items', 'cc.Prefab');
         */
        export async function loadAssetsOfCCTypeUnderFolder(folderUrl: string, ccType: string): Promise<Asset[]> {
            const infos: any[] = await getAssetInfosByCCType(ccType);
            let aa = [];
            for (let i = 0; i < infos.length; i++) {
                const a = infos[i];
                if (a['url'].indexOf(folderUrl) > -1) {
                    aa[aa.length] = { uuid: a.uuid };
                }
            }
            if (!aa.length) {
                return [];
            }
            return new Promise<Asset[]>(resolve => {
                assetBundleManager.loadAnyFiles(aa, null, items => {
                    resolve(items);
                });
            }).catch(e => {
                console.error(e);
                return [];
            });
        }

        /**
         * 根据名称和类型精确查找资源信息
         * @param name 完整文件名（包含扩展名）
         * @param ccType 资源类型标识
         * @returns 匹配的资源信息
         * @example
         * // 查找主场景预制体
         * const sceneInfo = await EditorMode.getAssetInfoOfCCTypeWithName('Main.fire', 'cc.SceneAsset');
         */
        export async function getAssetInfoOfCCTypeWithName(name: string, ccType: string) {
            return getAssetInfosByCCType(ccType).then((infos: _AssetInfo[]) => {
                let info: _AssetInfo;
                for (let i = 0, n = infos.length; i < n; i++) {
                    const asset = infos[i];
                    if (asset.name == name) {
                        info = asset;
                        break;
                    }
                }
                return info;
            });
        }

        /**
         * 获取指定文件夹下的所有Asset Bundle
         * @param folderUrl 文件夹路径
         * @returns 资源包名称数组
         * @example
         * // 获取resources/bundles下的所有资源包
         * const bundles = await EditorMode.getBundlesUnderFolder('resources/bundles');
         */
        export async function getBundlesUnderFolder(folderUrl: string) {
            return getBundleInfos().then(infos => {
                let bundles: string[] = [];
                for (let i = 0, n = infos.length; i < n; i++) {
                    const info = infos[i];
                    if (info.url.indexOf(folderUrl) == 0)
                        bundles[bundles.length] = info.name;
                }
                return bundles;
            });
        }

        /**
         * 根据资源路径解析所属Asset Bundle
         * @param url 资源路径
         * @returns 所属资源包名称
         * @example
         * // 解析资源所属包
         * const bundle = await EditorMode.getBundleName('characters/hero/hero.prefab');
         * console.log('资源所属包:', bundle); // 输出：'characters'
         */
        export async function getBundleName(url: string) {
            return getBundleInfos().then(infos => {
                const a: string[] = url.replace('ad://assets/', '').split('/');
                for (let i = 0, n = a.length; i < n; i++) {
                    const name = a[i];
                    for (let j = 0, m = infos.length; j < m; j++) {
                        if (infos[j].name == name) {
                            return infos[j].name;
                        }
                    }
                }
                return null;
            });
        }

        /**
         * 根据文件名智能识别并获取资源信息
         * @param fileName 完整文件名（包含扩展名）
         * @returns 匹配的资源信息
         * @example
         * // 获取字体资源信息
         * const fontInfo = await EditorMode.getAssetInfoByFileName('arial.ttf');
         */
        export async function getAssetInfoByFileName(fileName: string) {
            const p = fileName.split('.'),
                ext = p[p.length - 1];
            let ccType: string;
            switch (ext) {
                case 'png':
                case 'jpg':
                case 'jpeg':
                case 'bmp':
                case 'gif':
                    ccType = 'cc.SpriteFrame';
                    break;
                case 'plist':
                    ccType = 'cc.SpriteAtlas';
                    break;
                case 'json':
                    ccType = 'cc.JsonAsset';
                    break;
                case 'txt':
                    ccType = 'cc.TextAsset';
                    break;
                case 'ttf':
                    ccType = 'cc.TTFFont';
                    break;
                case 'mp3':
                case 'wav':
                case 'ogg':
                    ccType = 'cc.AudioClip';
                    break;
                case 'prefab':
                    ccType = 'cc.Prefab';
                    break;
                default:
            }
            return getAssetInfoOfCCTypeWithName(fileName, ccType);
        }

        /**
         * 根据文件名加载资源
         * @param fileName 完整文件名（包含扩展名）
         * @returns 加载完成的资源对象
         * @example
         * // 加载背景音乐
         * const bgm = await EditorMode.getAssetByFileName<cc.AudioClip>('background.mp3');
         */
        export async function getAssetByFileName<T extends Asset>(fileName: string) {
            return getAssetInfoByFileName(fileName).then(info => {
                console.log('info', info);
                if (info) {
                    return new Promise<T>(resolve =>
                        assetBundleManager.loadByUuid<T>(info.uuid, asset => resolve(asset))
                    ).catch(e => {
                        console.error(e);
                        return null;
                    });
                }
                return null;
            });
        }
    }
}