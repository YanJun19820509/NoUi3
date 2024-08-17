
import { ccclass, property, menu, Component, Node, Prefab, js, Widget } from '../../yj';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
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
export class YJWindowManager extends Component {
    @property({ group: { name: '需要创建的层列表' }, displayName: '1.地图层', })
    public get addLayer1(): boolean {
        return this.layer_1;
    }

    public set addLayer1(v: boolean) {
        this.layer_1 = v;
        if (v) this.createLayerNode(1);
        else this.removeLayerNode(1);
    }
    @property({ group: { name: '需要创建的层列表' }, displayName: '2.导航层' })
    public get addLayer2(): boolean {
        return this.layer_2;
    }

    public set addLayer2(v: boolean) {
        this.layer_2 = v;
        if (v) this.createLayerNode(2);
        else this.removeLayerNode(2);
    }
    @property({ group: { name: '需要创建的层列表' }, displayName: '3.全屏窗口层' })
    public get addLayer3(): boolean {
        return this.layer_3;
    }

    public set addLayer3(v: boolean) {
        this.layer_3 = v;
        if (v) this.createLayerNode(3);
        else this.removeLayerNode(3);
    }
    @property({ group: { name: '需要创建的层列表' }, displayName: '4.弹窗层' })
    public get addLayer4(): boolean {
        return this.layer_4;
    }

    public set addLayer4(v: boolean) {
        this.layer_4 = v;
        if (v) this.createLayerNode(4);
        else this.removeLayerNode(4);
    }
    @property({ group: { name: '需要创建的层列表' }, displayName: '5.引导层' })
    public get addLayer5(): boolean {
        return this.layer_5;
    }

    public set addLayer5(v: boolean) {
        this.layer_5 = v;
        if (v) this.createLayerNode(5);
        else this.removeLayerNode(5);
    }
    @property({ group: { name: '需要创建的层列表' }, displayName: '6.消息层' })
    public get addLayer6(): boolean {
        return this.layer_6;
    }

    public set addLayer6(v: boolean) {
        this.layer_6 = v;
        if (v) this.createLayerNode(6);
        else this.removeLayerNode(6);
    }
    @property({ displayName: '自动清理缓存的panel' })
    autoClear: boolean = false;
    @property({ displayName: '清理间隔时长(s)', min: 3, step: 1, visible() { return this.autoClear; } })
    duration: number = 10;
    @property({ type: LayerInfo, group: { name: '层列表详情' } })
    infos: LayerInfo[] = [];

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
        }).catch(e => { no.err('windowmanager', e.stack); });
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
        const duration = no.isDebug() ? 5 : this.duration;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let content = YJWindowManager._ins.getContent(this.infos[i].type);
            content?.children.forEach(node => {
                let panel = node.getComponent(YJPanel);
                if (panel && !no.visible(panel.node) && panel.lastCloseTime > 0 && t - panel.lastCloseTime >= duration) {
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

    private createLayerNode(type: number) {
        const node = no.newNode('layer_' + type, [Widget]);
        node['yj_layerType'] = type;
        node.parent = this.node;
        const widget = node.getComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        const info = new LayerInfo();
        info.type = LayerType[type];
        info.content = node;
        info.desc = LayerTypeDesc[type];
        let i = 0;
        for (let n = this.node.children.length; i < n; i++) {
            if (this.node.children[i]['yj_layerType'] == type) continue;
            if (this.node.children[i]['yj_layerType'] > type) {
                node.setSiblingIndex(i);
                break;
            }
        }
        this.infos.splice(i, 0, info);
    }

    private removeLayerNode(type: number) {
        const i = no.indexOfArray(this.node.children, type, 'yj_layerType');
        this.infos.splice(i, 1);
        this.node.getChildByName('layer_' + type)?.destroy();
    }
}