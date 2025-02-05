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
    @property({ displayName: '搜索需要加载的纹理' })
    public get getAllAssets(): boolean {
        return false;
    }

    public set getAllAssets(v: boolean) {
        const list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            textureUuid: string[] = [];
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            if (a.loadFromAtlas) {
                const sf = a.getComponent(Sprite).spriteFrame;
                if (sf) {
                    let uuid = sf.texture.uuid;
                    no.addToArray(textureUuid, uuid);
                } else {
                    no.warn(`需要手动添加相关的纹理：节点${a.node.name},bindKeys${a.bind_keys}`);
                }
            }
        }
        this.textureInfos.length = 0;
        for (let i = 0; i < textureUuid.length; i++) {
            const info = new TextureInfo();
            info.addTexture(textureUuid[i]).then(v => { if (v) this.textureInfos[this.textureInfos.length] = info });
        }
    }
    @property({ type: TextureInfo, displayName: '纹理信息' })
    textureInfos: TextureInfo[] = [];
    @property({ displayName: '更新纹理信息' })
    public get updateAllAssets(): boolean {
        return false;
    }

    public set updateAllAssets(v: boolean) {
        if (this.textureInfos.length == 0) {
            this.getAllAssets = true;
            return;
        }
        const ps: Promise<string>[] = [];
        for (let i = 0; i < this.textureInfos.length; i++) {
            const a = this.textureInfos[i];
            if (a.path.indexOf('db://assets/') == 0)
                ps.push(no.EditorMode.getAssetUuidByUrl(a.path.replace('/texture', '.png/texture')));
            else
                ps.push(no.EditorMode.getAssetUuidByUrl(a.base + a.bundleName + '/' + a.path.replace('/texture', '.png/texture')));
        }
        Promise.all(ps).then(uuids => {
            this.textureInfos.length = 0;
            for (let i = 0; i < uuids.length; i++) {
                const info = new TextureInfo();
                info.addTexture(uuids[i]).then(v => { if (v) this.textureInfos[this.textureInfos.length] = info });
            }
        });
    }

    @property({ displayName: '显示SpriteFrame' })
    public get showSpriteFrame(): boolean {
        return this._show;
    }
    private _show: boolean = false;

    public set showSpriteFrame(v: boolean) {
        this._show = v;
        this.showSubSpriteFrame(v);
    }

    private showSubSpriteFrame(v: boolean) {
        const name = no.getPrototype(this.node.getComponent('PopuPanelContent') || this.node.getComponent('YJPanel'))?.name || this.node.name;
        this._materialKey = name;
        let list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetSprite();
            else {
                list[i].removeSprite();
                list[i].materialInfoUuid = name;
                list[i].panelName = name;
            }
        }
        list = this.getComponentsInChildren('YJLanguageSprite');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetSprite();
            else {
                list[i].removeSprite();
                list[i].materialInfoUuid = name;
            }
        }
        list = this.getComponentsInChildren('YJBitmapFont');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetFont();
            else {
                list[i].removeFont();
                list[i].materialInfoUuid = name;
            }
        }
        list = this.getComponentsInChildren('YJLanguageLabel');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetLabel();
            else {
                list[i].removeLabel();
            }
        }
        list = this.getComponentsInChildren('YJCharLabel');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetLabel();
            else {
                list[i].removeLabel();
                list[i].materialInfoUuid = name;
                list[i].panelName = name;
            }
        }
        list = this.getComponentsInChildren('SetMaterial');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetMaterial();
            else {
                list[i].removeMaterial();
            }
        }
        list = this.getComponentsInChildren('SetSpriteFrame');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetSprite();
            else {
                list[i].removeSprite();
            }
        }
        if (!v) {
            list = this.getComponentsInChildren(Button);
            for (let i = 0; i < list.length; i++) {
                let a = list[i] as Button;
                if (a.getComponent('SetSpriteFrameInSampler2D') || a.getComponent('SetSpriteFrame') || !a.getComponent('Sprite')) {
                    a.normalSprite = null;
                    a.hoverSprite = null;
                    a.pressedSprite = null;
                    a.disabledSprite = null;
                }
            }
            list = this.getComponentsInChildren('YJLoadPrefab');
            for (let i = 0; i < list.length; i++) {
                list[i].materialInfoUuid = name;
            }
            list = this.getComponentsInChildren('YJDynamicTexture');
            for (let i = 0; i < list.length; i++) {
                list[i].materialInfoUuid = name;
            }
        }
    }

    @property({ visible() { return false; } })
    _materialKey: string = '';

    onLoad() {
        if (EDITOR) {
            // this.showSpriteFrame = true;
            this.textureInfos.forEach(info => {
                info.resetInfo();
            });
        }
        // this.setPanelNameToSubNode();
    }

    onDestroy() {
        this.release();
    }

    /**
     * 加载图集
     */
    public async load() {
        return YJSample2DMaterialManager.ins.createAtlasMaterial(this._materialKey, this.textureInfos, this.share);
    }

    /**
     * 释放图集
     */
    public release() {
        YJSample2DMaterialManager.ins.getMaterialInfo(this._materialKey)?.destroy();
        if (TextureInfoInGPU.isWork) {
            const name = this.node.name;
            no.setTimeoutF(() => {
                TextureInfoInGPU.showTextureWhenPanelDestroy(name);
            }, 500);
        }
    }

    // private setPanelNameToSubNode() {
    //     if (TextureInfoInGPU.isWork) {
    //         const arr = [].concat(this.getComponentsInChildren('SetSpriteFrameInSampler2D'), this.getComponentsInChildren('YJCharLabel')),
    //             name = this.node.name;
    //         arr.forEach(item => item.panelName = name);
    //     }
    // }

    public static setMaterialInfoUuidToSubNode(node: Node, materialInfoUuid: string) {
        if (!node || !materialInfoUuid) return;
        const arr = [].concat(
            node.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            node.getComponentsInChildren('YJLanguageSprite'),
            node.getComponentsInChildren('YJCharLabel'),
            node.getComponentsInChildren('YJDynamicTexture'),
            node.getComponentsInChildren('YJBitmapFont'),
            node.getComponentsInChildren('YJLoadPrefab'),
            node.getComponentsInChildren('YJDynamicTexture')
        );
        for (let i = 0; i < arr.length; i++) {
            arr[i].materialInfoUuid = materialInfoUuid;
        }
    }
}
