
import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
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
}

@ccclass('YJWindowManager')
@menu('NoUi/base/YJWindowManager')
export class YJWindowManager extends Component {
    @property(LayerInfo)
    infos: LayerInfo[] = [];

    private static _ins: YJWindowManager;

    onLoad() {
        YJWindowManager._ins = this;
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

    /**
     * 创建功能面板
     * @param comp 功能组件类
     * @param to 所属节点
     * @returns
     */
    public static async createPanel<T extends YJPanel>(comp: typeof YJPanel, to: string): Promise<T> {
        if (!comp) return null;
        let content: Node = await YJWindowManager._ins.getContent(to);

        let a = content.getComponentInChildren(comp.name);
        if (a != null) {
            return a as T;
        }
        return new Promise<T>(resolve => {
            no.assetBundleManager.loadPrefab(comp.prototype[YJPanelPrefabMetaKey], (pf: Prefab) => {
                let node = instantiate(pf);
                a = node.getComponent(comp.name);
                (a as YJPanel).initPanel();
                content.addChild(node);
                resolve(a as T);
            });
        });
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
     * @param name 
     */
    public static async closePanelIn(nodeName: string) {
        let content: Node = await YJWindowManager._ins.getContent(nodeName);
        content.children.forEach(node => {
            node.getComponent(YJPanel)?.closePanel();
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
}