
import { EDITOR, ccclass, property, menu, executeInEditMode, Component, BlockInputEvents, js, UIOpacity, Node } from '../../yj';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
import { no } from '../../no';
import { YJPanelCreated } from '../../types';

/**
 * Predefined variables
 * Name = YJPanel
 * DateTime = Fri Jan 14 2022 16:31:53 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPanel.ts
 * FileBasenameNoExtension = YJPanel
 * URL = db://assets/Script/NoUi3/base/node/YJPanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

let _nodeSiblingIndex_: number = 0;
@ccclass('YJPanel')
@menu('NoUi/node/YJPanel(面板基类)')
@executeInEditMode()
/**
 * 面板基类
 * @remarks
 * 功能特性：
 * - 提供面板的创建、显示、隐藏等基础功能
 * - 支持缓存管理
 * - 提供面板打开/关闭事件通知
 * 
 * @example
 * // 典型应用场景：
 * // - 需要动态加载/卸载的UI界面
 * // - 需要优化性能的静态UI元素
 * // - 需要根据位置切换显示状态的UI元素
 */
export class YJPanel extends Component {

    /** 
     * 全局面板缓存开关
     * @default true
     * @remarks
     * - 当设置为false时，所有继承YJPanel的面板都将不进行缓存
     * - 适用于需要强制刷新所有面板的场景
     * @example
     * // 在热更新后关闭缓存强制刷新：
     * YJPanel.cacheOpened = false;
     * // 在需要恢复缓存时重新开启：
     * YJPanel.cacheOpened = true;
     */
    public static cacheOpened: boolean = true;

    /** 
     * 面板打开全局事件标识 
     * @eventProperty
     * @example
     * // 监听所有面板打开事件：
     * no.evn.on(YJPanel.PanelOpenEvent, (panelType) => {
     *     console.log(`面板${panelType}被打开`);
     * });
     */
    public static PanelOpenEvent = '_PanelOpen';
    
    /** 
     * 面板关闭全局事件标识 
     * @eventProperty
     * @example
     * // 监听所有面板关闭事件：
     * no.evn.on(YJPanel.PanelCloseEvent, (panelType) => {
     *     console.log(`面板${panelType}被关闭`);
     * });
     */
    public static PanelCloseEvent = '_PanelClose';

    /** 
     * 最后关闭时间戳（毫秒）
     * @remarks 用于实现关闭冷却时间判断，-1表示未关闭状态
     * @example
     * // 判断是否在3秒内关闭过：
     * if(no.sysTime.now - panel.lastCloseTime < 3000) return;
     */
    public lastCloseTime: number = -1;

    /** 
     * 面板当前状态
     * @remarks
     * - close: 完全关闭状态
     * - open: 正常打开状态
     * - hide: 隐藏状态（仍存在于场景中但不可见）
     * @example
     * // 根据状态执行不同逻辑：
     * if(this.status === 'hide') this.show();
     */
    public status: 'close' | 'open' | 'hide' = 'close';

    /** 
     * 面板类型标识
     * @remarks 需保证唯一性，建议使用枚举值
     * @example
     * @property {string} panelType="LoginPanel" - 登录面板
     * @property {string} panelType="SettingPanel" - 设置面板
     */
    @property
    panelType: string = '';

    /** 
     * 面板打开事件处理器列表
     * @remarks 支持多回调绑定，执行顺序按数组顺序
     * @example
     * // 绑定打开时播放音效：
     * this.onOpen.push(new no.EventHandlerInfo({
     *     target: audioManager,
     *     component: "AudioController",
     *     handler: "playSfx",
     *     customEventData: "panel_open"
     * }));
     */
    @property({ type: no.EventHandlerInfo })
    onOpen: no.EventHandlerInfo[] = [];

    /** 
     * 面板关闭事件处理器列表
     * @remarks 支持异步回调处理
     * @example
     * // 绑定关闭时保存数据：
     * this.onClose.push(new no.EventHandlerInfo({
     *     target: dataManager,
     *     component: "SaveSystem",
     *     handler: "autoSave"
     * }));
     */
    @property({ type: no.EventHandlerInfo })
    onClose: no.EventHandlerInfo[] = [];

    /** 
     * 是否启用缓存
     * @remarks
     * - 开启后关闭时不会立即销毁，而是放入对象池
     * - 适合频繁打开关闭的常用面板
     * @example
     * // 对于不常用的帮助面板设置为false：
     * @property {boolean} needCache=false
     */
    @property
    needCache: boolean = true;
    
    /** 
     * 是否在重新打开时清理状态
     * @remarks 仅在needCache=true时生效
     * @example
     * // 对于需要保持状态的排行榜面板：
     * @property {boolean} needClear=false
     */
    @property({ visible() { return this.needCache; } })
    needClear: boolean = true;
    
    /** 
     * 全屏面板标识
     * @remarks 全屏面板打开时会自动触发_full_screen_panel_open事件
     * @example
     * // 全屏面板打开时隐藏底层UI：
     * no.evn.on('_full_screen_panel_open', (panelType) => {
     *     bottomUI.active = false;
     * });
     */
    @property({ tooltip: '如果是全屏界面，打开时推送_full_screen_panel_open事件，关闭时推送_full_screen_panel_close' })
    isFullScreen: boolean = false;
    
    /** 
     * 多点触摸支持开关
     * @remarks 开启后允许在该面板上同时响应多个触摸操作
     * @example
     * // 对于需要手势操作的面板：
     * @property {boolean} multiTouch=true
     */
    @property({ displayName: '多点触摸' })
    multiTouch: boolean = false;

    /** 保存原始多点触摸状态用于恢复 */
    protected _lastMultiTouchState: boolean = false;
    /** 节点原始X坐标缓存 */
    protected _originX: number;
    /** 资源加载完成标识 */
    private _loaded: boolean = false;
    /** 
     * 节点缓存键值
     * @remarks 默认使用类名，可重写实现多实例缓存
     * @example
     * // 实现不同参数的弹窗缓存：
     * get nodeCacheKey() {
     *     return `${super.nodeCacheKey}_${this.dialogType}`;
     * }
     */
    public nodeCacheKey: string;
    /** 
     * 是否缓存到对象池
     * @remarks 可重写实现特殊缓存逻辑
     */
    protected cacheToPool: boolean = true;

    /**
     * 组件加载时初始化基础配置
     * @remarks
     * - 编辑器环境下自动设置面板类型为节点名称
     * - 生成节点缓存键（默认使用类名）
     * @example
     * // 当节点名为"LoginView"时：
     * // onLoad() → panelType = "LoginView"
     * // nodeCacheKey = "YJPanel"（基类默认值，子类会自动继承）
     */
    onLoad() {
        // 编辑器环境下自动设置面板类型
        if (EDITOR) {
            if (this.panelType == '') this.panelType = this.node.name;
        }
        // 生成缓存键（用于对象池缓存）
        if (!this.nodeCacheKey) this.nodeCacheKey = js.getClassName(this);
    }

    /**
     * 组件启用时触发的生命周期方法
     * @remarks
     * 执行流程：
     * 1. 重置关闭时间戳
     * 2. 发送面板打开全局事件
     * 3. 记录调试日志
     * 4. 调用面板加载回调
     * @example
     * // 当面板被激活时：
     * // 触发_PanelOpen事件 → 更新面板统计 → 执行自定义加载逻辑
     */
    onEnable() {
        if (EDITOR) return;
        this.lastCloseTime = -1; // 重置关闭时间
        no.evn.emit(YJPanel.PanelOpenEvent, this.panelType); // 全局事件通知
        no.log('panel load', this.panelType); // 调试日志
        this.onLoadPanel(); // 调用派生类实现的加载逻辑
    }

    /**
     * 初始化面板核心流程
     * @returns Promise 初始化完成的异步对象
     * @remarks
     * 执行流程：
     * 1. 关闭状态下解除事件绑定
     * 2. 首次加载时：
     *    - 设置打开状态
     *    - 缓存原始位置
     *    - 加载依赖资源
     * 3. 非首次加载直接显示
     * 4. 执行打开回调
     * 5. 全屏面板通知
     * 6. 设置多点触摸
     * 
     * @example
     * // 典型使用场景：
     * const panel = instantiate(loginPanelPrefab).getComponent(YJPanel);
     * await panel.initPanel(); // 等待资源和数据加载完成
     * 
     * // 子类可重写示例：
     * public override async initPanel() {
     *     await super.initPanel(); // 先执行基类流程
     *     this.fetchUserData();    // 自定义数据初始化
     * }
     */
    public async initPanel(): Promise<void> {
        // 关闭状态下解除旧事件绑定
        if (this.status == 'close')
            no.evn.targetOff(this);

        // 首次加载流程
        if (!this._loaded) {
            this.status = 'open';
            this._loaded = true;
            this._originX = no.x(this.node); // 记录原始X坐标用于动画
            
            // 加载依赖资源（如配置表、纹理等）
            await this.getComponent(YJLoadAssets)?.load().catch(e => {
                no.err('YJPanel initPanel', this.node.name, e.message);
            });
        } else {
            this.show(); // 复用已加载的面板
        }

        no.EventHandlerInfo.execute(this.onOpen); // 执行打开事件回调
        
        // 等待派生类自定义初始化（如数据请求）
        this.onInitPanel();

        // 全屏面板通知（如隐藏底层UI）
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_open', this.panelType);

        // 设置多点触摸（如允许手势操作）
        this._lastMultiTouchState = no.multiTouch();
        no.multiTouch(this.multiTouch);
    }

    /**
     * 标准关闭面板流程
     * @remarks
     * 执行流程：
     * 1. 更新状态为关闭
     * 2. 记录关闭时间
     * 3. 发送关闭事件
     * 4. 恢复触摸设置
     * 5. 隐藏面板
     * 
     * @example
     * // 典型关闭操作：
     * panel.closePanel();
     * 
     * // 监听关闭事件：
     * no.evn.on(YJPanel.PanelCloseEvent, (type) => {
     *     if(type === 'Inventory') saveData();
     * });
     */
    public closePanel() {
        this.status = 'close';
        no.log('panel close', this.panelType);
        no.EventHandlerInfo.execute(this.onClose); // 执行关闭回调
        this.lastCloseTime = no.sysTime.now; // 记录关闭时间戳
        no.evn.emit(YJPanel.PanelCloseEvent, this.panelType); // 全局事件
        
        // 全屏面板关闭通知（如恢复底层UI）
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_close', this.panelType);
        
        // 恢复系统原始触摸设置
        no.multiTouch(this._lastMultiTouchState);
        this.hide(); // 执行隐藏逻辑
    }

    /**
     * 立即关闭面板，不缓存
     * @remarks
     * 执行流程：
     * 1. 强制更新状态为关闭
     * 2. 执行关闭回调
     * 3. 发送关闭事件
     * 4. 清理面板资源
     * 5. 恢复触摸设置
     * 
     * @example
     * // 强制关闭登录面板：
     * loginPanel.closePanelImmmediately();
     * 
     * // 热更新后强制关闭所有面板：
     * YJPanel.cacheOpened = false;
     * allPanels.forEach(panel => panel.closePanelImmmediately());
     */
    public closePanelImmmediately() {
        this.status = 'close';
        no.log('panel close', this.panelType);
        no.EventHandlerInfo.execute(this.onClose);
        no.evn.emit(YJPanel.PanelCloseEvent, this.panelType);
        this.onClosePanel();
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_close', this.panelType);
        no.multiTouch(this._lastMultiTouchState);
        this.clear(true);
    }

    /**
     * 清理面板资源
     * @param force 是否强制清理（忽略缓存设置）
     * @example
     * // 普通清理（遵循缓存设置）：
     * panel.clear();
     * 
     * // 强制清理（即使开启缓存也销毁）：
     * panel.clear(true);
     */
    public clear(force = false) {
        if (!force && YJPanel.cacheOpened && this.needCache && !this.needClear) return;
        no.setPrototype(this, { [YJPanelCreated]: '0' });
        this.node.destroy();
    }

    /**
     * 隐藏面板（保留实例）
     * @remarks
     * 根据缓存策略选择不同的隐藏方式：
     * - cacheToPool=true: 使用activeInHierarchy控制可见性（保留组件状态）
     * - cacheToPool=false: 直接设置节点可见性（更轻量）
     * 
     * @example
     * // 隐藏但保留在对象池：
     * panel.hide();
     * 
     * // 稍后重新显示：
     * panel.show();
     */
    public hide() {
        this.onClosePanel();
        if (this.cacheToPool) {
            this.status = 'hide';
            no.visibleByActiveInHierarchy(this.node, false);
        } else {
            no.visible(this.node, false);
        }
        no.siblingIndex(this.node, 0);
    }

    /**
     * 显示面板（从隐藏状态恢复）
     * @remarks
     * 显示时自动：
     * - 更新面板状态为打开
     * - 触发onEnable生命周期
     * - 调整渲染层级为最前
     * 
     * @example
     * // 显示已隐藏的设置面板：
     * settingsPanel.show();
     */
    public show() {
        this.status = 'open';
        if (this.node.active) this.onEnable();
        if (this.cacheToPool)
            no.visibleByActiveInHierarchy(this.node, true);
        else
            no.visible(this.node, true);
        no.siblingIndex(this.node, _nodeSiblingIndex_++);
    }

    /**
     * 面板关闭时的清理操作
     * @protected
     * @remarks
     * 执行：
     * - 移除所有事件监听
     * - 取消所有定时器
     * 
     * @example
     * // 子类扩展示例：
     * protected onClosePanel() {
     *     super.onClosePanel();
     *     this.stopAllAnimations();
     * }
     */
    protected onClosePanel() {
        no.evn.targetOff(this);
        this.unscheduleAllCallbacks();
    }

    //////以下方法需要子类实现
    /**
     * 初始化预制体内已有的数据节点逻辑
     * @remarks
     * 典型用途：
     * - 绑定UI组件引用
     * - 初始化静态数据
     * - 设置默认状态
     * 
     * @example
     * protected onInitPanel() {
     *     this.btnStart = this.node.getChildByName("BtnStart");
     *     this.lblTitle = this.node.getComponentInChildren(Label);
     * }
     */
    protected onInitPanel() {

    }

    /**
     * 动态创建节点的逻辑
     * @remarks
     * 仅在onEnable时执行，适合：
     * - 动态加载资源
     * - 创建运行时对象
     * - 发起网络请求
     * 
     * @example
     * protected onLoadPanel() {
     *     this.loadUserAvatar();
     *     this.createDynamicWidgets();
     * }
     */
    protected onLoadPanel() {

    }

    /**
     * 面板销毁时的日志记录
     * @example
     * // 输出示例：
     * // "panel destroy InventoryPanel"
     */
    onDestroy() {
        no.log('panel destroy', this.panelType);
    }
}
