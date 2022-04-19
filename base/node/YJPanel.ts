
import { _decorator, Component, Node } from 'cc';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { SetCreateNodeByUrl } from '../../fuckui/SetCreateNodeByUrl';
import { no } from '../../no';
import YJLoadPrefab from './YJLoadPrefab';
const { ccclass, property, menu } = _decorator;

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

/**
 * 注解，向YJPanel添加prefab path 元数据
 * @param path
 * @returns
 */
export function panelPrefabPath(path: string) {
    return no.addMeta(YJPanelPrefabMetaKey, path.replace('db://assets/', '').replace('.prefab', ''));
}
@ccclass('YJPanel')
@menu('NoUi/node/YJPanel(面板基类)')
@panelPrefabPath('')
export class YJPanel extends Component {

    /**面板打开事件 */
    public static PanelOpenEvent = '_PanelOpen';
    /**面板关闭事件 */
    public static PanelCloseEvent = '_PanelClose';

    @property
    panelType: string = 'popup_panel';

    @property({ type: no.EventHandlerInfo })
    onOpen: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo })
    onClose: no.EventHandlerInfo[] = [];

    onEnable() {
        no.evn.emit(YJPanel.PanelOpenEvent, this.panelType);
        no.EventHandlerInfo.execute(this.onOpen);
    }

    onDisable() {
        no.evn.emit(YJPanel.PanelCloseEvent, this.panelType);
    }

    /**
     * 可在prefab实例化时调用，进行界面内容的初始化
     */
    public initPanel() {
        this.getComponent(YJLoadAssets)?.load();
        this.onInitPanel();
    }

    public closePanel() {
        this.getComponentsInChildren(YJLoadPrefab).forEach(a => {
            a.recycle();
        });
        this.getComponentsInChildren(SetCreateNodeByUrl).forEach(a => {
            a.recycle();
        });
        this.getComponentsInChildren(YJDynamicAtlas).forEach(a => {
            a.clear();
        });
        this.recycle();
        no.EventHandlerInfo.execute(this.onClose);
        this.onClosePanel();
        this.node.destroy();
    }

    private recycle() {
        let k = this['__proto__'].prefabPath;
        if (this.node['_prefab'].asset.refCount > 0)
            no.cachePool.recycle(k, this.node['_prefab'].asset);
        else no.assetBundleManager.release(this.node['_prefab'].asset);
    }

    //////由子类实现
    protected onInitPanel() {

    }

    protected onClosePanel() {

    }
}
