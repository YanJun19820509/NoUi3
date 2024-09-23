
import { ccclass, property, menu, executeInEditMode, Component, Node, instantiate, EDITOR, sys } from '../yj';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import YJLoadPrefab from './node/YJLoadPrefab';
import { YJCacheObject } from './YJCacheObject';
import { YJDataWork } from './YJDataWork';

/**
 * Predefined variables
 * Name = YJCreateNodeByOrientation
 * DateTime = Fri Jan 14 2022 17:53:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCreateNodeByOrientation.ts
 * FileBasenameNoExtension = YJCreateNodeByOrientation
 * URL = db://assets/Script/NoUi3/base/YJCreateNodeByOrientation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * 根据设备方向创建节点
 */

@ccclass('YJCreateNodeByOrientation')
@menu('NoUi/base/YJCreateNodeByOrientation(创建节点)')
@executeInEditMode()
export class YJCreateNodeByOrientation extends Component {
    @property({ type: YJLoadPrefab, group: '横屏', displayName: 'loadPrefab' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, group: '横屏', displayName: 'tempNode' })
    tempNode: Node = null;
    @property({ type: YJLoadPrefab, group: '竖屏', displayName: 'loadPrefab' })
    loadPrefab1: YJLoadPrefab = null;
    @property({ type: Node, group: '竖屏', displayName: 'tempNode' })
    tempNode1: Node = null;

    @property({ type: Node })
    target: Node = null;

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
            if (no.deviceOrientaton() == 0) {
                a = this.tempNode || await this.loadPrefab.loadPrefab();
            } else {
                a = this.tempNode1 || await this.loadPrefab1.loadPrefab();
            }
            if (!this?.node?.isValid) return;
            if (a == null) return null;
            await a.getComponent(YJLoadAssets)?.load();
            if (!this?.node?.isValid) return;
            a.getComponent(YJDataWork)?.init();
            this._recycleType = a.getComponent(YJCacheObject)?.recycleType;
        }
        a.parent = this.target;
        no.visible(a, true);
        return a;
    }

    ///////////////////////////EDITOR///////////////
    onLoad() {
        if (!EDITOR) return;
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.target) this.target = this.node;
    }
}