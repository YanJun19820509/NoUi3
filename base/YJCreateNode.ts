
import { ccclass, property, menu, executeInEditMode, Component, Node, instantiate, EDITOR } from '../yj';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import YJLoadPrefab from './node/YJLoadPrefab';
import { YJCacheObject } from './YJCacheObject';
import { YJDataWork } from './YJDataWork';

/**
 * Predefined variables
 * Name = YJCreateNode
 * DateTime = Fri Jan 14 2022 17:53:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCreateNode.ts
 * FileBasenameNoExtension = YJCreateNode
 * URL = db://assets/Script/NoUi3/base/YJCreateNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJCreateNode')
@menu('NoUi/base/YJCreateNode(创建节点)')
@executeInEditMode()
export class YJCreateNode extends Component {
    @property({ type: YJLoadPrefab })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node })
    tempNode: Node = null;

    @property({ type: Node })
    target: Node = null;
    @property({ type: YJDynamicAtlas })
    dynamicAtlas: YJDynamicAtlas = null;

    @property
    autoCreate: boolean = false;

    private _recycleType: string;

    start() {
        if (EDITOR) return;
        this.autoCreate && this.a_create();
    }

    public a_create() {
        this.createNode();
    }

    public async createNode(): Promise<Node> {
        let a: Node;
        if (this._recycleType != null) {
            a = no.cachePool.reuse(this._recycleType);
        }

        if (a == null) {
            a = this.tempNode || await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
            if (a == null) return null;
            if (this.dynamicAtlas && !a.getComponent(YJDynamicAtlas)) {
                YJDynamicAtlas.setDynamicAtlas(a, this.dynamicAtlas);
            }
            await a.getComponent(YJLoadAssets)?.load();
            if (!this?.node?.isValid) return;
            a.getComponent(YJDataWork)?.init();
            this._recycleType = a.getComponent(YJCacheObject)?.recycleType;
        }
        a.parent = this.target;
        a.active = true;
        no.visible(a, true);
        return a;
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        if (!EDITOR) return;
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.target) this.target = this.node;
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }
}