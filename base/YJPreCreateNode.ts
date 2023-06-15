
import { _decorator, Component, Node, instantiate, Prefab } from './yj';
import { EDITOR } from 'cc/env';
import { no } from '../no';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJPreCreateNode
 * DateTime = Mon Dec 05 2022 20:33:49 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPreCreateNode.ts
 * FileBasenameNoExtension = YJPreCreateNode
 * URL = db://assets/NoUi3/base/YJPreCreateNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//用于预创建需要同时创建多个的节点

@ccclass('YJPreCreateNodeInfo')
export class YJPreCreateNodeInfo {
    @property({ type: Prefab })
    prefab: Prefab = null;
    @property({ readonly: true, editorOnly: true })
    prefabName: string = '';
    @property({ readonly: true })
    prefabUrl: string = '';
    @property({ readonly: true })
    prefabUuid: string = '';
    @property({ min: 1, step: 1 })
    createNum: number = 1;

    private _createdNodes: Node[] = [];

    public async check() {
        if (this.prefab) {
            let info = await Editor.Message.request('asset-db', 'query-asset-info', this.prefab._uuid);
            this.prefabName = info.name;
            this.prefabUuid = info.uuid;
            this.prefabUrl = info.url;
            this.prefab = null;
        }
    }

    public preCreateNodes() {
        no.assetBundleManager.loadByUuid<Prefab>(this.prefabUuid, Prefab, item => {
            item.optimizationPolicy = 2;
            if (item) {
                let n = this.createNum - this._createdNodes.length;
                for (let i = 0; i < n; i++) {
                    const a = instantiate(item);
                    a.active = false;
                    this._createdNodes[this._createdNodes.length] = a;
                }
            }
        });
    }

    public hasNodeNum(): number {
        return this._createdNodes.length;
    }

    public use() {
        return this._createdNodes.shift();
    }
}
@ccclass('YJPreCreateNode')
@executeInEditMode()
export class YJPreCreateNode extends Component {
    @property({ type: YJPreCreateNodeInfo })
    infos: YJPreCreateNodeInfo[] = [];
    @property({ displayName: '加了prefab后check一下' })
    needCheck: boolean = false;

    public static ins: YJPreCreateNode;

    onLoad() {
        if (EDITOR) return;
        YJPreCreateNode.ins = this;
        this.preCreate();
    }

    onDestroy() {
        if (EDITOR) return;
        YJPreCreateNode.ins = null;
    }

    update() {
        if (EDITOR) {
            if (this.needCheck) {
                this.needCheck = false;
                this.infos.forEach(info => {
                    info.check();
                });
            }
        }
    }

    public preCreate() {
        this.infos.forEach(info => {
            info.preCreateNodes();
        });
    }

    public fillNode(url: string) {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            const info = this.infos[i];
            if (info.prefabUrl == url) {
                info.preCreateNodes();
            }
        }
    }

    public useNode(url: string): Node | null {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            const info = this.infos[i];
            if (info.prefabUrl == url) {
                return info.use();
            }
        }
        return null;
    }

    public has(url: string): boolean {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            const info = this.infos[i];
            if (info.prefabUrl == url) {
                return info.hasNodeNum() > 0;
            }
        }
        return false;
    }
}
