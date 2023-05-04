
import { _decorator, Component } from 'cc';
import { EDITOR } from 'cc/env';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
import { no } from '../../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

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

export const YJPanelPrefabMetaKey = 'prefabPath';
export const YJAddPanelToMetaKey = 'addPanelToTargetName';
export const YJAllowMultipleOpen = 'allowmultipleopen';
export const YJPanelCreated = 'panelcreated';
/**
 * 注解，向YJPanel添加prefab path 元数据
 * @param path
 * @returns
 */
export function panelPrefabPath(path: string) {
    return no.addMeta(YJPanelPrefabMetaKey, path.replace('db://assets/', '').replace('.prefab', ''));
}

export function addPanelTo(targetName: string) {
    return no.addMeta(YJAddPanelToMetaKey, targetName);
}

export function AllowMultipleOpen() {
    return no.addMeta(YJAllowMultipleOpen, '1');
}
@ccclass('YJPanel')
@menu('NoUi/node/YJPanel(面板基类)')
@panelPrefabPath('')
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
        no.log('panel load', this.node.name);
        this.onLoadPanel();
    }

    /**
     * 可在prefab实例化时调用，进行界面内容的初始化
     */
    public initPanel(): Promise<void> {
        if (this.getComponent(YJLoadAssets)) {
            return this.getComponent(YJLoadAssets).load().then(() => {
                this.onInitPanel();
                if (this.isFullScreen)
                    no.evn.emit('_full_screen_panel_open');
                return Promise.resolve();
            }).catch(e => { no.err(e); });
        }
        this.onInitPanel();
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_open');
        return Promise.resolve();
    }

    public closePanel() {
        no.log('panel close', this.node.name);
        no.EventHandlerInfo.execute(this.onClose);
        this.lastCloseTime = no.sysTime.now;
        no.evn.emit(YJPanel.PanelCloseEvent, this.panelType);
        this.onClosePanel();
        if (this.isFullScreen)
            no.evn.emit('_full_screen_panel_close');
        if (YJPanel.cacheOpened && this.needCache) {
            this.node.active = false;
        } else this.clear();
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
