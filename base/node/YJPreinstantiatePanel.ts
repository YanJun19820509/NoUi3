
import { _decorator, Component, Node, CCString, js, Prefab, instantiate } from './yj';
import { no } from '../../no';
import { YJPanel } from './YJPanel';
import { YJPanelPrefabMetaKey } from '../../types';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJPreinstantiate
 * DateTime = Mon Aug 22 2022 14:20:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPreinstantiate.ts
 * FileBasenameNoExtension = YJPreinstantiate
 * URL = db://assets/NoUi3/base/node/YJPreinstantiate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 预实例化面板，用于复杂界面需要预先创建节点的
 */
@ccclass('YJPreinstantiatePanel')
export class YJPreinstantiatePanel extends Component {
    @property({ type: CCString })
    panelComponentNames: string[] = [];

    private panelNodes: any;

    public static ins: YJPreinstantiatePanel;

    onLoad() {return;
        YJPreinstantiatePanel.ins = this;
        this.panelNodes = {};
        this.panelComponentNames.forEach(name => {
            this.instantiatePanel(name);
        });
    }

    onDestroy() {
        YJPreinstantiatePanel.ins = null;
    }

    private instantiatePanel(name: string) {
        let comp = js.getClassByName(name) as (typeof YJPanel);
        if (!comp) return null;
        let url = comp.prototype[YJPanelPrefabMetaKey];
        no.assetBundleManager.loadPrefab(url, (pf: Prefab) => {
            this.panelNodes[name] = instantiate(pf);
        });
    }

    public getPanelNode(name: string): Node {
        return this.panelNodes[name];
    }

    public getPanelNodeAndRemove(name: string): Node {
        let a = this.panelNodes[name];
        this.panelNodes[name] = null;
        return a;
    }

}