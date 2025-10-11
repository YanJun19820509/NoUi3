
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
    @property({ tooltip: '传参，仅用于show,多个参数用逗号分隔' })
    args: string = '';

    public panelType: string = '';

    public open(onOpended?: (panel: YJPanel) => void) {
        if (this.windowName != '') {
            let args = [];
            if (this.args) {
                args = this.args.split(',');
            }
            const clazz = js.getClassByName(this.windowName);
            if (typeof clazz['show'] == 'function') clazz['show'](...args);
            else if (clazz['$super'] == YJPanel)
                YJWindowManager.createPanel(this.windowName, LayerType[this.to], panel => this.panelType = panel.panelType, onOpended);
        } else if (this.prefabPath != '') {
            YJWindowManager.createPanelByPrefab(this.prefabPath, LayerType[this.to], panel => this.panelType = panel.panelType, onOpended);
        }
    }
}

@ccclass('YJOpenWindow')
@menu('NoUi/node/YJOpenWindow(打开窗口)')
export class YJOpenWindow extends Component {
    /** 窗口信息列表 */
    @property(OpenWindowInfo)
    infos: OpenWindowInfo[] = [];

    /** 是否自动打开窗口 */
    @property
    autoOpen: boolean = false;

    @property({ tooltip: '自动打开窗口的索引', visible() { return this.autoOpen; } })
    autoOpenIndex: number = 0;

    /** 组件加载时,如果autoOpen为true则自动打开窗口 */
    onLoad() {
        this.autoOpen && this.openAt(this.autoOpenIndex);
    }

    /** 按顺序打开所有窗口,每个窗口间隔0.2秒 */
    public a_open() {
        let n = this.infos.length, i = 0;
        this.schedule(() => {
            this.openAt(i++);
        }, .2, n - 1);
    }

    /** 
     * 根据索引打开指定窗口
     * @param event 触摸事件
     * @param idx 窗口索引
     */
    public a_openAt(event: EventTouch, idx: string): void {
        this.openAt(Number(idx || event));
    }

    /**
     * 根据窗口名称打开指定窗口
     * @param event 触摸事件
     * @param name 窗口名称
     */
    public a_openName(event: EventTouch, name: string): void {
        const idx = no.indexOfArray(this.infos, name || event, 'windowName');
        this.openAt(idx);
    }

    public a_openAll() {
        this.a_open();
    }

    /**
     * 打开指定索引的窗口
     * @param i 窗口索引
     * @param onOpended 窗口打开后的回调
     */
    public openAt(i: number, onOpended?: (panel: YJPanel) => void) {
        let info = this.infos[i];
        info?.open(onOpended);
    }

    /**
     * 获取指定索引的窗口信息
     * @param i 窗口索引
     * @returns 窗口信息
     */
    public getWindowInfoAt(i: number) {
        return this.infos[i];
    }
}
