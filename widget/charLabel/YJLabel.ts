import { YJDynamicAtlas } from "../../engine/YJDynamicAtlas";
import { YJSample2DMaterialManager } from "../../engine/YJSample2DMaterialManager";
import { YJMacroConfig } from "../../macro";
import { no } from "../../no";
import { BitmapFont, CacheMode, ccclass, Color, EDITOR, Label, LabelOutline, LabelShadow, property, TTFFont, v2, Vec2 } from "../../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Nov 05 2025 17:44:21 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJLabel')
export class YJLabel extends Label {
    get useSystemFont() {
        return this._isSystemFontUsed;
    }
    set useSystemFont(value) {
        if (this._isSystemFontUsed === value) {
            return;
        }

        super.useSystemFont = value;
        if (!value) {
            // 未指定字体时使用宏配置的默认字体
            const font = YJMacroConfig.TTF_FONT; // 默认字体配置
            if (font) {
                // 异步加载TTF字体资源示例：no.EditorMode.getAssetByFileName("msyh.ttf")
                no.EditorMode.getAssetByFileName<TTFFont>(font).then(ttf => {
                    this.font = ttf; // 设置字体实例
                });
            }
        }
    }
    @property({ displayName: '添加描边' })
    get outline(): boolean {
        return this._outline;
    }
    set outline(v: boolean) {
        if (v == this._outline) return;
        this._outline = v;
        if (v) {
            if (!this.getComponent(LabelOutline))
                this.addComponent(LabelOutline);
        } else {
            this.getComponent(LabelOutline)?.destroy();
        }
    }
    @property({ displayName: '添加阴影' })
    get shadow(): boolean {
        return this._shadow;
    }
    set shadow(v: boolean) {
        if (v == this._shadow) return;
        this._shadow = v;
        if (v) {
            if (!this.getComponent(LabelShadow))
                this.addComponent(LabelShadow);
        } else {
            this.getComponent(LabelShadow)?.destroy();
        }
    }
    @property({ tooltip: '将文本打包到动态图集提升性能' })
    public get packToAtlas(): boolean {
        return this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
        // 注意：修改后需要手动调用setLabel()才会生效
    }

    /** 文字描边宽度（0=无描边） */
    @property({ serializable: true })
    protected _outline: boolean = false;

    /** 描边颜色（默认黑色） */
    @property({ serializable: true })
    protected _shadow: boolean = false;
    /** 动态图集打包开关（见packToAtlas属性） */
    @property({ serializable: true })
    protected _packToAtlas: boolean = false;
    /** 材质信息UUID（渲染系统使用） */
    @property({ visible() { return false; } })
    materialInfoUuid: string = '';

    /** 
     * 动态图集管理实例
     * @类型 YJDynamicAtlas
     * @特性说明：
     * - 用于合并小纹理优化渲染性能
     * - 通过材质管理器获取实例
     * @示例
     * this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(uuid);
     */
    private dynamicAtlas: YJDynamicAtlas = null;

    private _uids: string[] = [];

    private _needPackSpriteFrame: boolean = false;

    onDestroy(): void {
        super.onDestroy?.();

        if (this.packToAtlas && this.dynamicAtlas)
            this.dynamicAtlas.removeFromDynamicAtlas(this.ttfSpriteFrame);
        this.dynamicAtlas.clearPackedTextures(this._uids);
        this._uids.length = 0;
    }

    update(dt: number) {
        super.update?.(dt);
        if (EDITOR) return;
        this.initMaterialInfo();
        if (this._needPackSpriteFrame) {
            this.dynamicPackSpriteFrame();
        }

    }

    public removeLabel() {
        this._texture = null;  // 释放精灵帧资源
    }

    private initMaterialInfo() {
        // 不需要加载材质的情况：非图集模式且不允许动态合图
        if (!this.packToAtlas) return;
        // 缺少材质UUID时初始化失败
        if (!this.materialInfoUuid) return;
        // 已初始化过材质信息时跳过
        if (this.dynamicAtlas) return;

        // 从材质管理器获取配置信息
        this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid)?.dynamicAtlas;
        this.customMaterial = this.dynamicAtlas?.customMaterial; // 关联自定义材质
    }

    protected _applyFontTexture() {
        if (EDITOR) {
            super._applyFontTexture();
            return;
        }
        if (!this._ttfSpriteFrame) {
            super._applyFontTexture();
            this._needPackSpriteFrame = true;
        } else if (!this._needPackSpriteFrame) {
            if (this._ttfSpriteFrame.original)
                this._ttfSpriteFrame._resetDynamicAtlasFrame();
            this._needPackSpriteFrame = true;
        }
    }

    private dynamicPackSpriteFrame() {
        if (this._font instanceof BitmapFont || this.cacheMode === CacheMode.CHAR) {
            this._needPackSpriteFrame = false;
            return;
        }
        if (this.packToAtlas && !this.dynamicAtlas) {
            return;
        }

        this._needPackSpriteFrame = false;
        const uid = this.updateUuid();
        let frame = this.ttfSpriteFrame;
        frame._uuid = uid;
        frame.rotated = false;
        this.dynamicAtlas?.packToDynamicAtlas(this, frame, false);
    }

    private updateUuid() {
        const outline = this.getComponent(LabelOutline);
        let outlineStr = '_';
        if (outline) {
            outlineStr = '_' + outline.color + '_' + outline.width + '_';
        }
        // 拼接所有样式特征参数
        const styleSignature = this.string + "_" + this.color + "_" +
            this.fontSize + "_" + this.fontFamily + outlineStr + (this.isBold ? '1' : '0') + '_' +
            (this.isItalic ? '1' : '0');

        // 生成哈希标识
        const uid = no.Hash(styleSignature).toString();
        no.addToArray(this._uids, uid);
        return uid;
    }
}