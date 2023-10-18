
import {
    ccclass, property, menu, Component, Node,
    Asset, Prefab, JsonAsset, Texture2D, MeshRender
} from '../../yj';
import { no } from '../../no';
import { SpriteFrameDataType } from '../../types';
import { YJSetSample3DMaterial } from '../effect/YJSetSample3DMaterial';
import { PrefabInfo, TextureInfo } from '../../editor/YJLoadAssets';

/**
 * Predefined variables
 * Name = YJLoadAssets3D
 * DateTime = Tue Mar 15 2022 18:48:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLoadAssets3D.ts
 * FileBasenameNoExtension = YJLoadAssets3D
 * URL = db://assets/NoUi3/base/YJLoadAssets3D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJLoadAssets3D')
@menu('NoUi/editor/YJLoadAssets3D(资源加载与释放)')
export class YJLoadAssets3D extends Component {
    @property
    autoLoad: boolean = false;
    @property({ type: no.EventHandlerInfo, visible() { return this.autoLoad; } })
    onLoaded: no.EventHandlerInfo[] = [];
    @property(TextureInfo)
    textureInfos: TextureInfo[] = [];
    @property(PrefabInfo)
    prefabInfos: PrefabInfo[] = [];
    @property
    public get autoSetSubLoadAsset(): boolean {
        return false;
    }

    public set autoSetSubLoadAsset(v: boolean) {
        if (v) YJLoadAssets3D.setLoadAsset(this.node, this);
    }

    private atlases: any[] = [];

    onLoad() {
        this.autoLoad &&
            this.load().then(() => {
                no.EventHandlerInfo.execute(this.onLoaded);
            });
    }

    /**
     * 加载图集
     */
    public async load() {
        let requests: { uuid: string, type: typeof Asset }[] = [];
        let atlasUuids: string[] = [];
        let textureUuids: string[] = [];
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            atlasUuids[atlasUuids.length] = this.textureInfos[i].atlasJsonUuid;
            textureUuids[textureUuids.length] = this.textureInfos[i].assetUuid;
            requests[requests.length] = { uuid: this.textureInfos[i].assetUuid, type: Texture2D };
            requests[requests.length] = { uuid: this.textureInfos[i].atlasJsonUuid, type: JsonAsset };
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            requests[requests.length] = { uuid: this.prefabInfos[i].assetUuid, type: Prefab };
        }
        if (requests.length == 0) return;

        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                if (!this?.isValid) {
                    return;
                }
                let textures: Texture2D[] = [];
                items.forEach(item => {
                    const uuid = item._uuid;
                    let i = atlasUuids.indexOf(uuid);
                    if (i > -1)
                        this.atlases[i] = (item as JsonAsset).json;
                    else {
                        i = textureUuids.indexOf(uuid);
                        if (i > -1)
                            textures[i] = item as Texture2D;
                    }
                });

                this.createMaterial(textures);
                resolve();
            });
        });
    }

    private createMaterial(textures: Texture2D[]) {
        const ssm = this.getComponent(YJSetSample3DMaterial);
        if (ssm && textures.length) {
            ssm.setAtlases(textures);
        }
        const arr = this.getComponentsInChildren(MeshRender);
        arr.forEach(a => {
            a.setMaterial(ssm.material, 0);
        })
    }

    /**
     * 从spriteframe的数据文件中获取spriteFrameInfo
     * @param name spriteFrame的名称
     * @returns [所属atlas下标，SpriteFrameInfo]
     */
    public getSpriteFrameInAtlas(name: string): [number, SpriteFrameDataType] {
        let info: SpriteFrameDataType, idx: number;
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            const s = this.atlases[i][name];
            if (s) {
                info = s;
                idx = i;
                break;
            }
        }
        return [idx, info];
    }

    public static setLoadAsset(node: Node, loadAsset: YJLoadAssets3D): void {
        let bs: any[] = [].concat(node.getComponentsInChildren('SetSpriteFrameInSampler3D'));
        bs.forEach(b => {
            b.loadAsset = loadAsset;
        });
    }
}
