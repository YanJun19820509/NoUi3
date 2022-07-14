
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
@ccclass('YJPanel')
@menu('NoUi/node/YJPanel(面板基类)')
@panelPrefabPath('')
@executeInEditMode()
export class YJPanel extends Component {

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

    @property
    needCache: boolean = true;

    onLoad() {
        if (EDITOR) {
            if (this.panelType == '') this.panelType = this.node.name;
        }
    }

    onEnable() {
        this.lastCloseTime = -1;
        no.evn.emit(YJPanel.PanelOpenEvent, this.panelType);
        no.EventHandlerInfo.execute(this.onOpen);
    }

    /**
     * 可在prefab实例化时调用，进行界面内容的初始化
     */
    public initPanel(): Promise<void> {
        this.onInitPanel();
        if (this.getComponent(YJLoadAssets)) {
            return this.getComponent(YJLoadAssets).load();
        }
        return Promise.resolve();
    }

    public closePanel() {
        no.EventHandlerInfo.execute(this.onClose);
        this.lastCloseTime = no.sysTime.now;
        no.evn.emit(YJPanel.PanelCloseEvent, this.panelType);
        this.onClosePanel();
        if (this.needCache)
            this.node.active = false;
        else this.clear();
    }

    public clear() {
        this.node.destroy();
    }

    //////由子类实现
    protected onInitPanel() {

    }

    protected onClosePanel() {

    }
}
