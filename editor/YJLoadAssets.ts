import { ccclass, property, menu, Component, Node, Sprite, } from '../yj';
import { no } from '../no';
import { TextureInfo } from '../types';
import { TextureInfoInGPU } from '../engine/TextureInfoInGPU';
import { YJSample2DMaterialManager } from '../engine/YJSample2DMaterialManager';

/**
 * Predefined variables
 * Name = YJLoadAssets
 * DateTime = Tue Mar 15 2022 18:48:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLoadAssets.ts
 * FileBasenameNoExtension = YJLoadAssets
 * URL = db://assets/NoUi3/base/YJLoadAssets.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
export class YJLoadAssets extends Component {
    @property({ displayName: '共享材质' })
    share: boolean = true;
    @property({ displayName: '搜索需要加载的纹理' })
    public get getAllAssets(): boolean {
        return false;
    }

    public set getAllAssets(v: boolean) {
        const list: any = this.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            textureUuid: string[] = [];
        list.forEach(a => {
            if (a.loadFromAtlas) {
                const sf = a.getComponent(Sprite).spriteFrame;
                if (sf) {
                    let uuid = sf.texture.uuid;
                    no.addToArray(textureUuid, uuid);
                } else {
                    no.warn(`需要手动添加相关的纹理：节点${a.node.name},bindKeys${a.bind_keys}`);
                }
            }
        });
        this.textureInfos.length = 0;
        textureUuid.forEach(uuid => {
            const info = new TextureInfo();
            info.addTexture(uuid);
            this.textureInfos[this.textureInfos.length] = info;
        });
    }
    @property({ type: TextureInfo, displayName: '纹理信息' })
    textureInfos: TextureInfo[] = [];

    private materialInfoUuid: string;

    onLoad() {
        this.setPanelNameToSubNode();
    }

    onDestroy() {
        this.release();
    }

    /**
     * 加载图集
     */
    public async load() {
        const name = no.getPrototype(this.node.getComponent('PopuPanelContent') || this.node.getComponent('YJPanel'))?.name || this.node.name;
        const materialInfoUuid = await YJSample2DMaterialManager.ins.createAtlasMaterial(name, this.textureInfos, this.share);
        this.materialInfoUuid = materialInfoUuid;
        const arr = [].concat(
            this.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            this.getComponentsInChildren('YJCharLabel'),
            this.getComponentsInChildren('YJDynamicTexture'),
            this.getComponentsInChildren('YJBitmapFont')
        );
        arr.forEach(item => item.materialInfoUuid = materialInfoUuid);
    }

    /**
     * 释放图集
     */
    public release() {
        YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid).destroy();
        if (TextureInfoInGPU.isWork) {
            const name = this.node.name;
            no.setTimeoutF(() => {
                TextureInfoInGPU.showTextureWhenPanelDestroy(name);
            }, 500);
        }
    }

    private setPanelNameToSubNode() {
        if (TextureInfoInGPU.isWork) {
            const arr = [].concat(this.getComponentsInChildren('SetSpriteFrameInSampler2D'), this.getComponentsInChildren('YJCharLabel')),
                name = this.node.name;
            arr.forEach(item => item.panelName = name);
        }
    }
}
