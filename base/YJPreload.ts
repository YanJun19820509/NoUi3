
import { EDITOR, ccclass, property, menu, executeInEditMode, Component, Node, CCString, JsonAsset, Prefab, instantiate, Texture2D } from '../yj';
import { no } from '../no';
import { YJComponent } from './YJComponent';
import { YJDataWork } from './YJDataWork';
import { YJPreloadDelegate } from './YJPreloadDelegate';

/**
 * Predefined variables
 * Name = YJPreload
 * DateTime = Fri Jan 14 2022 18:07:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPreload.ts
 * FileBasenameNoExtension = YJPreload
 * URL = db://assets/Script/common/base/YJPreload.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * 预加载状态枚举
 * @enum {number}
 * @example
 * // 典型使用场景：
 * // 1. 跟踪资源加载流程的不同阶段
 * // 2. 控制异步加载的顺序逻辑
 * 
 * @example
 * // 使用示例：
 * async function loadResources() {
 *     let state = PreloadState.LoadingBundles;
 *     while (state !== PreloadState.End) {
 *         switch (state) {
 *             case PreloadState.LoadingBundles:
 *                 await loadRemoteBundles();
 *                 state = PreloadState.LoadingFiles;
 *                 break;
 *             // ...其他状态处理
 *         }
 *     }
 * }
 */
const enum PreloadState {
    /**
     * 结束状态（所有加载完成）
     */
    End = -1,
    /**
     * 正在加载远程包阶段（首帧加载远程资源包）
     */
    LoadingBundles = 0,
    /**
     * 正在加载单个文件（通过直接URL加载特定资源）
     */
    LoadingFiles,
    /**
     * 正在加载包内所有文件（加载指定资源包的全部内容）
     */
    LoadingBundleFiles,
    /**
     * 正在加载文件夹内文件（递归加载指定目录所有资源）
     */
    LoadingFolderFiles,
    /**
     * 正在加载JSON文件（加载并解析JSON配置文件）
     */
    LoadingJsonFiles,
    /**
     * 正在加载预制体文件（预实例化预制体前的加载阶段）
     */
    LoadingPrefabFiles,
    /**
     * 正在加载场景（场景切换前的资源准备阶段）
     */
    LoadingScene
}

/**
 * 预制体文件信息配置类
 * @description 用于在编辑器中配置预制体文件信息，并自动获取资源元数据
 * @example
 * // 编辑器使用示例：
 * // 1. 在属性检查器中拖入预制体资源
 * // 2. 点击"Check"按钮或在代码中调用check()方法
 * // 3. 将自动生成资源名称、UUID和URL信息
 */
@ccclass('PrefabFileInfo')
export class PrefabFileInfo {
    /**
     * 预制体资源（仅编辑器使用）
     * @description 在编辑器中拖入预制体后，调用check()将自动转换为元数据
     */
    @property({ type: Prefab, editorOnly: true })
    prefab: Prefab = null;
    /**
     * 资源名称（自动生成/只读）
     * @description 通过check()方法从预制体资源中提取的文件名
     */
    @property({ readonly: true, editorOnly: true })
    name: string = '';
    /**
     * 资源UUID（自动生成/只读）
     * @description 通过check()方法获取的预制体唯一标识符
     */
    @property({ readonly: true })
    _uuid: string = '';
    /**
     * 资源路径（自动生成/只读）
     * @description 通过check()方法获取的预制体在项目中的相对路径
     */
    @property({ readonly: true, editorOnly: true })
    url: string = '';

    /**
     * 资源检查与元数据获取
     * @description 在编辑模式下获取预制体的元数据信息
     * @example
     * // 代码调用示例：
     * const prefabInfo = new PrefabFileInfo();
     * prefabInfo.prefab = somePrefab; // 编辑器拖入预制体
     * await prefabInfo.check(); // 生成name/uuid/url信息
     */
    public async check() {
        if (this.prefab) {
            let info = await Editor.Message.request('asset-db', 'query-asset-info', this.prefab._uuid);
            this.name = info.name;
            this._uuid = info.uuid;
            this.url = info.url;
            this.prefab = null; // 清除原始预制体引用，仅保留元数据
        }
    }
}

@ccclass('YJPreload')
@menu('NoUi/base/YJPreload(资源预加载)')
@executeInEditMode()
export class YJPreload extends YJComponent {
    /** 是否预加载远程资源包（需要先配置远程资源服务器地址） */
    @property({ displayName: '预加载远程包' })
    preloadRemoteBundles: boolean = false;
    
    /** 需要加载的资源包名称列表（例如：['base', 'ui']） */
    @property({ type: CCString, displayName: '加载包' })
    bundles: string[] = [];

    /** 需要单独加载的完整文件路径列表（格式："bundleName/path/to/file"） */
    @property({ type: CCString, displayName: '加载单个文件' })
    files: string[] = [];

    /** 需要加载整个资源包下所有文件的包名列表（例如：['character']将加载character包内所有资源） */
    @property({ type: CCString, displayName: '加载包下所有文件' })
    bundleFiles: string[] = [];

    /** 需要加载指定文件夹下所有文件的路径列表（格式："bundleName/folder/path"） */
    @property({ type: CCString, displayName: '加载文件夹下所有文件' })
    folderFiles: string[] = [];

    /** 需要加载JSON文件的文件夹路径列表（格式："bundleName/json/folder"） */
    @property({ type: CCString, displayName: '加载json文件夹' })
    jsonFiles: string[] = [];
    
    /** Prefab文件配置列表（在编辑器中拖入预制体后自动生成元数据） 
     * @example
     * // 编辑器操作：
     * 1. 点击+号添加条目
     * 2. 将预制体拖入prefab属性框
     * 3. 点击check按钮生成元数据
     */
    @property({ type: PrefabFileInfo, displayName: '加载prefab文件' })
    prefabFiles: PrefabFileInfo[] = [];
    
    /** 是否在添加prefab后自动执行元数据检查（生成name/uuid/url信息） */
    @property({ displayName: '加了prefab后check一下' })
    needCheck: boolean = false;
    
    /** 是否预加载纹理资源（启用后会显示纹理相关配置项） */
    @property({ displayName: '预加载纹理' })
    loadTexture: boolean = false;
    
    /** 需要单独加载的纹理路径列表（格式："bundleName/textures/xxx"） */
    @property({ type: CCString, displayName: '加载单个纹理', visible() { return this.loadTexture; } })
    texturePaths: string[] = [];
    
    /** 需要加载整个文件夹下纹理的路径列表（格式："bundleName/textures/folder"） */
    @property({ type: CCString, displayName: '加载文件夹下所有纹理', visible() { return this.loadTexture; } })
    textureFolders: string[] = [];

    /** 当前预加载阶段占整体进度比例（用于多阶段加载时控制进度条显示比例） 
     * @example
     * // 当有多个YJPreload组件时：
     * 第一个组件maxProgress=0.5，第二个组件maxProgress=1
     * 表示第一个组件占50%总进度，第二个组件占剩余50%
     */
    @property({ displayName: '加载进度占比', min: 0, max: 1 })
    maxProgress: number = 1;

    /** 预加载完成后要跳转的场景路径（格式："sceneName"或"bundleName/sceneName"） 
     * @example
     * // 跳转到base包中的main场景：
     * "main" 或 "base/main"
     */
    @property({ displayName: '跳转的场景' })
    scene: string = '';

    /** 是否在组件启用时自动开始加载（设为false时可手动调用a_startLoad()触发） */
    @property({ displayName: '自动运行' })
    auto: boolean = true;

    /** 数据组件绑定（用于实时更新加载进度数据）
     * @example
     * // 在YJDataWork中绑定：
     * total -> 总任务数
     * finished -> 已完成数 
     * progress -> 当前进度（0-1）
     */
    @property({ type: YJDataWork, tooltip: '设置加载进度相关数据：总量total，完成量finished，阶段进度progress' })
    dataWork: YJDataWork = null;

    /** 预加载开始前执行的回调事件列表（适合做加载前的资源检查或界面准备） 
     * @example
     * // 添加加载开始音效：
     * 事件目标：AudioManager
     * 组件方法：playOneShot
     * 参数：'audio/load_start'
     */
    @property({ type: no.EventHandlerInfo, displayName: '加载前' })
    beforeCall: no.EventHandlerInfo[] = [];

    /** 预加载完成后执行的回调事件列表（适合做界面切换或加载完成通知） 
     * @example
     * // 显示加载完成弹窗：
     * 事件目标：UIManager
     * 组件方法：showToast
     * 参数：'资源加载完成'
     */
    @property({ type: no.EventHandlerInfo, displayName: '加载完成' })
    completeCall: no.EventHandlerInfo[] = [];

    /** 预加载过程委托处理器（用于实现自定义加载逻辑） */
    @property({ type: YJPreloadDelegate })
    delegate: YJPreloadDelegate = null;

    // 以下为运行时内部状态管理属性
    private fileInfo: Map<string, string[]>;  // 存储包名与文件路径的映射关系
    private state: PreloadState;              // 当前预加载状态（准备中/加载中/完成）
    private loadNext: boolean;                // 是否继续加载下一个资源
    private progress: number = 0;             // 当前阶段进度值（0-maxProgress）
    private total: number = 0;                // 总任务数量
    private finished: number = 0;             // 已完成任务数量
    private showNewScene: boolean = false;    // 是否显示新场景的标记

    /**
     * 组件启用时自动触发预加载流程
     * @description 根据配置决定是否预加载远程资源包后开始加载
     * @example
     * // 编辑器配置示例：
     * // 1. 勾选preloadRemoteBundles自动预加载远程资源包
     * // 2. 设置auto=true在组件启用时自动开始加载
     */
    protected onEnable(): void {
        if (EDITOR) return;
        if (this.preloadRemoteBundles) {
            no.assetBundleManager.preloadRemoteBundles(() => {
                this.auto && this.a_startLoad();
            });
        } else {
            this.auto && this.a_startLoad();
        }
    }

    /**
     * 启动预加载流程（可通过事件绑定手动触发）
     * @description 预加载标准流程：
     * 1. 执行委托的预处理
     * 2. 触发前置回调事件
     * 3. 初始化加载状态
     * 4. 开始加载资源包
     * 5. 加载贴图资源（如果配置需要）
     * @example
     * // 通过按钮点击手动触发加载：
     * button.node.on(Button.EventType.CLICK, () => {
     *     preloadComponent.a_startLoad();
     * });
     */
    public a_startLoad(): void {
        this.delegate?.beforeStartLoad(this);
        no.EventHandlerInfo.execute(this.beforeCall);
        this.addUpdateHandlerByFrame(this.checkState, 1);
        this.init();
        this.loadBundles();
        if (this.loadTexture) this.loadTextures();
    }

    /**
     * 延迟加载目标场景（通常由completeCall触发）
     * @description 使用0.5秒延迟避免画面卡顿，实际项目可根据需要调整延迟时间
     * @example
     * // 在completeCall中添加场景切换：
     * 事件目标：当前预加载组件
     * 组件方法：showScene
     */
    public showScene() {
        this.showNewScene && this.scheduleOnce(() => {
            no.assetBundleManager.loadScene(this.scene, null);
        }, 0.5);
    }

    /**
     * 初始化预加载参数
     * @description 准备加载所需数据结构，收集需要加载的bundle和文件信息
     * 1. 重置进度参数
     * 2. 解析files配置中的资源路径
     * 3. 收集所有需要加载的bundle名称
     * 4. 按bundle分类存储需要加载的文件路径
     * 5. 计算总任务数（所有配置项数量之和）
     * 
     * @example
     * // 初始化后的数据结构示例：
     * fileInfo = Map{
     *   'ui': ['prefabs/main.prefab', 'textures/icon.png'],
     *   'characters': ['models/hero.model']
     * }
     * total = bundles数量 + fileInfo条目数 + 其他配置项数量
     */
    private init() {
        this.finished = 0;
        this.progress = 0;
        this.fileInfo = new Map<string, string[]>();
        // 解析files配置中的每个路径
        for (let i = 0; i < this.files.length; i++) {
            let path = this.files[i];
            let p = no.assetBundleManager.assetPath(path);
            let b = p.bundle;
            // 收集需要加载的bundle名称（去重）
            if (this.bundles.indexOf(b) == -1) {
                this.bundles.push(b);
            }
            // 按bundle分类存储文件路径
            if (!this.fileInfo.has(b)) {
                this.fileInfo.set(b, []);
            }
            let f = p.path;
            let j = this.fileInfo.get(b);
            if (j.indexOf(f) == -1) {
                j.push(f);
            }
        }
        // 计算总任务数 = 各配置项数量之和 + 场景加载标记
        this.total = this.bundles.length + this.fileInfo.size + this.bundleFiles.length 
            + this.folderFiles.length + this.jsonFiles.length + this.prefabFiles.length 
            + (this.scene != '' ? 1 : 0);
    }

    /**
     * 加载配置的资源包
     * @description 首阶段加载流程：
     * 1. 设置加载状态为LoadingBundles
     * 2. 检查是否有需要加载的bundle
     * 3. 调用资源管理器加载所有bundle
     * 4. 在完成回调中更新进度并触发下一步
     * 
     * @example
     * // 配置示例：
     * bundles = ['ui', 'characters']
     * // 手动调用示例：
     * this.loadBundles();
     */
    protected loadBundles() {
        this.state = PreloadState.LoadingBundles;
        if (this.bundles.length == 0) {
            this.loadNext = true;
            return;
        }
        // 加载所有配置的bundle，进度回调处理
        no.assetBundleManager.loadBundles(this.bundles, (p) => {
            if (p == 1) { // 当单个bundle加载完成时
                this.finished++;
                this.loadNext = true; // 标记可以继续下一步加载
            }
        });
    }

    /**
     * 加载单独配置的文件资源
     * @description 第二阶段加载流程：
     * 1. 遍历fileInfo中分类存储的文件路径
     * 2. 按bundle分组加载指定路径的资源文件
     * @example
     * // 配置示例：
     * files = ['ui/icon', 'characters/hero']
     * // 将按bundle分组加载：
     * // - 加载ui包下的icon资源
     * // - 加载characters包下的hero资源
     */
    protected loadFiles() {
        this.state = PreloadState.LoadingFiles;
        if (this.fileInfo.size == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadFilesInFileInfo(0);
        }
    }

    /**
     * 加载整个资源包的所有文件
     * @description 第三阶段加载流程：
     * 1. 遍历bundleFiles配置的包名列表
     * 2. 加载每个资源包内的全部资源
     * @example
     * // 配置示例：
     * bundleFiles = ['characters', 'effects']
     * // 将加载characters和effects资源包内的所有文件
     * // 适用于需要完整加载整个资源包的场景
     */
    protected loadBundleFiles() {
        this.state = PreloadState.LoadingBundleFiles;
        if (this.bundleFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadFilesInBundle(0);
        }
    }

    /**
     * 加载指定文件夹下的所有文件
     * @description 第四阶段加载流程：
     * 1. 遍历folderFiles配置的文件夹路径
     * 2. 递归加载每个文件夹内的所有资源
     * @example 
     * // 配置示例：
     * folderFiles = ['scenes/level1', 'audio/bgm']
     * // 将加载：
     * // - scenes包下level1文件夹内所有资源（包括子文件夹）
     * // - audio包下bgm文件夹内所有音频资源
     * // 适用于需要按目录结构加载资源的场景
     */
    protected loadFolderFiles() {
        this.state = PreloadState.LoadingFolderFiles;
        if (this.folderFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadFilesInFolder(0);
        }
    }

    /**
     * 加载JSON配置文件
     * @description 第五阶段加载流程：
     * 1. 遍历jsonFiles配置的JSON文件夹路径
     * 2. 加载并解析所有JSON文件
     * 3. 自动处理配置文件依赖关系
     * @example
     * // 配置示例：
     * jsonFiles = ['config/level', 'lang/zh-CN']
     * // 将加载：
     * // - config包下level文件夹内所有.json文件
     * // - lang包下zh-CN文件夹内所有语言配置文件
     * // 适用于需要预加载游戏配置、本地化文件等场景
     */
    protected loadJsonFiles() {
        this.state = PreloadState.LoadingJsonFiles;
        if (this.jsonFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadJsonFilesInFolder(0);
        }
    }

    /**
     * 加载预制体文件并进行预实例化
     * @description 第六阶段加载流程：
     * 1. 遍历prefabFiles配置的预制体信息
     * 2. 异步加载所有预制体资源
     * 3. 设置优化策略（optimizationPolicy=2表示高频率实例化优化）
     * 4. 预实例化并执行缓存对象的preCreate方法
     * @example
     * // 配置示例：
     * prefabFiles = [
     *     { url: 'prefabs/characters/hero' }, // 战士预制体
     *     { url: 'prefabs/ui/dialog' }       // 对话框预制体
     * ]
     * // 将完成：
     * // 1. 预加载预制体资源
     * // 2. 设置优化策略提升实例化性能
     * // 3. 预生成对象池缓存
     * // 适用于需要快速实例化的高频使用对象
     */
    protected loadPrefabFiles() {
        this.state = PreloadState.LoadingPrefabFiles;
        if (this.prefabFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            // 构建资源请求列表
            let request = [];
            for (let i = 0; i < this.prefabFiles.length; i++) {
                request[request.length] = { url: this.prefabFiles[i].url };
            }
            this.finished += request.length;
            
            // 执行批量加载
            no.assetBundleManager.loadAnyFiles(request, 
                // 加载进度回调
                p => {
                    if (p == 1) {
                        this.progress = 0;
                        this.loadNext = true;
                    } else {
                        this.progress = p / this.total;
                    }
                }, 
                // 加载完成回调
                items => {
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i] as Prefab;
                        // 设置优化策略（2=高频实例化优化）
                        item.optimizationPolicy = 2;
                        
                        // 预实例化并执行缓存初始化
                        let a = instantiate(item);
                        // 调用缓存对象的预创建方法（如果存在）
                        a.getComponent('YJCacheObject')?.['preCreate']();
                    }
                }
            );
        }
    }

    /**
     * 场景预加载方法
     * @description 执行场景资源的预加载，更新加载进度，并在完成后设置场景切换标志
     * @example
     * // 编辑器配置：
     * 1. 在组件属性面板设置scene字段为"scene/Level1"
     * 2. 确保场景资源已添加到构建配置
     * 
     * // 代码调用：
     * this.loadScene(); // 手动触发场景预加载
     */
    protected loadScene() {
        this.showNewScene = false;
        this.state = PreloadState.LoadingScene;
        // 场景路径为空时直接完成
        if (this.scene == '') {
            this.finished = this.total;
            return;
        }
        this.progress = 0.9 / this.total;
        // 通过资源管理器预加载场景
        no.assetBundleManager.preloadScene(this.scene, (p) => {
            if (p == 1) {
                this.progress = 0;
                this.finished++;
                this.showNewScene = true; // 设置场景切换标志
            } else {
                this.progress = p / this.total; // 更新整体进度比例
            }
        });
    }

    /**
     * 更新方法
     * @description 驱动预加载流程的状态机，处理编辑器模式下的资源检查
     * @example
     * // 运行时流程示例：
     * 1. loadNext=true时触发状态切换
     * 2. 按顺序执行: 加载包→加载文件→加载包文件→加载文件夹→加载JSON→加载Prefab→加载场景
     * 
     * // 编辑器操作示例：
     * 1. 添加prefab后勾选needCheck属性
     * 2. 自动执行prefab元数据检查生成url等信息
     */
    update() {
        if (EDITOR) {
            // 编辑器模式下的prefab元数据检查
            if (this.needCheck) {
                this.needCheck = false;
                for (let i = 0; i < this.prefabFiles.length; i++) {
                    this.prefabFiles[i].check(); // 生成prefab的元数据信息
                }
            }
        } else {
            // 运行时状态机驱动
            if (this.loadNext) {
                this.loadNext = false;
                switch (this.state) {
                    case PreloadState.LoadingBundles:
                        this.loadFiles(); // 加载远程包完成，开始加载单独文件
                        break;
                    case PreloadState.LoadingFiles:
                        this.loadBundleFiles(); // 文件加载完成，开始加载整个包
                        break;
                    case PreloadState.LoadingBundleFiles:
                        this.loadFolderFiles(); // 包文件加载完成，开始加载文件夹
                        break;
                    case PreloadState.LoadingFolderFiles:
                        this.loadJsonFiles(); // 文件夹加载完成，开始加载JSON
                        break;
                    case PreloadState.LoadingJsonFiles:
                        this.loadPrefabFiles(); // JSON加载完成，开始加载Prefab
                        break;
                    case PreloadState.LoadingPrefabFiles:
                        this.loadScene(); // Prefab加载完成，开始预加载场景
                        break;
                }
            }
        }
    }

    /**
     * 检查预加载状态并更新进度
     * @returns 是否完成所有加载任务
     * @example
     * // 在自定义加载流程中手动检查状态：
     * while(this.checkState()) {
     *     await this.loadNextResources();
     * }
     * 
     * // 进度更新时会自动通过dataWork组件广播：
     * // dataWork.data结构: 
     * // {
     * //   total: 总任务数,
     * //   finished: 已完成数,
     * //   progress: 当前阶段进度（0-1）,
     * //   allProgress: 整体进度（0-1）
     * // }
     */
    private checkState(): boolean {
        // 获取当前整体进度基准值
        const p = this.dataWork?.data.allProgress || 0;
        if (this.finished >= this.total) {
            // 全部加载完成时的处理
            if (this.dataWork) {
                // 更新数据工作器的进度数据
                this.dataWork.data = {
                    total: this.total,
                    finished: this.finished,
                    progress: this.progress * this.maxProgress,
                    allProgress: p + (this.progress + this.finished / this.total) * this.maxProgress
                }
            }
            // 通知代理加载完成
            this.delegate?.onLoadComplete();
            // 延迟0.5秒触发完成回调（确保后续逻辑执行）
            this.scheduleOnce(() => {
                no.EventHandlerInfo.execute(this.completeCall);
            }, 0.5);
            return false;
        } else {
            // 更新进行中的进度数据
            if (this.dataWork) {
                this.dataWork.data = {
                    total: this.total,
                    finished: this.finished,
                    progress: this.progress * this.maxProgress,
                    allProgress: p + (this.progress + this.finished / this.total) * this.maxProgress
                }
            }
            return true;
        }
    }

    /**
     * 递归加载资源包中的文件列表
     * @param index 当前加载的资源包索引
     * @example
     * // 手动触发特定包的加载：
     * this.loadFilesInFileInfo(0);
     * 
     * // 自定义加载流程示例：
     * // 1. 先加载基础包
     * no.assetBundleManager.loadFiles('base', ['textures/logo'], (p) => {});
     * // 2. 再通过本方法加载后续资源
     * this.loadFilesInFileInfo(1);
     */
    private loadFilesInFileInfo(index: number) {
        let b = this.bundles[index];
        if (b == null) {
            this.loadNext = true; // 触发下一阶段加载
            return;
        }
        // 获取当前资源包的文件列表
        let files = this.fileInfo.get(b);
        if (files == null) {
            // 跳过空包继续下一个
            this.loadFilesInFileInfo(index + 1);
            return;
        }
        // 实际加载逻辑
        no.assetBundleManager.loadFiles(b, files, (p) => {
            if (p == 1) {
                // 单个包加载完成
                this.progress = 0;
                this.finished++;
                // 递归加载下一个包
                this.loadFilesInFileInfo(index + 1);
            } else {
                // 更新当前包加载进度
                this.progress = p / this.total;
            }
        }, null);
    }

    /**
     * 加载指定资源包内的所有文件
     * @param index 当前加载的资源包索引（对应bundleFiles数组下标）
     * @example
     * // 编辑器配置示例：
     * 1. 在bundleFiles中添加'character'包名
     * 2. 运行时将自动加载character包内所有资源
     * 
     * @example
     * // 代码调用示例：
     * // 手动触发特定包的加载（需确保已初始化）：
     * this.loadFilesInBundle(0);
     * 
     * // 自定义加载流程示例：
     * // 1. 先加载基础包
     * no.assetBundleManager.loadBundle('base');
     * // 2. 再通过本方法加载完整资源包
     * this.loadFilesInBundle(0);
     */
    private loadFilesInBundle(index: number) {
        // 获取当前要加载的资源包名称
        let b = this.bundleFiles[index];
        // 当所有包加载完成时触发下一阶段
        if (b == null) {
            this.loadNext = true;
            return;
        }
        // 跳过空包配置项
        if (b == '') {
            this.loadFilesInBundle(index + 1);
            return;
        }
        
        // 实际执行资源包加载
        no.assetBundleManager.preloadAllFilesInBundle(b, (p: number) => {
            if (p == 1) {
                // 当前包加载完成时：
                this.progress = 0;      // 重置进度计数器
                this.finished++;        // 完成计数器+1
                this.loadFilesInBundle(index + 1); // 递归加载下一个包
            } else {
                // 更新当前包加载进度（按总任务数比例计算）
                this.progress = p / this.total;
            }
        });
    }

    /**
     * 加载指定文件夹下的所有资源文件
     * @param index 当前加载的文件夹索引（对应folderFiles数组下标）
     * @example
     * // 编辑器配置示例：
     * 1. 在folderFiles中添加'ui/home'路径
     * 2. 运行时将递归加载ui/home目录下所有资源
     * 
     * @example
     * // 代码调用示例：
     * // 手动触发特定文件夹的加载（需确保已初始化）：
     * this.loadFilesInFolder(0);
     * 
     * // 自定义加载流程示例：
     * // 1. 先加载基础界面资源
     * no.assetBundleManager.loadBundle('ui');
     * // 2. 再通过本方法加载具体界面文件夹
     * this.loadFilesInFolder(0);
     */
    private loadFilesInFolder(index: number) {
        // 获取当前要加载的文件夹路径
        let b = this.folderFiles[index];
        // 当所有文件夹加载完成时触发下一阶段
        if (b == null) {
            this.loadNext = true;
            return;
        }
        // 跳过空路径配置项
        if (b == '') {
            this.loadFilesInFolder(index + 1);
            return;
        }

        // 执行文件夹资源预加载
        no.assetBundleManager.preloadAllFilesInFolder(b, 
            // 加载进度回调
            (p) => {
                if (p == 1) {
                    // 当前文件夹加载完成：
                    this.progress = 0;      // 重置进度计数器
                    this.finished++;        // 完成计数器+1
                    this.loadFilesInFolder(index + 1); // 递归加载下一个文件夹
                } else {
                    // 更新当前加载进度（按总任务数比例计算）
                    this.progress = p / this.total;
                }
            }, 
            // 加载完成后的资源处理回调
            items => {
                // 此处可添加资源后处理逻辑，例如：
                // 1. 预制体优化设置（降低运行时实例化开销）
                // 2. 预创建对象缓存（提升运行时性能）
                // 3. 资源依赖分析（记录加载的资产信息）
                
                // 示例代码（需取消注释使用）：
                // items.forEach(item => {
                //     if (item instanceof Prefab) {
                //         // 设置预制体优化策略为自动合并
                //         item.optimizationPolicy = 2; 
                //         // 预创建实例并初始化缓存组件
                //         let instance = instantiate(item);
                //         instance.getComponent('YJCacheObject')?.['preCreate']();
                //     }
                // });
            }
        );
    }

    /**
     * 加载指定文件夹下的所有JSON文件
     * @param index 当前要处理的jsonFiles数组索引
     * @example
     * // 配置示例：
     * jsonFiles: ['base/config']  // 加载base包config目录下所有json
     * // 使用场景：
     * // - 加载游戏配置表
     * // - 加载本地化文本
     * // - 加载关卡数据
     */
    private loadJsonFilesInFolder(index: number) {
        let b = this.jsonFiles[index];
        // 结束条件：处理完所有配置项
        if (b == null) {
            this.loadNext = true;
            return;
        }
        // 跳过空路径配置
        if (b == '') {
            this.loadJsonFilesInFolder(index + 1);
            return;
        }
        
        // 加载文件夹内所有JSON文件
        no.assetBundleManager.loadAllFilesInFolder(b, (p) => {
            // 进度更新处理
            if (p == 1) {
                this.progress = 0;      // 重置当前进度
                this.finished++;        // 完成计数器+1
            } else {
                // 计算整体进度（当前文件进度/总任务数）
                this.progress = p / this.total;
            }
        }, async (items: JsonAsset[]) => {
            // 加载完成回调
            this.delegate?.onJsonLoaded(items); // 通知代理处理加载的JSON
            this.loadJsonFilesInFolder(index + 1); // 递归处理下一个配置
        }, [JsonAsset]); // 指定只加载JSON类型资源
    }

    /**
     * 加载纹理资源
     * @description 处理两种加载方式：
     * 1. 加载单独指定的纹理文件
     * 2. 加载整个文件夹下的纹理
     * @example
     * // 单独纹理配置示例：
     * texturePaths: ['ui/textures/icon_skill']
     * // 文件夹纹理配置示例：
     * textureFolders: ['characters/common']
     * // 使用建议：
     * // - 大图使用单独加载
     * // - 小图集使用文件夹加载
     */
    private loadTextures() {
        // 处理单独纹理路径
        let requests: any[] = [];
        for (let i = 0; i < this.texturePaths.length; i++) {
            const path = this.texturePaths[i];
            const p = no.assetBundleManager.assetPath(path);
            // 构造纹理加载请求（自动添加/texture后缀）
            requests[requests.length] = { 
                path: p.path + '/texture', // Cocos纹理资源路径规范
                bundle: p.bundle,          // 所属资源包
                type: Texture2D            // 指定资源类型
            };
        }
        // 批量加载单独纹理
        no.assetBundleManager.loadAnyFiles(requests);
        
        // 处理纹理文件夹
        for (let i = 0; i < this.textureFolders.length; i++) {
            let folder = this.textureFolders[i];
            no.assetBundleManager.loadAllFilesInFolder(folder, 
                null, // 不监听进度（由上层统一处理）
                (items) => {
                    // 此处可添加纹理后处理逻辑：
                    // 1. 生成纹理图集
                    // 2. 预缓存纹理资源
                    // 3. 初始化材质球
                    // console.log(items.length)
                }, 
                [Texture2D] // 指定只加载纹理类型
            );
        }
    }
}