
import { ccclass, property, requireComponent, disallowMultiple, EDITOR, Material, Sprite, SpriteFrame, isValid } from '../yj';
import { YJVertexColorTransitionManager } from '../engine/YJVertexColorTransition';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { TextureInfoInGPU } from '../engine/TextureInfoInGPU';
import { YJSample2DMaterialInfo, YJSample2DMaterialManager } from 'NoUi3/engine/YJSample2DMaterialManager';
import { YJi18n } from 'NoUi3/base/YJi18n';
import { YJMacroConfig } from 'NoUi3/macro';
import { YJJobManager } from 'NoUi3/base/YJJobManager';

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
@requireComponent([Sprite])
@disallowMultiple()
export class SetSpriteFrameInSampler2D extends FuckUi {
    @property
    defaultName: string = '';
    @property({ readonly: true })
    defaultSpriteFrameUuid: string = '';
    @property({ readonly: true })
    defaultUrl: string = '';
    @property
    bundleName: string = '';
    @property({ displayName: '从图集加载', readonly: true })
    loadFromAtlas: boolean = true;
    @property({ displayName: '可动态合图', visible() { return !this.loadFromAtlas; } })
    canPack: boolean = false;
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;
    @property({ visible() { return false; } })
    panelName: string;
    @property({ visible() { return false; } })
    materialInfoUuid: string;
    @property({ displayName: '多语言' })
    multiLan: boolean = false;

    private lastDefine: string;

    private defineIndex: number = 0;
    // private _lastName: string;
    private _singleSpriteFrame: SpriteFrame = null;
    private dynamicAtlas: YJDynamicAtlas = null;
    private materialInfo: YJSample2DMaterialInfo;

    update() {
        if (EDITOR) {
            if (this.defaultName == '' && this.defaultSpriteFrameUuid != '') {
                this.defaultSpriteFrameUuid = '';
                this.defaultUrl = '';
                this.loadFromAtlas = false;
                this.canPack = false;
                return;
            }
        }
        if ((this.loadFromAtlas || this.canPack)) {
            this.setDynamicAtlas();
        }
        this.initSpriteFrameInfo();
    }

    onEnable() {
        if (EDITOR) return;
        if (!this.initMaterialInfo()) {
            return requestAnimationFrame(this.onEnable.bind(this));
        };
        if (this.multiLan && this.defaultName) {
            this.checkLanguageChange();
            YJi18n.ins.onLanguagechange(this.checkLanguageChange, this);
            return
        }
        if (!this.loadFromAtlas && this.defaultSpriteFrameUuid)
            YJJobManager.ins.addTask(() => {
                this.setDefaultSpriteFrame();
                return true;
            });
        else if (this.defaultName)
            YJJobManager.ins.addTask(() => {
                this.setSpriteFrame(this.defaultName);
                return true;
            });
    }

    private initMaterialInfo() {
        if (!this.loadFromAtlas && !this.canPack) return true;
        if (!this.materialInfoUuid) return false;
        if (this.materialInfo) return true;
        this.materialInfo = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid);
        if (!this.materialInfo) return false;
        this.dynamicAtlas = this.materialInfo.dynamicAtlas;
        return true;
    }

    private checkLanguageChange() {
        YJJobManager.ins.addTask(() => {
            this.setSingleSpriteFrame(this.defaultName);
            return true;
        });
    }

    onDisable() {
        // this._lastName = null;
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
                this.multiLan = this.defaultUrl.indexOf('/language/') > -1;
                no.EditorMode.getBundleName(info.url).then(bundleName => {
                    this.bundleName = bundleName;
                });
                if (!this.loadFromAtlas) {
                    const metaUrl = info.url.replace('/spriteFrame', '');
                    no.EditorMode.getAssetMeta(metaUrl).then(info => {
                        //如果散图有压缩设置，则不能打包
                        if (info.userData.compressSettings?.useCompressTexture) {
                            this.canPack = false;
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
        this._data = data + '';
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

        if (!this.materialInfo) {
            return requestAnimationFrame(this.changeData.bind(this));
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
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }

        const [i, spriteFrame] = this.materialInfo.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            no.err('这里需要检查下资源使用问题，设置的从合图加载，但未找到资源', this.node.name, name);
            this.resetSprite();
            return;
        }
        if (YJMacroConfig.ENABLE_DYNAMIC_BATCH_RENDER) {
            // if (name != this.defaultName) this._lastName = name;
            if (!this.dynamicAtlas?.setCachedSpriteFrameInSample2D(sprite, name))
                this.dynamicAtlas?.setSpriteFrameInSample2D(sprite, spriteFrame, name);
            this.setEffect(i);
        } else {
            this.setSpriteFrameByUuid(spriteFrame.uuid);
        }
    }

    private setEffect(idx: number) {
        let t = `${this.defineIndex}-${idx + 1}00`;
        const defines: any = {};
        defines[t] = true;
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }
        this.lastDefine = t;
        YJVertexColorTransitionManager.ins().add(this.getComponent(Sprite), defines);
    }

    private clearEffect() {
        if (this.lastDefine) {
            const defines: any = {};
            defines[this.lastDefine] = false;
            YJVertexColorTransitionManager.ins().remove(this.getComponent(Sprite));
        }
    }

    private setSpriteFrameByUuid(uuid: string) {
        no.assetBundleManager.loadByUuid<SpriteFrame>(uuid, (file) => {
            if (!file) {
                no.err('setSpriteFrameByUuid by uuid no file', this.node?.name, uuid)
            } else {
                this.getComponent(Sprite).spriteFrame = file;
                if (!EDITOR) {

                    if (this._singleSpriteFrame) {
                        this._singleSpriteFrame.decRef();
                        this._singleSpriteFrame = null;
                    }
                    this._singleSpriteFrame = file;

                    if (TextureInfoInGPU.isWork) {
                        TextureInfoInGPU.addTextureUuidToPanel(file.uuid, this.panelName);
                    }
                }
            }
        });
    }

    private setDefaultSpriteFrame() {
        const sprite = this.getComponent(Sprite);
        if (!sprite.customMaterial) {
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }
        if (this.defaultSpriteFrameUuid) {
            const s = no.assetBundleManager.createSpriteFrameFromCache(this.defaultSpriteFrameUuid);
            if (s) {
                if (this._singleSpriteFrame) {
                    this._singleSpriteFrame.decRef();
                    this._singleSpriteFrame = null;
                }
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
                if (this._singleSpriteFrame) {
                    this._singleSpriteFrame.decRef();
                    this._singleSpriteFrame = null;
                }
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
                no.err('setDefaultSpriteFrame by uuid no file', this.node?.name, this.defaultSpriteFrameUuid)
            } else {
                if (EDITOR) {
                    this.getComponent(Sprite).spriteFrame = file;
                } else {
                    if (this._singleSpriteFrame) {
                        this._singleSpriteFrame.decRef();
                        this._singleSpriteFrame = null;
                    }
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
        if (!isValid(this)) return;
        const sprite = this.getComponent(Sprite);
        if (!sprite.customMaterial) {
            sprite.customMaterial = this.dynamicAtlas?.customMaterial;
        }
        let path: string;
        if (this.multiLan) {
            path = `${YJi18n.ins.language}/${name}/spriteFrame`;
        } else path = `${this.bundleName}/${name}/spriteFrame`;
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

                if (TextureInfoInGPU.isWork && this.panelName) {
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
        // this._lastName = null;
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