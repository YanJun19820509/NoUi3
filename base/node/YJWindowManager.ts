
import { _decorator, Component, Node, instantiate, Prefab, js } from 'cc';
import { no } from '../../no';
import { YJPanel, YJPanelPrefabMetaKey } from './YJPanel';
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

    private async getContent(type: string): Promise<Node> {
        await no.waitFor(() => { return YJWindowManager._ins != null; });
        let self = YJWindowManager._ins;
        let content: Node;
        for (let i = 0, n = self.infos.length; i < n; i++) {
            if (self.infos[i].type == type) {
                content = self.infos[i].content;
                break;
            }
        }
        return Promise.resolve(content);
    }

    private static initPrefab<T extends YJPanel>(pf: Prefab, comp: typeof YJPanel, content: Node, onInit?: (panel: T) => void) {
        let node = instantiate(pf);
        let a = node.getComponent(comp);
        onInit?.(a as T);
        a.initPanel().then(() => {
            content.addChild(node);
        });
        pf.decRef();
    }

    /**
     * 创建功能面板
     * @param comp 功能组件类
     * @param to 所属节点
     * @returns
     */
    public static async createPanel<T extends YJPanel>(comp: typeof YJPanel | string, to: string, onInit?: (panel: T) => void) {
        if (!comp) return null;
        let content: Node = await YJWindowManager._ins.getContent(to);
        if (typeof comp == 'string')
            comp = js.getClassByName(comp) as (typeof YJPanel);

        let a = content.getComponentInChildren(comp);
        if (a != null) {
            a.node.active = true;
            a.node.setSiblingIndex(content.children.length - 1);
            onInit?.(a as T);
            a.initPanel();
            return;
        }
        let url = comp.prototype[YJPanelPrefabMetaKey];
        no.assetBundleManager.loadPrefab(url, (pf: Prefab) => {
            this.initPrefab(pf, comp as (typeof YJPanel), content, onInit);
        });
    }

    public static async OpenPanel(name: string, to: string) {
        if (!name) return null;
        let content: Node = await YJWindowManager._ins.getContent(to);

        let comp = js.getClassByName(name) as (typeof YJPanel);
        let a = content.getComponentInChildren(comp);
        if (a != null) {
            // console.log('Cant OpenPanel', name, to);
            a.node.active = true;
            a.node.setSiblingIndex(content.children.length - 1);
            a.initPanel();
            return;
        }

        let url = comp.prototype[YJPanelPrefabMetaKey];
        no.assetBundleManager.loadPrefab(url, (pf: Prefab) => {
            this.initPrefab(pf, comp, content);
        });
    }

    public static async OpenPanelAndCloseOther(name: string, to: string) {
        await this.OpenPanel(name, to);
        await no.sleep(0.2);
        this.closePanelIn(to, [name]);
    }

    /**
     * 关闭某个窗口
     * @param name 窗口类名
     * @param to 所属节点
     */
    public static async closePanel(name: string, to?: string) {
        await no.waitFor(() => { return YJWindowManager._ins != null; });
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
    public static async closePanelIn(nodeName: string, excepts: string[] = []) {
        let content: Node = await YJWindowManager._ins.getContent(nodeName);
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
    public static async closeAllPanel() {
        await no.waitFor(() => { return YJWindowManager._ins != null; });
        let self = YJWindowManager._ins;
        for (let i = 0, n = self.infos.length; i < n; i++) {
            this.closePanelIn(self.infos[i].type);
        }
    }

    private clearClosedPanel() {
        let t = no.sysTime.now;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            YJWindowManager._ins.getContent(this.infos[i].type).then(content => {
                content.children.forEach(node => {
                    let panel = node.getComponent(YJPanel);
                    if (panel && !panel.node.active && panel.lastCloseTime > 0 && t - panel.lastCloseTime >= this.duration) {
                        panel.clear();
                    }
                });
            });
        }
    }
}