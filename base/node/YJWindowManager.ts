
import { ccclass, property, menu, Component, Node, instantiate, Prefab, js } from '../../yj';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { YJPreinstantiatePanel } from './YJPreinstantiatePanel';
import { YJAddPanelToMetaKey, YJAllowMultipleOpen, YJPanelCreated, YJPanelPrefabMetaKey, YJPanelPrefabUuidMetaKey } from '../../types';
import { YJPanel } from './YJPanel';
import { YJSoundEffectManager } from '../audio/YJSoundEffectManager';

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
    private prefabPathOrUuidToNodeName: any = {};

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

    /**
     * 某容器内所有子节点
     * @param type 
     * @returns 
     */
    public static contentChildren(type: string): Node[] {
        return this._ins.getContent(type)?.children || [];
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
            YJSoundEffectManager.ins.playOpenSoundEffect();
            afterInit?.(a as T);
        }).catch(e => { no.err('windowmanager', e.message); });
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
        to = to || no.getPrototype(comp, YJAddPanelToMetaKey);
        if (!to) {
            no.err('windowmanager', comp.name, '没有指定面板的归属节点');
            return;
        }
        let content: Node = self.getContent(to);
        const allowMultipleOpen = no.isPrototypeEquals(comp, YJAllowMultipleOpen, '1');
        if (!allowMultipleOpen) {
            let a = content.getComponentInChildren(comp);
            if (a != null) {
                beforeInit?.(a as T);
                a.initPanel().then(() => {
                    // a.onEnable();
                    afterInit?.(a as T);
                }).catch(e => { no.err('windowmanager', e.stack, e.message); });
                no.siblingIndex(a.node, content.children.length - 1);
                return;
            }
        }
        if (!allowMultipleOpen) {
            if (no.isPrototypeEquals(comp, YJPanelCreated, '1')) return;
            else no.setPrototype(comp, { [YJPanelCreated]: '1' });
        }
        let node = YJPreinstantiatePanel.ins?.getPanelNodeAndRemove(comp.name);
        if (node) {
            this.initNode(node, comp as (typeof YJPanel), content, beforeInit, afterInit);
        } else {
            const url = no.getPrototype(comp, YJPanelPrefabMetaKey),
                uuid = no.getPrototype(comp, YJPanelPrefabUuidMetaKey),
                k = url || uuid;
            const node = no.assetBundleManager.getPrefabNode(k);
            if (node) this.initNode(node, comp as (typeof YJPanel), content, beforeInit, afterInit);
            else {
                const request = { type: Prefab, url: url, uuid: uuid };
                no.assetBundleManager.loadAny<Prefab>(request, pf => {
                    if (!pf) return;
                    no.assetBundleManager.setPrefabNode(k, pf);
                    if (!content?.isValid) {
                        return
                    }
                    this.initNode(no.assetBundleManager.getPrefabNode(k), comp as (typeof YJPanel), content, beforeInit, afterInit);
                });
            }
        }
    }

    /**
     * 通过prefab的path或uuid创建，通常用于无逻辑面板加载
     * @param prefabPathOrUuid 
     * @param to 
     * @param beforeInit 
     * @param afterInit 
     */
    public static createPanelByPrefab(prefabPathOrUuid: string, to: string, beforeInit?: (panel: YJPanel) => void, afterInit?: (panel: YJPanel) => void) {
        if (!to) {
            no.err('windowmanager', prefabPathOrUuid, '没有指定面板的归属节点');
            return;
        }
        const self = YJWindowManager._ins,
            name = self.prefabPathOrUuidToNodeName[prefabPathOrUuid],
            content: Node = self.getContent(to);
        if (name) {
            const a = this.opennedPanelByType(name, to);
            if (a != null) {
                beforeInit?.(a);
                a.initPanel().then(() => {
                    // a.onEnable();
                    afterInit?.(a);
                }).catch(e => { no.err('windowmanager', e.stack, e.message); });
                no.siblingIndex(a.node, content.children.length - 1);
                return;
            }
        }
        const node = no.assetBundleManager.getPrefabNode(prefabPathOrUuid);
        if (node) this.initNode(node, YJPanel, content, beforeInit, afterInit);
        else {
            const request = { type: Prefab, url: prefabPathOrUuid, uuid: prefabPathOrUuid };
            no.assetBundleManager.loadAny<Prefab>(request, pf => {
                if (!pf) return;
                no.assetBundleManager.setPrefabNode(prefabPathOrUuid, pf);
                const node = no.assetBundleManager.getPrefabNode(prefabPathOrUuid);
                self.prefabPathOrUuidToNodeName[prefabPathOrUuid] = node.getComponent(YJPanel).panelType;
                if (!content?.isValid) {
                    return
                }
                this.initNode(node, YJPanel, content, beforeInit, afterInit);
            });
        }
    }

    public static OpenPanelAndCloseOther(name: string, to: string) {
        this.createPanel(name, to, null, () => {
            this.closePanelIn(to, [name]);
        });
    }

    public static setPanelTo(panel: YJPanel, to: string) {
        const self = YJWindowManager._ins,
            content: Node = self.getContent(to);
        panel.node.parent = content;
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
    public static opennedPanel<T extends YJPanel>(comp: typeof YJPanel | string, to: string): T | null {
        if (!comp) return null;
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);
        if (!comp) return null;
        to = to || no.getPrototype(comp, YJAddPanelToMetaKey);
        if (!to) {
            no.err('windowmanager', comp.name, '没有指定面板的归属节点');
            return;
        }
        let content: Node = YJWindowManager._ins.getContent(to);
        let a = content.getComponentInChildren(comp);
        if (!a) return null
        return a as T;
    }

    public static opennedPanelByType<T extends YJPanel>(panelType: string, to?: string): T | null {
        if (!panelType) return null;
        let self = YJWindowManager._ins;
        if (to) {
            const content: Node = YJWindowManager._ins.getContent(to);
            if (content) {
                const panels = content.getComponentsInChildren(YJPanel);
                for (let i = 0, n = panels.length; i < n; i++) {
                    if (panels[i].panelType == panelType) return panels[i] as T;
                }
            }
        }
        for (let i = 0, n = self.infos.length; i < n; i++) {
            const content = YJWindowManager._ins.getContent(self.infos[i].type);
            const panels = content.getComponentsInChildren(YJPanel);
            for (let i = 0, n = panels.length; i < n; i++) {
                if (panels[i].panelType == panelType) return panels[i] as T;
            }
        }
        return null;
    }

    public clearClosedPanel() {
        let t = no.sysTime.now;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = YJWindowManager._ins.getContent(this.infos[i].type);
            content?.children.forEach(node => {
                let panel = node.getComponent(YJPanel);
                if (panel && !no.visible(panel.node) && panel.lastCloseTime > 0 && t - panel.lastCloseTime >= this.duration) {
                    // no.log('YJWindowManager release panel', panel.panelType);
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
        no.assetBundleManager.clearCachedAssets();
    }

    public static clearClosedPanel() {
        YJWindowManager._ins.clearClosedPanel();
    }

    /**
     * 当前可见最上层面板
     * @param from 开始查找的层级索引
     */
    public static getTopPanel(from?: number) {
        const me = this._ins;
        for (let i = from || me.infos.length - 1; i >= 0; i--) {
            let content = me.getContent(me.infos[i].type);
            for (let j = content.children.length - 1; j >= 0; j--) {
                const child = content.children[j];
                if (no.visible(child)) {
                    return child;
                }
            }
        }
    }
}