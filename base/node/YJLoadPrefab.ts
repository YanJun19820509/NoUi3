import { EDITOR, ccclass, property, menu, Component, Node, Prefab, instantiate } from '../../yj';
import { YJLoadAssets } from 'NoUi3/editor/YJLoadAssets';
import { no } from 'NoUi3/no';
import { PrefabInfo } from 'NoUi3/types';

@ccclass
@menu('NoUi/node/YJLoadPrefab(加载预制体)')
/**
 * 预制体加载组件
 * Author mqsy_yj
 * DateTime 2024/1/8
 */
export default class YJLoadPrefab extends Component {
    /** 预制体资源 */
    @property({ type: PrefabInfo })
    prefabInfo: PrefabInfo = new PrefabInfo();

    /** 是否自动加载预制体 */
    @property
    autoLoad: boolean = true;

    /** 材质信息uuid */
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    /** 是否已加载完成 */
    public loaded: boolean = false;

    /** 组件加载时自动加载预制体 */
    onLoad() {
        if (EDITOR) return;
        if (!this.autoLoad) return;
        this.loadPrefab();
    }

    /** 组件销毁时清理 */
    onDestroy() {
        this.clear();
    }

    /**
     * 加载预制体
     * @returns 预制体节点实例
     */
    public async loadPrefab(): Promise<Node> {
        return new Promise<Node>(resolve => {
            this.prefabInfo.loadAsset<Prefab>(prefab => {
                if (prefab) {
                    const node = instantiate(prefab);
                    YJLoadAssets.setMaterialInfoUuidToSubNode(node, this.materialInfoUuid);
                    this.loaded = true;
                    resolve(node);
                } else {
                    resolve(null);
                }
            });
        }).catch(e => {
            no.err('YJLoadPrefab loadPrefab', this.node.name, e.message);
            return null;
        });
    }

    /** 清理加载状态 */
    public clear(): void {
        this.loaded = false;
    }
}
