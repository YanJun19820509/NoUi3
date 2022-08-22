
import { _decorator, Component, Node, instantiate, Prefab, js } from 'cc';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { YJAddPanelToMetaKey, YJPanel, YJPanelPrefabMetaKey } from './YJPanel';
import { YJPreinstantiatePanel } from './YJPreinstantiatePanel';
const { ccclass, property, menu } = _decorator;

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
export class YJWindowManager extends Component {
    @property(LayerInfo)
    infos: LayerInfo[] = [];
    @property({ displayName: '清理间隔时长(s)', min: 3, step: 1 })
    duration: number = 10;
    @property(YJPreinstantiatePanel)
    preinstantiatePanel: YJPreinstantiatePanel = null;

    private static _ins: YJWindowManager;

    onLoad() {
        YJWindowManager._ins = this;
        this.schedule(() => {
            this.clearClosedPanel();
        }, 3);
    }

    onDestroy() {
        YJWindowManager._ins = null;
    }

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

    private static initNode<T extends YJPanel>(node: Node, comp: typeof YJPanel, content: Node, beforeInit?: (panel: T) => void, afterInit?: (panel: T) => void) {
        let dynamicAtlas = content.getComponent(YJDynamicAtlas);
        if (dynamicAtlas) {
            let la = node.getComponent('YJLoadAssets');
            if (la && la['dynamicAtlas'] == null) {
                la['dynamicAtlas'] = dynamicAtlas;
                // YJDynamicAtlas.setDynamicAtlasToRenderComponent(node, dynamicAtlas);
                YJDynamicAtlas.setDynamicAtlas(node, dynamicAtlas);
            }
        }
        let a = node.getComponent(comp);
        beforeInit?.(a as T);
        a.initPanel().then(() => {
            content.addChild(node);
            afterInit?.(a as T);
        });
    }

    /**
     * 创建功能面板
     * @param comp 功能组件类
     * @param to 所属节点
     * @returns
     */
    public static createPanel<T extends YJPanel>(comp: typeof YJPanel | string, to?: string, beforeInit?: (panel: T) => void, afterInit?: (panel: T) => void) {
        if (!comp) return null;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return null;
        to = to || comp.prototype[YJAddPanelToMetaKey];
        let content: Node = YJWindowManager._ins.getContent(to);
        let a = content.getComponentInChildren(comp);
        if (a != null) {
            beforeInit?.(a as T);
            a.initPanel().then(() => {
                a.node.active = true;
                afterInit?.(a as T);
            });
            a.node.setSiblingIndex(content.children.length - 1);
            return;
        }
        let node = this._ins.preinstantiatePanel?.getPanelNodeAndRemove(comp.name);
        if (node) {
            this.initNode(node, comp as (typeof YJPanel), content, beforeInit, afterInit);
        } else {
            let url = comp.prototype[YJPanelPrefabMetaKey];
            no.assetBundleManager.loadPrefab(url, (pf: Prefab) => {
                let node = instantiate(pf);
                this.initNode(node, comp as (typeof YJPanel), content, beforeInit, afterInit);
            });
        }
    }

    public static OpenPanelAndCloseOther(name: string, to: string) {
        this.createPanel(name, to, null, () => {
            this.closePanelIn(to, [name]);
        });
    }

    /**
     * 关闭某个窗口
     * @param name 窗口类名
     * @param to 所属节点
     */
    public static closePanel(name: string, to?: string) {
        let self = YJWindowManager._ins;
        for (let i = 0, n = self.infos.length; i < n; i++) {
            if (to && self.infos[i].type != to) continue;
            let content: Node = self.infos[i].content;
            let children = content.children;
            for (let i = children.length - 1; i >= 0; i--) {
                let node = children[i];
                if (node.getComponent(name)) {
                    (node.getComponent(name) as YJPanel).closePanel();
                    break;
                }
            }
        }
    }

    /**
     * 关闭某个节点下所有窗口
     * @param nodeName 
     * @param excepts 不关闭的窗口
     */
    public static closePanelIn(nodeName: string, excepts: string[] = []) {
        let content: Node = YJWindowManager._ins.getContent(nodeName);
        content.children.forEach(node => {
            let panel = node.getComponent(YJPanel);
            if (panel) {
                let name = js.getClassName(panel);
                if (excepts.indexOf(name) > -1) return;
                panel.closePanel();
            }
        });
    }

    /**
     * 关闭所有窗口
     */
    public static closeAllPanel() {
        let self = YJWindowManager._ins;
        for (let i = 0, n = self.infos.length; i < n; i++) {
            this.closePanelIn(self.infos[i].type);
        }
    }

    private clearClosedPanel() {
        let t = no.sysTime.now;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = YJWindowManager._ins.getContent(this.infos[i].type);
            content?.children.forEach(node => {
                let panel = node.getComponent(YJPanel);
                if (panel && panel.needClear && !panel.node.active && panel.lastCloseTime > 0 && t - panel.lastCloseTime >= this.duration) {
                    panel.clear();
                }
            });
        }
    }
}