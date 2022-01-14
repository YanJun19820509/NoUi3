
import { _decorator, Component, Node, instantiate } from 'cc';
import { no } from '../no';
import YJLoadPrefab from './node/YJLoadPrefab';
import { YJCacheObject } from './YJCacheObject';
const { ccclass, property, menu } = _decorator;

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
export class YJCreateNode extends Component {
    @property(YJLoadPrefab)
    loadPrefab: YJLoadPrefab = null;
    @property(Node)
    tempNode: Node = null;

    @property(Node)
    target: Node = null;

    @property
    autoCreate: boolean = false;

    private _recycleType: string;

    start() {
        this.autoCreate && this.a_create();
    }

    public async a_create() {
        let a = await this.createNode();
        if (a != null) {
            a.parent = this.target;
            a.active = true;
        }
    }

    public async createNode(): Promise<Node> {
        let a: Node;
        if (this._recycleType != null) {
            a = no.cachePool.reuse(this._recycleType);
        }

        if (a == null) {
            let node = this.tempNode || await this.loadPrefab.loadPrefab();
            if (node == null) return null;
            a = instantiate(node);
            a.parent = this.target;
            a.active = true;
            this._recycleType = node.getComponent(YJCacheObject)?.recycleType;
        }
        return a;
    }
}