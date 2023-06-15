
import { _decorator, Component, Node, instantiate, Prefab, js } from './yj';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { YJPreinstantiatePanel } from './YJPreinstantiatePanel';
import { YJAddPanelToMetaKey, YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey, YJPanelPrefabUuidMetaKey } from '../../types';
import { YJPanel } from './YJPanel';
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
    // @property({displayName:'路径根目录',tooltip:'有些bundle在该目录下，需要从路径中移除'})
    // pathPres:string[] = [];
    @property({ displayName: '自动清理缓存的panel' })
    autoClear: boolean = false;
    @property({ displayName: '清理间隔时长(s)', min: 3, step: 1, visible() { return this.autoClear; } })
    duration: number = 10;

    private createdPanel: string[] = [];

    private static _ins: YJWindowManager;

    onLoad() {
        YJWindowManager._ins = this;
        if (this.autoClear)
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
        let a = node.getComponent(comp);
        beforeInit?.(a as T);
        a.initPanel().then(() => {
            let dynamicAtlas = content.getComponent(YJDynamicAtlas);
            if (dynamicAtlas) {
                YJDynamicAtlas.setDynamicAtlas(node, dynamicAtlas);
            }
            content.addChild(node);
            afterInit?.(a as T);
        }).catch(e => { no.err(e); });
    }

    /**
     * 创建功能面板
     * @param comp 功能组件类
     * @param to 所属节点
     * @returns
     */
    public static createPanel<T extends YJPanel>(comp: typeof YJPanel | string, to?: string, beforeInit?: (panel: T) => void, afterInit?: (panel: T) => void) {
        if (!comp) return;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return;
        const self = YJWindowManager._ins;
        to = to || comp.prototype[YJAddPanelToMetaKey];
        let content: Node = self.getContent(to);
        const allowMultipleOpen = comp.prototype[YJAllowMultipleOpen] == '1';
        if (!allowMultipleOpen) {
            let a = content.getComponentInChildren(comp);
            if (a != null) {
                beforeInit?.(a as T);
                a.initPanel().then(() => {
                    a.node.active = true;
                    afterInit?.(a as T);
                }).catch(e => { no.err(e); });
                a.node.setSiblingIndex(content.children.length - 1);
                return;
            }
        }
        if (!allowMultipleOpen) {
            if (comp.prototype[YJPanelCreated] == '1') return;
            else comp.prototype[YJPanelCreated] = '1';
        }
        let node = YJPreinstantiatePanel.ins?.getPanelNodeAndRemove(comp.name);
        if (node) {
            this.initNode(node, comp as (typeof YJPanel), content, beforeInit, afterInit);
        } else {
            const request = { type: Prefab, path: comp.prototype[YJPanelPrefabMetaKey], uuid: comp.prototype[YJPanelPrefabUuidMetaKey] };
            no.assetBundleManager.loadAny<Prefab>(request, pf => {
                if (!pf) return;
                let node = instantiate(pf);
                if (!content?.isValid) {
                    return
                }
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
            if (panel?.enabledInHierarchy) {
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
        self.createdPanel.length = 0;
    }

    /**
     * 已开窗口
     * @param comp 窗口类名
     * @param to 所属节点
     * @returns 
     */
    public static opennedPanel<T extends YJPanel>(comp: typeof YJPanel | string, to?: string): T | null {
        if (!comp) return null;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return null;
        to = to || comp.prototype[YJAddPanelToMetaKey];
        let content: Node = YJWindowManager._ins.getContent(to);
        let a = content.getComponentInChildren(comp);
        if (!a) return null
        return a as T;
    }


    public clearClosedPanel() {
        let t = no.sysTime.now;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = YJWindowManager._ins.getContent(this.infos[i].type);
            content?.children.forEach(node => {
                let panel = node.getComponent(YJPanel);
                if (panel && !panel.node.active && panel.lastCloseTime > 0 && t - panel.lastCloseTime >= this.duration) {
                    panel.clear();
                }
            });
        }
    }

    public clearAll() {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = this.getContent(this.infos[i].type);

            for (let j = content.children.length - 1; j >= 0; j--) {
                const child = content.children[j];
                const panel = child.getComponent(YJPanel);
                if (panel)
                    panel.clear(true);
                else child.destroy();
            }
        }
    }

    public static clearAll() {
        YJWindowManager._ins.clearAll();
    }
}