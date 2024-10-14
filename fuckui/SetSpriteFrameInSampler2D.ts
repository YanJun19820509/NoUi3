
import { ccclass, property, requireComponent, disallowMultiple, EDITOR, Material, Sprite, SpriteFrame } from '../yj';
import { YJVertexColorTransition } from '../engine/YJVertexColorTransition';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { TextureInfoInGPU } from '../engine/TextureInfoInGPU';
import { YJSample2DMaterialInfo, YJSample2DMaterialManager } from 'NoUi3/engine/YJSample2DMaterialManager';

/**
 * Predefined variables
 * Name = SetSpriteFrameInSampler2D
 * DateTime = Tue Nov 15 2022 22:25:51 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameInSampler2D.ts
 * FileBasenameNoExtension = SetSpriteFrameInSampler2D
 * URL = db://assets/Script/NoUi3/fuckui/SetSpriteFrameInSampler2D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用于设置材质中挂载的纹理采样的区域
 * data:string,为指定spriteFrame的名称
 */

@ccclass('SetSpriteFrameInSampler2D')
@requireComponent([Sprite, YJVertexColorTransition])
@disallowMultiple()
export class SetSpriteFrameInSampler2D extends FuckUi {
    @property
    defaultName: string = '';
    @property({ readonly: true })
    defaultSpriteFrameUuid: string = '';
    @property({ readonly: true })
    defaultUrl: string = '';
    @property({ readonly: true })
    bundleName: string = '';
    @property({ displayName: '从图集加载', readonly: true })
    loadFromAtlas: boolean = true;
    @property({ displayName: '可动态合图', visible() { return !this.loadFromAtlas; } })
    canPack: boolean = true;
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;
    @property({ visible() { return false; } })
    panelName: string;
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    private lastDefine: string;

    private defineIndex: number = 0;
    private _lastName: string;
    private _singleSpriteFrame: SpriteFrame = null;
    private dynamicAtlas: YJDynamicAtlas = null;
    private materialInfo: YJSample2DMaterialInfo;


    onLoad() {
        super.onLoad();
        //运行时update方法置空
        if (!EDITOR) {
            this.update = null;
            this.materialInfo = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid);
            this.dynamicAtlas = this.materialInfo.dynamicAtlas;
        }
    }

    update() {
        if ((this.loadFromAtlas || this.canPack)) {
            this.setDynamicAtlas();
        } else if (!this.loadFromAtlas && !this.canPack) {
            this.getComponent(YJVertexColorTransition).enabled = false;
        }
        this.initSpriteFrameInfo();
    }

    onEnable() {
        if (EDITOR) return;
        if (!this.loadFromAtlas && this.defaultSpriteFrameUuid)
            this.setDefaultSpriteFrame();
        else
            this.setSpriteFrame(this._lastName || this.defaultName);
    }

    onDisable() {
        this._lastName = null;
        // this.a_setEmpty();
    }

    onDestroy() {
        if (this._singleSpriteFrame) {
            this._singleSpriteFrame.decRef();
            this._singleSpriteFrame = null;
        }
        this.getComponent(Sprite).spriteFrame = null;
    }

    public setDynamicAtlas() {
        if (this.defaultSpriteFrameUuid)
            this.loadFromAtlas = !this.defaultSpriteFrameUuid.endsWith('@f9941');
        this.getComponent(YJVertexColorTransition).enabled = this.loadFromAtlas;
        if (!this.loadFromAtlas && !this.canPack) return;
        if (this.getComponent(Sprite).spriteAtlas)
            this.getComponent(Sprite).spriteAtlas = null;
    }

    public initSpriteFrameInfo() {
        if (!EDITOR) return;
        const spriteFrame = this.getComponent(Sprite).spriteFrame;
        if (!spriteFrame) return;
        let name = spriteFrame.name;
        if (this.defaultName != name) {
            this.defaultName = name;
            this.defaultSpriteFrameUuid = spriteFrame.uuid;
            //如果是散图则不从图集加载，散图uuid以@f9941结尾
            if (this.defaultSpriteFrameUuid)
                this.loadFromAtlas = !this.defaultSpriteFrameUuid.endsWith('@f9941');
            no.EditorMode.getAssetInfo(this.defaultSpriteFrameUuid).then(info => {
                this.defaultUrl = info.url.replace(/.png|.jpg/, '');
                no.EditorMode.getBundleName(info.url).then(bundleName => {
                    this.bundleName = bundleName;
                });
                if (!this.loadFromAtlas) {
                    const metaUrl = info.url.replace('/spriteFrame', '');
                    no.EditorMode.getAssetMeta(metaUrl).then(info => {
                        //如果散图有压缩设置，则不能打包
                        if (info.userData.compressSettings?.useCompressTexture) {
                            this.canPack = false;
                            this.getComponent(YJVertexColorTransition).enabled = false;
                        }
                    });
                } else {
                    this.setDynamicAtlas();
                }
            });
        }
    }

    private _data: any;
    onDataChange(data: string) {
        this._data = data;
        if (this.uiAnim?.enabled) this.uiAnim.a_play();
        else this.changeData();
    }

    public a_AnimationEffectCallback() {
        this.changeData();
    }

    private changeData() {
        const data = this._data;
        if (!this.loadFromAtlas) {
            this.setSingleSpriteFrame(data);
            return;
        }
        this.setSpriteFrame(data);
    }

    public setSpriteFrame(name: string) {
        if (!this.enabled || !name) return;
        if (!this.loadFromAtlas) {
            this.resetSprite();
            return;
        }
        if (name == 'null') {
            this.a_setEmpty();
            return;
        }

        if (!this.loadFromAtlas) {
            if (name == this.defaultName)
                this.setDefaultSpriteFrame();
            return;
        }

        const sprite = this.getComponent(Sprite);
        if (!sprite.customMaterial) {
            if (this.dynamicAtlas)
                sprite.customMaterial = this.dynamicAtlas.customMaterial;
        }

        const [i, spriteFrame] = this.materialInfo.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            no.err('这里需要检查下资源使用问题，设置的从合图加载，但未找到资源', this.node.name, name);
            this.resetSprite();
            return;
        }
        if (name != this.defaultName) this._lastName = name;
        if (!this.dynamicAtlas.setCachedSpriteFrameInSample2D(sprite, name))
            this.dynamicAtlas.setSpriteFrameInSample2D(sprite, spriteFrame, name);
        this.setEffect(i);
    }

    private setEffect(idx: number) {
        let t = `${this.defineIndex}-${idx + 1}00`;
        const defines: any = {};
        defines[t] = true;
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }
        this.lastDefine = t;
        this.getComponent(YJVertexColorTransition)?.setEffect(defines);
    }

    private clearEffect() {
        if (this.lastDefine) {
            const defines: any = {};
            defines[this.lastDefine] = false;
            this.getComponent(YJVertexColorTransition)?.setEffect(defines);
        }
    }

    private setDefaultSpriteFrame() {
        if (!this.loadFromAtlas && this.canPack) {
            const sprite = this.getComponent(Sprite);
            if (!sprite.customMaterial) {
                sprite.customMaterial = this.dynamicAtlas.customMaterial;
            }
        }
        if (this.defaultSpriteFrameUuid) {
            const s = no.assetBundleManager.createSpriteFrameFromCache(this.defaultSpriteFrameUuid);
            if (s) {
                this._singleSpriteFrame = s;
                this.packSpriteFrame(s);
                if (TextureInfoInGPU.isWork) {
                    TextureInfoInGPU.addTextureUuidToPanel(s.uuid, this.panelName);
                }
            } else {
                this.loadByUrl();
            }
        }
    }

    private loadByUrl() {
        if (this.defaultUrl.indexOf('db://internal/') == 0) {
            this.loadByUuid();
            return;
        }
        no.assetBundleManager.loadSprite(this.defaultUrl, (file) => {
            if (!file) {
                no.err('setDefaultSpriteFrame by url no file', this.node.name, this.defaultUrl);
                this.loadByUuid();
            } else {
                this._singleSpriteFrame = file;
                this.packSpriteFrame(file);

                if (TextureInfoInGPU.isWork) {
                    TextureInfoInGPU.addTextureUuidToPanel(file.uuid, this.panelName);
                }
            }
        });
    }

    private loadByUuid() {
        no.assetBundleManager.loadByUuid<SpriteFrame>(this.defaultSpriteFrameUuid, (file) => {
            if (!file) {
                no.err('setDefaultSpriteFrame by uuid no file', this.node.name, this.defaultSpriteFrameUuid)
            } else {
                if (EDITOR) {
                    this.getComponent(Sprite).spriteFrame = file;
                } else {
                    this._singleSpriteFrame = file;
                    this.packSpriteFrame(file);

                    if (TextureInfoInGPU.isWork) {
                        TextureInfoInGPU.addTextureUuidToPanel(file.uuid, this.panelName);
                    }
                }
            }
        });
    }

    private setSingleSpriteFrame(name: string) {
        if (this.canPack) {
            const sprite = this.getComponent(Sprite);
            if (!sprite.customMaterial) {
                sprite.customMaterial = this.dynamicAtlas.customMaterial;
            }
        }
        const path = `${this.bundleName}/${name}/spriteFrame`;
        no.assetBundleManager.loadSprite(path, spriteFrame => {
            if (!spriteFrame) {
                no.err('setSingleSpriteFrame no file', name);
            } else {
                if (!this.isValid) {
                    return;
                }
                if (this._data && this._data.indexOf(spriteFrame.name) < 0) {
                    return;
                }
                if (this._singleSpriteFrame) {
                    this._singleSpriteFrame.decRef();
                    this._singleSpriteFrame = null;
                }
                this._singleSpriteFrame = spriteFrame;
                const sprite = this.getComponent(Sprite);
                if (sprite.sizeMode != Sprite.SizeMode.CUSTOM) {
                    sprite.sizeMode = Sprite.SizeMode.RAW;
                }
                sprite.trim = false;
                this.clearEffect();
                this.packSpriteFrame(spriteFrame);

                if (TextureInfoInGPU.isWork) {
                    TextureInfoInGPU.addTextureUuidToPanel(spriteFrame.uuid, this.panelName);
                }
            }
        });
    }

    private packSpriteFrame(frame: SpriteFrame) {
        let sprite = this.getComponent(Sprite);
        if (!frame) return;
        if (no.notUseDynamicAtlas || !this.canPack) {
            sprite.spriteFrame = frame;
            return;
        }
        this.dynamicAtlas?.packToDynamicAtlas(sprite, frame, true, () => {
            sprite.spriteFrame = frame;
        });
    }

    public a_setEmpty(): void {
        this.removeSprite();
    }

    public resetSprite() {
        if (this.defaultSpriteFrameUuid)
            this.loadByUuid();
        else this.removeSprite();
    }

    public removeSprite() {
        this._lastName = null;
        this.getComponent(Sprite).spriteFrame = null;
        this.getComponent(Sprite).spriteAtlas = null;
        if (EDITOR && this.bind_keys) {
            this.defaultName = '';
            this.defaultSpriteFrameUuid = '';
            this.defaultUrl = '';
        }
    }

    public setSpriteEnable(v: boolean) {
        if (!this.enabled) return;
        this.getComponent(Sprite).enabled = v;
    }

    public setSpriteMaterial(material: Material) {
        this.getComponent(Sprite).customMaterial = material;
    }
}