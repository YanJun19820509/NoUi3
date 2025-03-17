
import { ccclass, property, menu, Component, Node, Prefab, js, Widget, instantiate } from '../../yj';
import { no } from '../../no';
import { YJAddPanelToMetaKey, YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey, YJPanelPrefabUuidMetaKey } from '../../types';
import { YJPanel } from './YJPanel';
import { YJSoundEffectManager } from '../audio/YJSoundEffectManager';
import { LayerType, LayerTypeDesc } from './LayerType';

/**
 * Predefined variables
 * Name = YJWindowManager
 * DateTime = Fri Jan 14 2022 18:10:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJWindowManager.ts
 * FileBasenameNoExtension = YJWindowManager
 * URL = db://assets/Script/NoUi3/base/node/YJWindowManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('LayerInfo')
export class LayerInfo {
    @property({ displayName: '层级别名', tooltip: '创建panel时根据别名指定panel在场景中的层级' })
    type: string = '';
    @property({ displayName: '容器', type: Node })
    content: Node = null;
    @property({ editorOnly: true })
    desc: string = ''
}

@ccclass('YJWindowManager')
@menu('NoUi/node/YJWindowManager')
/**
 * 窗口管理器，用于管理游戏中的各种UI面板
 */
export class YJWindowManager extends Component {
    /**
     * 是否添加地图层（游戏主场景层）
     * @property {boolean} addLayer1
     * @desc 
     * - 用于放置游戏主场景地形、背景等固定元素
     * - 通常作为最底层UI，覆盖整个屏幕
     * @example
     * // 编辑器配置：
     * 勾选属性面板"1.地图层"复选框
     * // 代码动态设置：
     * windowManager.addLayer1 = true;
     */
    @property({ group: { name: '需要创建的层列表' }, displayName: '1.地图层', })
    public get addLayer1(): boolean {
        return this.layer_1;
    }

    public set addLayer1(v: boolean) {
        this.layer_1 = v;
        if (v) this.createLayerNode(1);
        else this.removeLayerNode(1);
    }

    /**
     * 是否添加导航层（主功能入口层）
     * @property {boolean} addLayer2
     * @desc 
     * - 用于放置主菜单、角色头像、任务追踪等常驻UI
     * - 通常位于地图层之上，全屏窗口层之下
     * @example
     * // 需要添加底部功能栏时启用
     * windowManager.addLayer2 = true;
     */
    @property({ group: { name: '需要创建的层列表' }, displayName: '2.导航层' })
    public get addLayer2(): boolean {
        return this.layer_2;
    }

    public set addLayer2(v: boolean) {
        this.layer_2 = v;
        if (v) this.createLayerNode(2);
        else this.removeLayerNode(2);
    }

    /**
     * 是否添加全屏窗口层（主界面层）
     * @property {boolean} addLayer3
     * @desc 
     * - 用于放置背包、设置、商城等全屏界面
     * - 打开时会覆盖导航层但低于弹窗层
     * @example
     * // 当需要打开全屏界面时：
     * YJWindowManager.open('panel/FullScreenPanel', LayerType.FullScreen);
     */
    @property({ group: { name: '需要创建的层列表' }, displayName: '3.全屏窗口层' })
    public get addLayer3(): boolean {
        return this.layer_3;
    }

    public set addLayer3(v: boolean) {
        this.layer_3 = v;
        if (v) this.createLayerNode(3);
        else this.removeLayerNode(3);
    }

    /**
     * 是否添加弹窗层（模态对话框层）
     * @property {boolean} addLayer4
     * @desc 
     * - 用于显示提示框、确认框等模态对话框
     * - 具有最高优先级，会遮挡其他界面
     * - 通常带有半透明背景遮罩
     * @example
     * // 显示系统提示：
     * YJWindowManager.open('panel/AlertPanel', LayerType.Popup);
     */
    @property({ group: { name: '需要创建的层列表' }, displayName: '4.弹窗层' })
    public get addLayer4(): boolean {
        return this.layer_4;
    }

    public set addLayer4(v: boolean) {
        this.layer_4 = v;
        if (v) this.createLayerNode(4);
        else this.removeLayerNode(4);
    }

    /**
     * 是否添加引导层（新手引导层）
     * @property {boolean} addLayer5
     * @desc 
     * - 用于显示新手引导的高亮框、手指指示等
     * - 需要穿透交互时可使用该层
     * - 显示在消息层之下
     * @example
     * // 显示引导箭头：
     * YJWindowManager.open('panel/GuideArrow', LayerType.Guide);
     */
    @property({ group: { name: '需要创建的层列表' }, displayName: '5.引导层' })
    public get addLayer5(): boolean {
        return this.layer_5;
    }

    public set addLayer5(v: boolean) {
        this.layer_5 = v;
        if (v) this.createLayerNode(5);
        else this.removeLayerNode(5);
    }

    /**
     * 是否添加消息层（即时提示层）
     * @property {boolean} addLayer6
     * @desc 
     * - 用于显示跑马灯、飘字提示、系统消息等
     * - 显示在所有层最上方
     * - 通常使用淡入淡出动画
     * @example
     * // 显示获得物品提示：
     * YJWindowManager.open('panel/ToastPanel', LayerType.Message);
     */
    @property({ group: { name: '需要创建的层列表' }, displayName: '6.消息层' })
    public get addLayer6(): boolean {
        return this.layer_6;
    }

    public set addLayer6(v: boolean) {
        this.layer_6 = v;
        if (v) this.createLayerNode(6);
        else this.removeLayerNode(6);
    }

    /**
     * 是否自动清理缓存的panel
     * @property {boolean} autoClear
     * @desc 
     * - 启用后定时清理已关闭的Panel缓存
     * - 防止内存持续增长，适合长期运行的场景
     * - 需配合duration属性设置清理间隔
     * @example
     * // 启用每10秒清理一次：
     * windowManager.autoClear = true;
     * windowManager.duration = 10;
     */
    @property({ displayName: '自动清理缓存的panel' })
    autoClear: boolean = false;

    /**
     * 自动清理的时间间隔(秒)
     * @property {number} duration
     * @range [3, Infinity]
     * @min 3
     * @step 1
     * @desc 
     * - 建议值在10-300秒之间
     * - 过短可能影响性能，过长可能内存占用过高
     * - 仅在autoClear启用时生效
     */
    @property({ displayName: '清理间隔时长(s)', min: 3, step: 1, visible() { return this.autoClear; } })
    duration: number = 10;

    /**
     * 层级配置信息列表
     * @property {LayerInfo[]} infos
     * @desc 
     * - 存储各层的类型说明和容器节点引用
     * - 每个层级对应一个内容容器节点
     * - 通过type字段与LayerType枚举对应
     * @example
     * // 编辑器配置示例：
     * 1. 点击+号添加层级配置项
     * 2. 设置type字段为对应的层级名称
     * 3. 拖拽场景中的空节点到content属性
     */
    @property({ type: LayerInfo, group: { name: '层列表详情' } })
    infos: LayerInfo[] = [];

    /**
     * 各层级的开启状态（编辑器专用）
     * @desc 
     * - 用于在编辑器中持久化层级开关状态
     * - 开发者不应在代码中直接修改这些属性
     * - 通过对应的addLayer属性进行设置
     */
    @property({ editorOnly: true, serializable: true, visible: false })
    layer_1: boolean = false;
    @property({ editorOnly: true, serializable: true, visible: false })
    layer_2: boolean = false;
    @property({ editorOnly: true, serializable: true, visible: false })
    layer_3: boolean = false;
    @property({ editorOnly: true, serializable: true, visible: false })
    layer_4: boolean = false;
    @property({ editorOnly: true, serializable: true, visible: false })
    layer_5: boolean = false;
    @property({ editorOnly: true, serializable: true, visible: false })
    layer_6: boolean = false;

    /**
     * 已创建的面板唯一标识列表
     * @desc 
     * - 存储所有已创建面板的UUID或资源路径
     * - 用于防止重复创建相同面板
     * - 配合autoClear实现自动清理
     * @example
     * // 检查面板是否已存在：
     * if (createdPanel.includes(panelId)) return;
     */
    private createdPanel: string[] = [];

    /**
     * prefab资源路径与节点名称的映射表
     * @desc 
     * - 维护prefab资源路径与场景中实际节点名称的对应关系
     * - 用于动态加载时快速查找已有实例
     * - 解决资源路径与节点命名规范不一致的问题
     * @example
     * // 通过路径获取节点名称：
     * const nodeName = prefabPathToNodeName['ui/panel/settings'];
     */
    private prefabPathToNodeName: any = {};

    /**
     * 窗口管理器单例实例
     * @static
     * @desc 
     * - 全局唯一的窗口管理实例
     * - 通过onLoad生命周期初始化
     * - 使用前需确保实例已存在
     * @example
     * // 安全获取实例：
     * const manager = YJWindowManager._ins ?? find('Canvas/WindowManager');
     */
    private static _ins: YJWindowManager;

    /**
     * 组件加载生命周期回调
     * @desc 
     * - 初始化单例实例
     * - 启动自动清理定时器（当autoClear启用时）
     * - 清理间隔由duration属性控制
     * @example
     * // 手动触发清理：
     * this.scheduleOnce(() => this.clearClosedPanel());
     */
    onLoad() {
        YJWindowManager._ins = this;
        if (this.autoClear)
            this.schedule(() => {
                this.clearClosedPanel();
            }, 3);
    }

    /**
     * 组件销毁生命周期回调
     * @desc 
     * - 释放单例实例引用
     * - 防止内存泄漏
     * - 确保组件销毁后不再被访问
     */
    onDestroy() {
        YJWindowManager._ins = null;
    }

    /**
     * 获取指定层级的容器节点
     * @param type 层级类型标识符
     * @returns 对应层级的容器节点，未找到时返回null
     * @example
     * // 获取主界面层容器：
     * const layer3 = this.getContent('MainUI');
     */
    private getContent(type: string): Node {
        let self = YJWindowManager._ins;
        let content: Node;
        for (let i = 0, n = self.infos.length; i < n; i++) {
            if (self.infos[i].type == type) {
                content = self.infos[i].content;
                break;
            }
        }
        return content;
    }

    /**
     * 获取指定层级容器的所有子节点
     * @static
     * @param type 层级类型标识符
     * @returns 子节点数组，未找到容器时返回空数组
     * @example
     * // 遍历导航层所有元素：
     * YJWindowManager.contentChildren('Navigation').forEach(n => n.active = false);
     */
    public static contentChildren(type: string): Node[] {
        return this._ins.getContent(type)?.children || [];
    }

    /**
     * 初始化面板节点流程
     * @template T 面板组件类型
     * @param node 待初始化的节点实例
     * @param comp 面板组件类引用
     * @param content 目标容器节点
     * @param beforeInit 初始化前回调（用于配置面板参数）
     * @param afterInit 初始化后回调（用于添加自定义逻辑）
     * @example
     * // 自定义初始化流程：
     * initNode(panelNode, SettingsPanel, content, 
     *   panel => panel.setDefaultTab(1),
     *   panel => panel.playEntranceAnim()
     * );
     */
    private static initNode<T extends YJPanel>(node: Node, comp: typeof YJPanel, content: Node, beforeInit?: (panel: T) => void, afterInit?: (panel: T) => void) {
        let a = node.getComponent(comp);
        beforeInit?.(a as T);
        a.initPanel().then(() => {
            content.addChild(node);
            YJSoundEffectManager.ins?.playOpenSoundEffect();
            afterInit?.(a as T);
        }).catch(e => { no.err('windowmanager', e.stack); });
    }

    /**
     * 创建并初始化UI面板
     * @param comp 面板组件类型，可以是YJPanel子类的构造函数或类名字符串
     * @param to 目标层级标识符（对应LayerInfo.type），默认使用组件元数据中配置的层级
     * @param beforeInit 面板初始化前执行的回调（用于配置面板初始参数）
     * @param afterInit 面板初始化后执行的回调（用于添加自定义逻辑）
     * 
     * @example
     * // 创建设置面板并配置默认选项：
     * YJWindowManager.createPanel(SettingsPanel, 'FullScreen', 
     *   panel => panel.defaultTab = 1,
     *   panel => panel.playEntranceAnimation()
     * );
     * 
     * // 通过类名创建角色面板：
     * YJWindowManager.createPanel('CharacterPanel', 'Popup');
     */
    public static createPanel<T extends YJPanel>(comp: typeof YJPanel | string, to?: string, beforeInit?: (panel: T) => void, afterInit?: (panel: T) => void) {
        if (!comp) return;
        
        // 处理字符串类型的组件类名
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return;

        const self = YJWindowManager._ins;
        
        // 获取面板的目标层级（优先使用参数值，其次使用元数据配置）
        to = to || no.getPrototype(comp, YJAddPanelToMetaKey);
        if (!to) {
            no.err('windowmanager', comp.name, '没有指定面板的归属节点');
            return;
        }

        let content: Node = self.getContent(to);
        
        // 检查是否允许重复打开相同面板
        const allowMultipleOpen = no.isPrototypeEquals(comp, YJAllowMultipleOpen, '1');
        
        // 当不允许重复打开时，检查是否已存在实例
        if (!allowMultipleOpen) {
            let existingPanel = content.getComponentInChildren(comp);
            if (existingPanel != null) {
                // 重用现有面板实例
                beforeInit?.(existingPanel as T);
                existingPanel.initPanel().then(() => {
                    afterInit?.(existingPanel as T);
                }).catch(e => { 
                    no.err('windowmanager', e.stack, e.message); 
                });
                return;
            }
        }

        // 防止重复创建标记
        if (!allowMultipleOpen) {
            if (no.isPrototypeEquals(comp, YJPanelCreated, '1')) return;
            else no.setPrototype(comp, { [YJPanelCreated]: '1' });
        }

        // 加载面板预制体资源
        const url = no.getPrototype(comp, YJPanelPrefabMetaKey),
            uuid = no.getPrototype(comp, YJPanelPrefabUuidMetaKey);
        
        const request = { type: Prefab, url: url, uuid: uuid };
        no.assetBundleManager.loadAny<Prefab>(request, pf => {
            if (!pf) return;
            
            // 检查容器节点有效性
            if (!content?.isValid) return;

            // 实例化并初始化面板节点
            this.initNode(instantiate(pf), comp as (typeof YJPanel), content, beforeInit, afterInit);
        });
    }

    /**
     * 通过prefab路径或UUID创建无逻辑面板
     * @param prefabPath prefab资源路径或UUID字符串
     * @param to 目标层级类型（需与LayerType中的类型匹配）
     * @param beforeInit 面板初始化前回调，可用于设置初始参数
     * @param afterInit 面板初始化完成回调，可用于界面交互准备
     * @returns void
     * 
     * @remarks
     * - 适用于不需要复杂逻辑控制的简单界面
     * - 自动管理面板实例复用，避免重复创建
     * - 维护prefab路径与节点名称的映射关系
     * - 支持异步加载和初始化流程
     * 
     * @example
     * // 通过路径创建设置面板到主界面层
     * YJWindowManager.createPanelByPrefab(
     *   'ui/panel/Settings',
     *   LayerType.MainUI,
     *   panel => panel.setDefaultVolume(0.5),
     *   panel => panel.playEnterAnimation()
     * );
     * 
     * // 通过UUID创建帮助面板到弹窗层
     * YJWindowManager.createPanelByPrefab(
     *   '3f2a1bcd-5e4f-4a3d-b123',
     *   LayerType.Popup,
     *   null,
     *   panel => panel.showTutorial()
     * );
     */
    public static createPanelByPrefab(prefabPath: string, to: string, beforeInit?: (panel: YJPanel) => void, afterInit?: (panel: YJPanel) => void): void {
        // 参数有效性检查
        if (!to) {
            no.err('windowmanager', prefabPath, '没有指定面板的归属节点');
            return;
        }

        const self = YJWindowManager._ins;
        // 获取已缓存的节点名称（用于实例复用检查）
        const cachedName = self.prefabPathToNodeName[prefabPath];
        // 获取目标层级容器节点
        const content: Node = self.getContent(to);

        // 检查是否存在可复用的面板实例
        if (cachedName) {
            const existingPanel = this.opennedPanelByType(cachedName, to);
            if (existingPanel != null) {
                // 执行初始化前回调
                beforeInit?.(existingPanel);
                // 异步初始化流程
                existingPanel.initPanel()
                    .then(() => {
                        // 初始化完成后回调
                        afterInit?.(existingPanel);
                    })
                    .catch(e => { 
                        no.err('windowmanager', e.stack, e.message); 
                    });
                return;
            }
        }

        // 构建资源请求配置
        const request = { 
            type: Prefab, 
            url: prefabPath, 
            uuid: prefabPath 
        };

        // 异步加载prefab资源
        no.assetBundleManager.loadAny<Prefab>(request, pf => {
            if (!pf) return;
            
            // 实例化prefab节点
            const node = instantiate(pf);
            // 缓存prefab路径与节点名称的映射
            const panelComp = node.getComponent(YJPanel);
            self.prefabPathToNodeName[prefabPath] = panelComp?.panelType;

            // 容器有效性最终检查
            if (!content?.isValid) {
                no.warn('windowmanager', '目标容器已失效', to);
                return;
            }

            // 执行节点初始化流程
            this.initNode(
                node, 
                YJPanel, 
                content, 
                beforeInit, 
                afterInit
            );
        });
    }

    /**
     * 打开指定面板并关闭同层级其他面板
     * @param name 要打开的面板类名（需继承YJPanel）
     * @param to 目标层级别名（需在层级配置中定义）
     * @desc
     * - 先创建指定面板，成功后再关闭同层其他面板
     * - 适用于需要独占显示的场景（如设置界面/全屏商城）
     * - 自动处理面板初始化异步流程
     * @example
     * // 打开设置面板并关闭其他全屏界面：
     * YJWindowManager.OpenPanelAndCloseOther('SettingsPanel', LayerType.FullScreen);
     */
    public static OpenPanelAndCloseOther(name: string, to: string) {
        this.createPanel(name, to, null, () => {
            this.closePanelIn(to, [name]);
        });
    }

    /**
     * 动态调整面板所属层级
     * @param panel 要移动的面板实例
     * @param to 目标层级别名
     * @desc
     * - 实时修改面板父节点实现层级切换
     * - 可用于动态调整UI布局（如将弹窗提升到最顶层）
     * - 目标层级不存在时会抛出错误
     * @example
     * // 将任务面板移动到背景层：
     * YJWindowManager.setPanelTo(questPanel, LayerType.Background);
     */
    public static setPanelTo(panel: YJPanel, to: string) {
        const self = YJWindowManager._ins,
            content: Node = self.getContent(to);
        panel.node.parent = content;
    }

    /**
     * 隐藏指定窗口但不销毁
     * @param name 要隐藏的窗口组件类名
     * @param to 可选参数，指定搜索层级范围
     * @desc
     * - 仅隐藏不销毁，可通过show()重新显示
     * - 支持跨层级搜索或指定层级内搜索
     * - 找到第一个匹配项即停止
     * @example
     * // 隐藏所有层级中的Loading界面：
     * YJWindowManager.hidePanel('LoadingPanel');
     * 
     * // 仅隐藏HUD层中的血条组件：
     * YJWindowManager.hidePanel('HealthBar', LayerType.HUD);
     */
    public static hidePanel(name: string, to?: string) {
        let self = YJWindowManager._ins;
        // 遍历所有层级配置
        for (let i = 0, n = self.infos.length; i < n; i++) {
            // 如果指定了目标层级则跳过其他层级
            if (to && self.infos[i].type != to) continue;
            let content: Node = self.infos[i].content;
            // 倒序遍历子节点（从最新添加的面板开始）
            let children = content.children;
            for (let i = children.length - 1; i >= 0; i--) {
                let node = children[i];
                if (node.getComponent(name)) {
                    // 执行隐藏操作并退出循环
                    (node.getComponent(name) as YJPanel).hide();
                    break;
                }
            }
        }
    }

    /**
     * 关闭指定类名的窗口
     * @param name 要关闭的窗口组件类名（需继承YJPanel）
     * @param to 可选参数，指定搜索层级范围（层级别名）
     * @desc
     * - 支持跨层级搜索或指定层级内搜索
     * - 倒序遍历子节点（从最新添加的面板开始关闭）
     * - 找到第一个匹配项即停止
     * @example
     * // 关闭所有层级中的Loading界面：
     * YJWindowManager.closePanel('LoadingPanel');
     * 
     * // 仅关闭设置界面中的音效设置面板：
     * YJWindowManager.closePanel('AudioSettingsPanel', LayerType.Settings);
     * 
     * // 关闭当前场景中的任务提示弹窗：
     * YJWindowManager.closePanel('QuestPopup', LayerType.Popup);
     */
    public static closePanel(name: string, to?: string) {
        let self = YJWindowManager._ins;
        // 遍历所有层级配置
        for (let i = 0, n = self.infos.length; i < n; i++) {
            // 如果指定了目标层级则跳过其他层级
            if (to && self.infos[i].type != to) continue;
            let content: Node = self.infos[i].content;
            // 倒序遍历子节点（从最新添加的面板开始）
            let children = content.children;
            for (let j = children.length - 1; j >= 0; j--) {
                let node = children[j];
                if (node.getComponent(name)) {
                    // 调用面板的关闭方法并退出循环
                    (node.getComponent(name) as YJPanel).closePanel();
                    break;
                }
            }
        }
    }

    /**
     * 关闭指定层级内的所有窗口
     * @param nodeName 层级别名（对应LayerInfo.type）
     * @param excepts 排除列表（不关闭的组件类名数组）
     * @desc
     * - 会保留排除列表中的窗口实例
     * - 使用slice()创建子节点副本避免修改原始数组
     * - 检查enabledInHierarchy确保只关闭激活状态的面板
     * @example
     * // 关闭HUD层所有界面，保留血条：
     * YJWindowManager.closePanelIn(LayerType.HUD, ['HealthBar']);
     * 
     * // 关闭弹窗层所有界面：
     * YJWindowManager.closePanelIn(LayerType.Popup);
     * 
     * // 关闭主界面层，保留商城按钮：
     * YJWindowManager.closePanelIn(LayerType.MainUI, ['ShopButton']);
     */
    public static closePanelIn(nodeName: string, excepts: string[] = []) {
        let content: Node = YJWindowManager._ins.getContent(nodeName);
        // 创建子节点副本避免修改原始数组
        const children = content.children.slice();
        const len = children.length;
        
        // 倒序遍历所有子节点
        for (let i = len - 1; i >= 0; i--) {
            const node = children[i];
            const panel = node.getComponent(YJPanel);
            // 只处理激活状态的panel
            if (panel?.enabledInHierarchy) {
                let className = js.getClassName(panel);
                // 检查排除列表
                if (excepts.includes(className)) continue;
                panel.closePanel();
            }
        }
    }

    /**
     * 关闭所有窗口
     * @desc
     * - 遍历所有层级关闭其中的面板
     * - 清空已创建面板记录
     * - 适用于需要完全重置UI状态的场景
     * @example
     * // 返回主菜单时重置所有界面：
     * YJWindowManager.closeAllPanel();
     * // 游戏暂停时关闭所有UI：
     * YJWindowManager.closeAllPanel();
     */
    public static closeAllPanel() {
        let self = YJWindowManager._ins;
        // 遍历所有层级配置
        for (let i = 0, n = self.infos.length; i < n; i++) {
            // 逐层关闭面板
            this.closePanelIn(self.infos[i].type);
        }
        // 清空已创建面板记录
        self.createdPanel.length = 0;
    }

    /**
     * 获取已打开的窗口
     * @param comp 窗口组件类型（可以是类名字符串或YJPanel子类）
     * @param to 所属层级别名（对应LayerInfo.type）
     * @returns 窗口实例 | null
     * @desc
     * - 优先在指定层级中查找
     * - 支持通过类名或组件类两种方式查询
     * - 自动处理元数据获取层级信息
     * @example
     * // 获取设置面板实例：
     * const settings = YJWindowManager.opennedPanel(SettingsPanel, LayerType.Popup);
     * // 通过类名字符串获取：
     * const shop = YJWindowManager.opennedPanel('ShopPanel', LayerType.MainUI);
     */
    public static opennedPanel<T extends YJPanel>(comp: typeof YJPanel | string, to: string): T | null {
        if (!comp) return null;
        // 处理字符串类型的组件类名
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return null;
        // 从元数据获取默认层级配置
        to = to || no.getPrototype(comp, YJAddPanelToMetaKey);
        if (!to) {
            no.err('windowmanager', comp.name, '没有指定面板的归属节点');
            return;
        }
        // 获取对应层级的容器节点
        let content: Node = YJWindowManager._ins.getContent(to);
        // 在容器中查找组件实例
        let a = content.getComponentInChildren(comp);
        if (!a) return null
        return a as T;
    }

    /**
     * 根据面板类型获取已打开的窗口
     * @param panelType 面板类型标识（自定义字符串）
     * @param to 可选-指定搜索的层级别名
     * @returns 窗口实例 | null
     * @desc
     * - 优先在指定层级中搜索
     * - 未指定层级时全局搜索所有层级
     * - 适用于需要跨层级查找特定类型面板的场景
     * @example
     * // 查找任务追踪面板：
     * const quest = YJWindowManager.opennedPanelByType('QuestTracker');
     * // 在HUD层查找血条面板：
     * const healthBar = YJWindowManager.opennedPanelByType('HealthBar', LayerType.HUD);
     */
    public static opennedPanelByType<T extends YJPanel>(panelType: string, to?: string): T | null {
        if (!panelType) return null;
        let self = YJWindowManager._ins;
        // 优先在指定层级搜索
        if (to) {
            const content: Node = YJWindowManager._ins.getContent(to);
            if (content) {
                const panels = content.getComponentsInChildren(YJPanel);
                // 遍历匹配面板类型
                for (let i = 0, n = panels.length; i < n; i++) {
                    if (panels[i].panelType == panelType) return panels[i] as T;
                }
            }
        }
        // 全局搜索所有层级
        for (let i = 0, n = self.infos.length; i < n; i++) {
            const content = YJWindowManager._ins.getContent(self.infos[i].type);
            const panels = content.getComponentsInChildren(YJPanel);
            for (let i = 0, n = panels.length; i < n; i++) {
                if (panels[i].panelType == panelType) return panels[i] as T;
            }
        }
        return null;
    }

    /**
     * 清理已关闭的面板
     * @desc 
     * - 自动清理所有层级中已关闭且超过保留时间的面板
     * - 清理条件：面板状态为close且关闭时间超过保留时长
     * - 调试模式下保留时间缩短为5秒方便测试
     * - 遍历顺序：按层级配置顺序逐层清理
     * @example
     * // 手动触发关闭面板清理：
     * windowManager.clearClosedPanel();
     * // 调试模式下5秒后自动清理，正式环境根据duration设置（默认10秒）
     */
    public clearClosedPanel() {
        let t = no.sysTime.now;
        const duration = no.isDebug() ? 5 : this.duration;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = YJWindowManager._ins.getContent(this.infos[i].type);
            for (let i = 0; i < content?.children.length; i++) {
                const node = content.children[i];
                if (node.isValid) {
                    let panel = node.getComponent(YJPanel);
                    if (panel && panel.status == 'close' && panel.lastCloseTime > 0 && t - panel.lastCloseTime >= duration) {
                        // no.log('YJWindowManager release panel', panel.panelType);
                        panel.clear();
                    }
                }
            }
        }
    }

    /**
     * 清理隐藏的面板
     * @desc 
     * - 立即清理所有层级中处于隐藏状态的面板
     * - 隐藏状态：面板主动调用hide方法但未销毁
     * - 适用场景：需要强制释放隐藏面板资源时
     * @example
     * // 清理所有临时隐藏的提示框：
     * windowManager.clearHidePanel();
     * // 在内存紧张时主动调用释放资源
     */
    public clearHidePanel() {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = YJWindowManager._ins.getContent(this.infos[i].type);
            for (let i = 0; i < content?.children.length; i++) {
                const node = content.children[i];
                if (node.isValid) {
                    let panel = node.getComponent(YJPanel);
                    if (panel?.status == 'hide') {
                        panel.clear();
                    }
                }
            }
        }
    }

    /**
     * 清理所有面板
     * @desc 
     * - 强制清理所有层级中的所有面板（包括打开中的）
     * - 清理顺序：从最上层开始逆序清理
     * - 特殊处理：带YJPanel组件的使用panel.clear(true)立即销毁
     * - 适用场景：切换场景/重置游戏时彻底清理UI
     * @example
     * // 切换场景前清理所有UI：
     * windowManager.clearAll();
     * // 游戏重置时调用：
     * YJWindowManager.clearAll();
     */
    public clearAll() {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = this.getContent(this.infos[i].type);

            for (let j = content.children.length - 1; j >= 0; j--) {
                const child = content.children[j];
                const panel = child.getComponent(YJPanel);
                if (panel)
                    panel.clear(true);  // 立即销毁模式
                else child.destroy();   // 非面板节点直接销毁
            }
        }
    }

    /**
     * 清理所有面板(静态方法)
     * @desc 
     * - 强制销毁所有层级的UI面板并释放AB包资源
     * - 包含正在显示的、隐藏的、已关闭的所有面板
     * - 同时清理AssetBundleManager缓存的资源
     * - 适用于游戏重置或切场景时的彻底清理
     * @example
     * // 在游戏重置时调用：
     * YJWindowManager.clearAll();
     */
    public static clearAll() {
        YJWindowManager._ins.clearAll();
        no.assetBundleManager.clearCachedAssets();
    }

    /**
     * 清理已关闭的面板(静态方法)
     * @desc 
     * - 仅清理标记为已关闭（status == 'close'）的面板
     * - 保留正在显示和临时隐藏的面板
     * - 自动清理功能实际调用的是此方法
     * @example
     * // 手动触发自动清理逻辑：
     * YJWindowManager.clearClosedPanel();
     */
    public static clearClosedPanel() {
        YJWindowManager._ins.clearClosedPanel();
    }

    /**
     * 清理隐藏的面板(静态方法)
     * @desc 
     * - 清理通过hide()方法隐藏但未销毁的面板
     * - 适用于需要强制释放临时隐藏面板资源的场景
     * @example
     * // 释放所有隐藏的提示框资源：
     * YJWindowManager.clearHidePanel();
     */
    public static clearHidePanel() {
        YJWindowManager._ins.clearHidePanel();
    }

    /**
     * 获取当前可见的最上层面板
     * @param from 起始查找层级索引（默认从最顶层开始）
     * @returns 当前可见的最顶层子节点或undefined
     * @desc 
     * - 逆序遍历层级，从指定层级开始向上查找
     * - 返回第一个可见的且包含YJPanel组件的节点
     * - 可用于实现点击穿透判断或焦点管理
     * @example
     * // 判断当前是否有面板在最顶层：
     * const top = YJWindowManager.getTopPanel();
     * if(top) cc.log('当前最前面板是:', top.name);
     */
    public static getTopPanel(from?: number) {
        const me = this._ins;
        // 从指定层级或最顶层开始逆序查找
        for (let i = from || me.infos.length - 1; i >= 0; i--) {
            let content = me.getContent(me.infos[i].type);
            // 逆序遍历子节点（后添加的面板显示在上层）
            for (let j = content.children.length - 1; j >= 0; j--) {
                const child = content.children[j];
                if (no.visible(child)) {
                    return child;
                }
            }
        }
    }

    /**
     * 创建层级节点
     * @param type 层级类型（对应LayerType枚举值）
     * @desc 
     * - 创建全屏适配的Widget节点作为层级容器
     * - 设置节点自定义属性yj_layerType用于层级识别
     * - 自动维护infos数组的排序与节点层级顺序一致
     * - 节点顺序根据LayerType值从小到大排列
     * @example
     * // 当设置addLayer3 = true时：
     * this.createLayerNode(3); // 创建全屏窗口层
     */
    private createLayerNode(type: number) {
        // 创建带Widget组件的全屏节点
        const node = no.newNode(LayerType[type], [Widget]);
        node['yj_layerType'] = type;
        node.parent = this.node;
        
        // 配置Widget全屏适配
        const widget = node.getComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;

        // 创建层级配置信息
        const info = new LayerInfo();
        info.type = LayerType[type];
        info.content = node;
        info.desc = LayerTypeDesc[type];
        
        // 寻找正确的插入位置保持层级顺序
        let i = 0;
        for (let n = this.node.children.length; i < n; i++) {
            if (this.node.children[i]['yj_layerType'] == type) continue;
            if (this.node.children[i]['yj_layerType'] > type) {
                no.siblingIndex(node, i);  // 调整节点层级顺序
                break;
            }
        }
        this.infos.splice(i, 0, info);  // 同步更新配置信息数组
    }

    /**
     * 移除层级节点
     * @param type 层级类型（对应LayerType枚举值）
     * @desc 
     * - 根据类型查找并移除对应的层级节点
     * - 同时清理infos数组中的配置信息
     * - 自动维护节点和配置信息的同步
     * @example
     * // 当设置addLayer2 = false时：
     * this.removeLayerNode(2); // 移除导航层
     */
    private removeLayerNode(type: number) {
        // 通过自定义属性查找层级索引
        const i = no.indexOfArray(this.node.children, type, 'yj_layerType');
        this.infos.splice(i, 1);  // 移除配置信息
        this.node.getChildByName(LayerType[type])?.destroy();  // 销毁节点
    }
}