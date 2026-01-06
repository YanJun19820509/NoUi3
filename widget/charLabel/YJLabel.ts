import { YJDynamicAtlas } from "../../engine/YJDynamicAtlas";
import { YJSample2DMaterialManager } from "../../engine/YJSample2DMaterialManager";
import { YJMacroConfig } from "../../macro";
import { no } from "../../no";
import { BitmapFont, CacheMode, ccclass, Color, EDITOR, Label, LabelOutline, property, TTFFont, v2, Vec2, Node, LabelShadow, executeInEditMode } from "../../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Nov 05 2025 17:44:21 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJLabel')
@executeInEditMode()
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
    @property
    get string(): string {
        return super.string;
    }
    set string(v: string) {
        super.string = v;
        if (this.shadowNode) {
            this.shadowNode.getComponent(Label).string = v;
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
            this.createShadow();
        } else {
            this.getComponent(LabelShadow)?.destroy();
            this.destroyShadow();
        }
    }
    @property({ visible() { return this.shadow } })
    public get shadowColor(): Color {
        return this._shadowColor;
    }

    public set shadowColor(v: Color) {
        if (v.equals(this._shadowColor)) return;
        this._shadowColor = v;
        if (this.shadowNode) {
            this.shadowNode.getComponent(Label).color = v;
        }
    }

    /** 
     * 阴影偏移量（单位：逻辑像素）
     * @特性说明：
     * - 实际偏移量 = 设置值 * hdpScale（当启用HDP时）
     * - 正方向：x向右，y向下
     * - 返回新Vec2对象，修改返回值不会影响原始值
     * @示例
     * this.shadowOffset = new Vec2(2, 2); // 右下偏移2像素
     * this.shadowOffset = new Vec2(-1, 0); // 向左偏移1像素
     */
    @property({ visible() { return this.shadow } })
    public get shadowOffset(): Vec2 {
        return this._shadowOffset
    }

    public set shadowOffset(v: Vec2) {
        if (v.equals(this._shadowOffset)) return;
        this._shadowOffset = v;
        let pos = this.shadowNode.position;
        this.node.setPosition(pos.x - this._shadowOffset.x, pos.y - this._shadowOffset.y, 0);
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

    /** 阴影偏移量（x,y方向偏移） */
    @property({ serializable: true })
    protected _shadowOffset: Vec2 = v2();

    /** 阴影颜色（默认黑色） */
    @property({ serializable: true })
    protected _shadowColor: Color = Color.BLACK.clone();
    @property({ type: Node, visible() { return this.shadow } })
    shadowNode: Node = null;

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

    onLoad() {
        super.onLoad?.();
        if (!EDITOR) {
            return;
        }
        let shadow = this.getComponent(LabelShadow);
        if (shadow) {
            this.shadow = true;
            this.shadowColor = shadow.color;
            this.shadowOffset = shadow.offset;
            this.createShadow();
            shadow.destroy();
        }
    }

    onDestroy(): void {
        super.onDestroy?.();

        if (this.packToAtlas && this.dynamicAtlas) {
            this.dynamicAtlas.removeFromDynamicAtlas(this.ttfSpriteFrame);
            this.dynamicAtlas.clearPackedTextures(this._uids);
            this._uids.length = 0;
        }
    }

    update(dt: number) {
        super.update?.(dt);
        if (EDITOR) return;
        this.initMaterialInfo();
        if (this._needPackSpriteFrame) {
            this.dynamicPackSpriteFrame();
        }

    }

    // public removeLabel() {
    //     this._texture = null;  // 释放精灵帧资源
    // }

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

    private createShadow() {
        if (!EDITOR) return;
        if (this.shadowNode) return;
        this.shadowNode = no.newNode(`${this.node.name}_shadow`, [Label]);
        this.shadowNode.parent = this.node.parent;
        this.shadowNode.getComponent(Label).color = this._shadowColor;
        this.shadowNode.getComponent(Label).fontSize = this.fontSize;
        this.shadowNode.getComponent(Label).font = this.font;
        this.shadowNode.getComponent(Label).isBold = this.isBold;
        this.shadowNode.getComponent(Label).isItalic = this.isItalic;
        this.shadowNode.getComponent(Label).isUnderline = this.isUnderline;
        this.shadowNode.getComponent(Label).string = this.string;
        this.shadowNode.getComponent(Label).horizontalAlign = this.horizontalAlign;
        this.shadowNode.getComponent(Label).verticalAlign = this.verticalAlign;
        this.shadowNode.getComponent(Label).overflow = this.overflow;
        this.shadowNode.getComponent(Label).lineHeight = this.lineHeight;
        this.shadowNode.getComponent(Label).enableWrapText = this.enableWrapText;
        let pos = this.node.position;
        this.shadowNode.setPosition(pos);
        this.node.setPosition(pos.x - this._shadowOffset.x, pos.y - this._shadowOffset.y, 0);
        this.node.setSiblingIndex(this.node.parent.children.length - 1);
    }

    private destroyShadow() {
        if (!EDITOR) return;
        if (!this.shadowNode) return;
        this.node.setPosition(this.shadowNode.position);
        this.shadowNode.destroy();
        this.shadowNode = null;
    }
}