
import { no } from '../../no';
import { ccclass, property, menu, Component, Node, EventTouch, js, Enum } from '../../yj';
import { LayerType, LayerTypeEnum } from './LayerType';
import { YJPanel } from './YJPanel';
import { YJWindowManager } from './YJWindowManager';

/**
 * Predefined variables
 * Name = YJOpenWindow
 * DateTime = Thu Feb 24 2022 17:29:23 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJOpenWindow.ts
 * FileBasenameNoExtension = YJOpenWindow
 * URL = db://assets/NoUi3/base/node/YJOpenWindow.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('OpenWindowInfo')
export class OpenWindowInfo {
    @property
    windowName: string = '';
    @property
    prefabPath: string = '';
    @property({ type: Enum(LayerTypeEnum) })
    to: LayerTypeEnum = LayerTypeEnum.Popup;
    @property({ tooltip: '传参，仅用于show' })
    args: string = '';

    public panelType: string = '';

    public open(onOpended?: (panel: YJPanel) => void) {
        if (this.windowName != '') {
            const clazz = js.getClassByName(this.windowName);
            if (typeof clazz['show'] == 'function') clazz['show'](!!this.args ? this.args : null);
            else if (clazz['$super'] == YJPanel)
                YJWindowManager.createPanel(this.windowName, LayerType[this.to], panel => this.panelType = panel.panelType, onOpended);
        } else if (this.prefabPath != '') {
            YJWindowManager.createPanelByPrefab(this.prefabPath, LayerType[this.to], panel => this.panelType = panel.panelType, onOpended);
        }
    }
}

@ccclass('YJOpenWindow')
@menu('NoUi/node/YJOpenWindow(打开窗口)')
/**
 * 窗口管理组件
 * @remarks
 * 功能特性：
 * - 支持批量配置多个窗口打开参数
 * - 提供自动/手动触发窗口打开方式
 * - 支持按索引/名称打开指定窗口
 * - 支持顺序延时打开多个窗口
 * @example
 * // 典型应用场景：
 * // 1. 主界面多个功能入口的窗口打开
 * // 2. 新手引导的连续界面弹出
 * // 3. 关卡通关后的多奖励展示界面
 */
export class YJOpenWindow extends Component {
    /** 
     * 窗口信息配置列表
     * @property {OpenWindowInfo[]} infos - 每个配置项包含：
     *   - windowName: 窗口类名
     *   - prefabPath: 预制体路径
     *   - to: 窗口层级（参考LayerTypeEnum）
     *   - args: 传递参数
     * @example
     * // 在编辑器中配置示例：
     * // [
     * //   {windowName: "SettingPanel", to: LayerTypeEnum.Popup, args: "fromMain"},
     * //   {prefabPath: "prefabs/achievement/AchievePopup", to: LayerTypeEnum.Top}
     * // ]
     */
    @property(OpenWindowInfo)
    infos: OpenWindowInfo[] = [];

    /** 
     * 是否自动打开窗口
     * @property {boolean} autoOpen - 为true时在组件加载后自动执行a_open()
     * @example
     * // 适用于场景启动时需要自动展示的窗口：
     * // 如登录后主界面自动弹出活动公告
     */
    @property
    autoOpen: boolean = false;

    /** 
     * 组件加载时自动打开窗口
     * @remarks 仅在autoOpen为true时生效
     */
    onLoad() {
        this.autoOpen && this.a_open();
    }

    /** 
     * 顺序延时打开所有窗口
     * @remarks 每个窗口间隔0.2秒打开，用于需要逐步展示的界面流程
     * @example
     * // 新手引导步骤：
     * // 1. 打开角色创建面板
     * // 2. 打开职业选择面板
     * // 3. 打开技能介绍面板
     */
    public a_open() {
        let n = this.infos.length, i = 0;
        this.schedule(() => {
            this.openAt(i++);
        }, .2, n - 1);
    }

    /** 
     * 根据索引打开指定窗口
     * @param event 触摸事件对象（可传递索引参数）
     * @param idx 窗口索引（字符串类型，支持从编辑器事件传递）
     * @example
     * // 按钮点击事件绑定：
     * // 方法选择 YJOpenWindow.a_openAt
     * // 参数填写 0 表示打开第一个窗口
     */
    public a_openAt(event: EventTouch, idx: string): void {
        this.openAt(Number(idx || event));
    }

    /**
     * 根据窗口名称打开指定窗口
     * @param event 触摸事件对象（可传递名称参数）
     * @param name 窗口名称（需与infos中配置的windowName匹配）
     * @example
     * // 通过事件参数打开设置面板：
     * // event 参数传递 "SettingPanel"
     * // 或直接调用：comp.a_openName(null, "AchievementPanel")
     */
    public a_openName(event: EventTouch, name: string): void {
        const idx = no.indexOfArray(this.infos, name || event, 'windowName');
        this.openAt(idx);
    }

    /**
     * 核心打开窗口方法
     * @param i 窗口索引（基于infos数组的索引位置）
     * @param onOpended 窗口打开后的回调函数
     * @example
     * // 打开后执行初始化：
     * this.openAt(0, (panel) => {
     *   panel.initData(this.playerData);
     * });
     */
    public openAt(i: number, onOpended?: (panel: YJPanel) => void) {
        let info = this.infos[i];
        info?.open(onOpended);
    }

    /**
     * 获取窗口配置信息
     * @param i 窗口索引
     * @returns OpenWindowInfo配置对象
     * @example
     * // 动态修改窗口参数：
     * const info = this.getWindowInfoAt(0);
     * info.args = "updatedParams";
     */
    public getWindowInfoAt(i: number) {
        return this.infos[i];
    }
}
