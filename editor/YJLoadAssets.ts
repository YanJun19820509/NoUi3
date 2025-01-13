import { ccclass, property, menu, Component, Node, Sprite, Button, EDITOR, executeInEditMode, } from '../yj';
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
@executeInEditMode()
export class YJLoadAssets extends Component {
    @property({ displayName: '共享材质' })
    share: boolean = true;
    @property({ displayName: '搜索需要加载的纹理', editorOnly: true })
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
            info.addTexture(uuid).then(v => { if (v) this.textureInfos[this.textureInfos.length] = info });
        });
    }
    @property({ type: TextureInfo, displayName: '纹理信息' })
    textureInfos: TextureInfo[] = [];
    @property({ displayName: '更新纹理信息', editorOnly: true })
    public get updateAllAssets(): boolean {
        return false;
    }

    public set updateAllAssets(v: boolean) {
        if (this.textureInfos.length == 0) {
            return;
        }
        const ps: Promise<string>[] = [];
        this.textureInfos.forEach(a => {
            ps.push(no.EditorMode.getAssetUuidByUrl(a.base + a.bundleName + '/' + a.path.replace('/texture', '.png/texture')));
        });
        Promise.all(ps).then(uuids => {
            this.textureInfos.length = 0;
            uuids.forEach(uuid => {
                const info = new TextureInfo();
                info.addTexture(uuid).then(v => { if (v) this.textureInfos[this.textureInfos.length] = info });
            });
        });
    }

    @property({ displayName: '显示SpriteFrame', editorOnly: true })
    public get showSpriteFrame(): boolean {
        return this._show;
    }
    private _show: boolean = false;

    public set showSpriteFrame(v: boolean) {
        this._show = v;
        this.showSubSpriteFrame(v);
    }

    private showSubSpriteFrame(v: boolean) {
        let list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D');
        list.forEach(a => {
            if (v) a.resetSprite();
            else {
                a.removeSprite();
            }
        });
        list = this.getComponentsInChildren('YJLanguageSprite');
        list.forEach(a => {
            if (v) a.resetSprite();
            else {
                a.removeSprite();
            }
        });
        list = this.getComponentsInChildren('YJBitmapFont');
        list.forEach(a => {
            if (v) a.resetFont();
            else a.removeFont();
        });
        list = this.getComponentsInChildren('YJLanguageLabel');
        list.forEach(a => {
            if (v) a.resetLabel();
            else a.removeLabel();
        });
        list = this.getComponentsInChildren('YJCharLabel');
        list.forEach(a => {
            if (v) a.resetLabel();
            else a.removeLabel();
        });
        list = this.getComponentsInChildren('SetMaterial');
        list.forEach(a => {
            if (v) a.resetMaterial();
            else a.removeMaterial();
        });
        list = this.getComponentsInChildren('SetSpriteFrame');
        list.forEach(a => {
            if (v) a.resetSprite();
            else {
                a.removeSprite();
            }
        });
        if (!v) {
            list = this.getComponentsInChildren(Button);
            list.forEach((a: Button) => {
                if (a.getComponent('SetSpriteFrameInSampler2D') || a.getComponent('SetSpriteFrame') || !a.getComponent('Sprite')) {
                    a.normalSprite = null;
                    a.hoverSprite = null;
                    a.pressedSprite = null;
                    a.disabledSprite = null;
                }
            });
        }
    }

    private materialInfoUuid: string;

    onLoad() {
        if (EDITOR) {
            this.showSpriteFrame = true;
        }
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
        return YJSample2DMaterialManager.ins.createAtlasMaterial(name, this.textureInfos, this.share).then(uuid => {
            this.materialInfoUuid = uuid;
            YJLoadAssets.setMaterialInfoUuidToSubNode(this.node, uuid);
            return;
        });
    }

    /**
     * 释放图集
     */
    public release() {
        YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid)?.destroy();
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

    public static setMaterialInfoUuidToSubNode(node: Node, materialInfoUuid: string) {
        if (!node) return;
        const arr = [].concat(
            node.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            node.getComponentsInChildren('YJLanguageSprite'),
            node.getComponentsInChildren('YJCharLabel'),
            node.getComponentsInChildren('YJDynamicTexture'),
            node.getComponentsInChildren('YJBitmapFont'),
            node.getComponentsInChildren('YJLoadPrefab')
        );
        arr.forEach(item => item.materialInfoUuid = materialInfoUuid);
    }
}
