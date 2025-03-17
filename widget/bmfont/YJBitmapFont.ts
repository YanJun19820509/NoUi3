
import { EDITOR, ccclass, property, requireComponent, Component, BitmapFont, Label, executeInEditMode, v3, isValid } from '../../yj';
import { no } from '../../no';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { YJSample2DMaterialManager } from 'NoUi3/engine/YJSample2DMaterialManager';

/**
 * Predefined variables
 * Name = YJBitmapFont
 * DateTime = Fri Jul 01 2022 00:00:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJBitmapFont.ts
 * FileBasenameNoExtension = YJBitmapFont
 * URL = db://assets/Script/NoUi3/engine/YJBitmapFont.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJBitmapFont')
@requireComponent([Label])
@executeInEditMode()
/**
 * 位图字体组件，用于动态管理Label的位图字体
 * @example
 * // 编辑器用法：
 * // 1. 将组件挂载到Label节点
 * // 2. 在属性面板拖拽位图字体资源到font属性
 * // 3. 调整size属性控制整体缩放比例
 * 
 * // 运行时动态设置字体：
 * this.getComponent(YJBitmapFont).setBitmapFont('fnt_combat', 'resources/font/fnt_combat');
 */
@ccclass('YJBitmapFont')
@requireComponent([Label])
@executeInEditMode()
export class YJBitmapFont extends Component {
    //#region 属性定义
    /**
     * 位图字体资源
     * @example
     * // 代码设置字体
     * this.getComponent(YJBitmapFont).font = this.fntAsset;
     */
    @property(BitmapFont)
    public get font(): BitmapFont {
        return null;
    }

    public set font(v: BitmapFont) {
        if (v == this._font || !v) return;
        this._font = v;
        this.fontName = v.name;
        this.fontUuid = v.uuid;
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            this.fontUrl = url;
        });
        const label = this.getComponent(Label);
        if (label) {
            label.fontSize = v.fontSize;
            label.lineHeight = v.fntConfig.commonHeight;
        }
        this.setSize();
        this.setFont(v);
    }

    /**
     * 字体显示缩放比例（基于原始字体大小的缩放系数）
     * @example
     * // 设置为2表示双倍大小
     * this.getComponent(YJBitmapFont).size = 2;
     */
    @property
    public get size(): number {
        return this._size;
    }

    public set size(v: number) {
        this._size = v;
        this.setSize();
    }

    /**
     * 字符水平间距调整
     * @example
     * // 增加字符间距
     * this.getComponent(YJBitmapFont).spacingX = 5;
     */
    @property
    public get spacingX(): number {
        return this._spacingX;
    }

    public set spacingX(v: number) {
        if (this._spacingX == v) return;
        this._spacingX = v;
        this.getComponent(Label).spacingX = v;
    }

    /**
     * 清空当前字体（编辑器用）
     */
    @property
    public get clearFont(): boolean {
        return false;
    }

    public set clearFont(v: boolean) {
        this.fontName = '';
        this.fontUuid = '';
        this.removeFont();
    }

    @property({ readonly: true })
    fontName: string = ''; // 字体资源名称
    @property({ readonly: true })
    fontUuid: string = ''; // 字体资源UUID
    @property({ readonly: true })
    fontUrl: string = '';  // 字体资源路径

    /**
     * 是否打包到动态图集（优化渲染批次）
     */
    @property
    public get packToAtlas(): boolean {
        return this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
    }
    //#endregion

    //#region 序列化字段
    @property({ serializable: true })
    protected _packToAtlas: boolean = true; // 是否打包到动态图集
    @property({ serializable: true })
    protected _spacingX: number = 0;        // 水平间距存储字段
    @property({ serializable: true })
    protected _size: number = 0;            // 缩放比例存储字段
    @property({ visible() { return false; } })
    materialInfoUuid: string;               // 材质信息UUID（动态图集相关）
    //#endregion

    private _font: BitmapFont = null;       // 当前使用的位图字体
    private dynamicAtlas: YJDynamicAtlas = null; // 动态图集实例

    onLoad() {
        if (EDITOR) {
            // 编辑器模式初始化
            const label = this.getComponent(Label),
                font = label.font;
            if (font && font instanceof BitmapFont) {
                this.font = font;
                this.spacingX = label.spacingX;
                label.font = null;
                label.enabled = false;
            }
            this.getComponent('YJDynamicTexture')?.destroy();
        } else {
            // 运行时初始化
            if (this._spacingX != 0)
                this.getComponent(Label).spacingX = this._spacingX;
            if (this.fontUuid)
                this.setBitmapFont(this.fontUuid, this.fontUrl);
            if (this.packToAtlas)
                this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid).dynamicAtlas;
        }
    }

    onDestroy() {
        // 释放字体资源引用
        if (this._font) no.assetBundleManager.decRef(this._font);
        this._font = null;
    }

    /**
     * 重置字体（用于热更新后重新加载）
     * @example
     * // 当检测到字体资源更新后调用
     * this.getComponent(YJBitmapFont).resetFont();
     */
    public resetFont() {
        if (this.fontUuid == '') return;
        no.assetBundleManager.loadByUuid<BitmapFont>(this.fontUuid, bf => {
            this.setFont(bf);
        });
        if (!this.fontUrl) {
            no.EditorMode.getAssetUrlByUuid(this.fontUuid).then(url => {
                this.fontUrl = url;
            });
        }
    }

    /**
     * 动态设置位图字体
     * @param fontUuid 字体资源UUID
     * @param url 字体资源路径（可选）
     * @example
     * // 运行时切换字体
     * this.getComponent(YJBitmapFont).setBitmapFont('fnt_new', 'resources/fonts/fnt_new');
     */
    public async setBitmapFont(fontUuid: string, url?: string) {
        const bf = await this.loadFont(fontUuid, url);
        this.setAtlasFont(bf);
    }

    //#region 字体加载逻辑
    private getFontFromCache(fontUuid: string) {
        return no.assetBundleManager.getCachedAsset<BitmapFont>(fontUuid);
    }

    private setFontToCache(fontUuid: string, bf: BitmapFont) {
        if (!this.getFontFromCache(fontUuid))
            no.assetBundleManager.cacheAsset(fontUuid, bf);
    }

    /**
     * 加载字体资源流程：
     * 1. 检查缓存
     * 2. 检查是否正在加载
     * 3. 发起异步加载
     * 4. 缓存加载结果
     */
    private async loadFont(fontUuid: string, url: string): Promise<BitmapFont> {
        if (!url) {
            no.err('YJBitmapFont', 'loadFont', 'url is null');
            return
        }
        const bf = this.getFontFromCache(url);
        if (bf) return bf;
        else if (no.assetBundleManager.isAssetLoading(url)) {
            await no.sleep(0);
            return this.loadFont(fontUuid, url);
        }
        else {
            no.assetBundleManager.loadingAsset(url);
            return new Promise<BitmapFont>(resolve => {
                no.assetBundleManager.loadFile(url, BitmapFont, (bf: BitmapFont) => {
                    this.setFontToCache(url, bf);
                    resolve(bf);
                    no.assetBundleManager.assetLoadingEnd(url);
                });
            }).catch(e => {
                console.error(e);
                return null;
            });
        }
    }
    //#endregion

    //#region 字体应用逻辑
    /**
     * 将字体打包到动态图集（优化合批）
     * @param bf 位图字体资源
     */
    private setAtlasFont(bf: BitmapFont) {
        if (!EDITOR && bf && this.dynamicAtlas) {
            this.dynamicAtlas.packBitmapFontSpriteFrameToDynamicAtlas(bf, false, (nbf) => {
                this._font = nbf;
                this.setFont(nbf);
            }, () => {
                this.setFont(bf);
            });
        } else
            this.setFont(bf);
    }

    /**
     * 应用字体到Label组件
     * @param font 要应用的位图字体
     */
    private setFont(font: BitmapFont) {
        if (!isValid(this)) return;
        const label = this.getComponent(Label);
        if (font) {
            label.useSystemFont = false;
            label.font = font;
        }
        if (!label.customMaterial)
            label.customMaterial = this.dynamicAtlas?.customMaterial;
        label.enabled = true;
    }

    /**
     * 根据缩放比例调整节点尺寸
     */
    private setSize() {
        if (!this.size) return;
        const label = this.getComponent(Label);
        if (!label) return;
        const scale = this.size / label.fontSize;
        no.scale(this.node, v3(scale, scale, 1));
    }

    /**
     * 移除当前字体
     */
    removeFont() {
        const label = this.getComponent(Label);
        if (label.font) no.assetBundleManager.decRef(label.font);
        label.font = null;
        label.enabled = false;
    }
    //#endregion
}
