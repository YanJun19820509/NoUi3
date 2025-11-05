import { YJDynamicAtlas } from "../../engine/YJDynamicAtlas";
import { YJSample2DMaterialManager } from "../../engine/YJSample2DMaterialManager";
import { no } from "../../no";
import { BitmapFont, CacheMode, ccclass, EDITOR, ImageAsset, Label, LabelOutline, property, SpriteFrame, Texture2D } from "../../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Nov 05 2025 17:44:21 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJLabel')
export class YJLabel extends Label {
    @property({ tooltip: '将文本打包到动态图集提升性能' })
    public get packToAtlas(): boolean {
        return this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
        // 注意：修改后需要手动调用setLabel()才会生效
    }

    /** 动态图集打包开关（见packToAtlas属性） */
    @property({ serializable: true })
    protected _packToAtlas: boolean = true;
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

    /** 
     * 组件实例唯一标识符
     * @特性说明：
     * - 用于字体资源关联和缓存查找
     * - 通过no._uuid()生成唯一值
     * @示例
     * this._uid = 'a1b2c3d4-e5f6-7890';
     */
    private _uid: string = '';

    update(dt: number) {
        super.update?.(dt);
        this.initMaterialInfo();
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
        if (this.packToAtlas && this.dynamicAtlas)
            this.dynamicAtlas.removeFromDynamicAtlas(this.ttfSpriteFrame);
        super._applyFontTexture();
        this.dynamicPack();
    }

    private dynamicPack() {
        if (this.font instanceof BitmapFont)
            return;
        if (this.packToAtlas && !this.dynamicAtlas) {
            return requestAnimationFrame(this.dynamicPack.bind(this));
        }

        let frame = this.ttfSpriteFrame;
        if (!frame || frame.original)
            return;

        this.updateUuid();
        frame._uuid = this._uid;
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
        this._uid = no.Hash(styleSignature).toString();
    }
}