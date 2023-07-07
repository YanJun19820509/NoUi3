
import { EDITOR, ccclass, property, menu, executeInEditMode, Component } from '../../yj';
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

@ccclass('YJPanel')
@menu('NoUi/node/YJPanel(面板基类)')
@executeInEditMode()
export class YJPanel extends Component {

    /**控制所有panel缓存开关，默认true，否则不缓存 */
    public static cacheOpened: boolean = true;

    /**面板打开事件 */
    public static PanelOpenEvent = '_PanelOpen';
    /**面板关闭事件 */
    public static PanelCloseEvent = '_PanelClose';

    public lastCloseTime: number = -1;

    @property
    panelType: string = '';

    @property({ type: no.EventHandlerInfo })
    onOpen: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo })
    onClose: no.EventHandlerInfo[] = [];

    /**是否缓存，默认缓存，特殊情况下不需要缓存的则手动设置为false */
    @property
    needCache: boolean = true;
    @property({ visible() { return this.needCache; } })
    needClear: boolean = true;
    @property({ tooltip: '如果是全屏界面，打开时推送_full_screen_panel_open事件，关闭时推送_full_screen_panel_close' })
    isFullScreen: boolean = false;
    @property({ displayName: '多点触摸' })
    multiTouch: boolean = false;

    private _lastMultiTouchState: boolean = false;
    private _originX: number;
    private _loaded: boolean = false;

    onLoad() {
        if (EDITOR) {
            if (this.panelType == '') this.panelType = this.node.name;
        }
    }

    onEnable() {
        if (EDITOR) return;
        this.lastCloseTime = -1;
        no.evn.emit(YJPanel.PanelOpenEvent, this.panelType);
        no.EventHandlerInfo.execute(this.onOpen);
        no.log('panel load', this.panelType);
        this.onLoadPanel();
    }

    /**
     * 可在prefab实例化时调用，进行界面内容的初始化
     */
    public async initPanel(): Promise<void> {
        //todo 先调数据接口同时加载资源
        if (!this._loaded) {
            this._loaded = true;
            this._originX = no.x(this.node);
            if (this.getComponent(YJLoadAssets)) {
                return this.getComponent(YJLoadAssets).load().then(() => {
                    this.onInitPanel();
                    if (this.isFullScreen)
                        no.evn.emit('_full_screen_panel_open', this.panelType);
                    this._lastMultiTouchState = no.multiTouch();
                    no.multiTouch(this.multiTouch);
                    return Promise.resolve();
                }).catch(e => { no.err(e); });
            }
        } else no.x(this.node, this._originX);
        //todo 等待数据返回
        this.onInitPanel();
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_open', this.panelType);
        this._lastMultiTouchState = no.multiTouch();
        no.multiTouch(this.multiTouch);
        return Promise.resolve();
    }

    public closePanel() {
        no.log('panel close', this.panelType);
        no.visible(this.node, false);
        this.node.setSiblingIndex(0);
        no.EventHandlerInfo.execute(this.onClose);
        this.lastCloseTime = no.sysTime.now;
        no.evn.emit(YJPanel.PanelCloseEvent, this.panelType);
        this.onClosePanel();
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_close', this.panelType);
        // if (YJPanel.cacheOpened && this.needCache) {
        //     this.node.active = false;
        // } else this.clear();
        no.x(this.node, 10000);
        no.multiTouch(this._lastMultiTouchState);
    }

    public clear(force = false) {
        if (!force && YJPanel.cacheOpened && this.needCache && !this.needClear) return;
        this['__proto__'][YJPanelCreated] = '0';
        this.node.destroy();
    }

    //////由子类实现
    /**
     * 初始化预制体内已有的数据节点逻辑放在这里
     */
    protected onInitPanel() {

    }
    /**
     * 需要动态创建节点的逻辑放在这里
     */
    protected onLoadPanel() {

    }

    protected onClosePanel() {

    }
}
