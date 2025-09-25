import { EDITOR, ccclass, property, Font, Color, Label, Vec2, v2, Sprite, Enum, SpriteFrame, Texture2D, CCString, ImageAsset, SpriteAtlas, math, HtmlTextParser, IHtmlTextParserResultObj, isValid, HorizontalTextAlignment, view, TTFFont, color } from '../../yj';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { YJJobManager } from '../../base/YJJobManager';
import { TextureInfoInGPU } from '../../engine/TextureInfoInGPU';
import { DynamicAtlasTexture } from '../../engine/atlas';
import { YJSample2DMaterialManager } from '../../engine/YJSample2DMaterialManager';
import { YJMacroConfig } from '../../macro';
import { YJGradientColor } from './YJGradientColor';

/**
 * Predefined variables
 * Name = YJCharLabel
 * DateTime = Fri May 06 2022 09:16:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCharLabel.ts
 * FileBasenameNoExtension = YJCharLabel
 * URL = db://assets/common/widget/charLabel/YJCharLabel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 自定义文本组件,使用时替换掉Label组件
 */


//已测量文字最大最小宽
const _measuredWidth: Map<string, number> = new Map();

@ccclass('YJCharLabel')
/**
 * 自定义文本渲染组件
 * 继承自Sprite组件，支持富文本、描边、渐变色等特性
 */
export class YJCharLabel extends Sprite {
    // Sprite图集属性（强制隐藏，本组件使用动态图集管理）
    @property({ visible() { return false; }, override: true })
    set spriteAtlas(v: SpriteAtlas) {
        super.spriteAtlas = v;
    }
    get spriteAtlas(): SpriteAtlas {
        return super.spriteAtlas;
    }

    // Sprite帧属性（强制隐藏，通过文本内容动态生成）
    // @example 本组件中设置spriteFrame会触发以下操作：
    // 1. 标记渲染数据需要更新
    // 2. 应用新的spriteFrame
    // 3. 在编辑器中发送变更事件
    @property({ visible() { return false; }, override: true })
    set spriteFrame(value: SpriteFrame) {
        if (this._spriteFrame === value) {
            return;
        }

        const lastSprite = this._spriteFrame;
        this._spriteFrame = value;
        this.markForUpdateRenderData(); // 标记需要更新渲染数据
        this['_applySpriteFrame'](lastSprite); // 应用新的spriteFrame
        if (EDITOR) { // 编辑器环境下发送事件
            this.node.emit(Sprite.EventType.SPRITE_FRAME_CHANGED, this);
        }
    }
    get spriteFrame(): SpriteFrame {
        return this._spriteFrame;
    }

    // 尺寸模式属性（强制隐藏，使用自定义尺寸计算逻辑）
    @property({ visible() { return false; }, override: true })
    set sizeMode(v: number) {
        super.sizeMode = v;
    }
    get sizeMode(): number {
        return super.sizeMode;
    }

    // Sprite类型属性（强制隐藏，固定为简单模式）
    @property({ visible() { return false; }, override: true })
    set type(v: number) {
        super.type = v;
    }
    get type(): number {
        return super.type;
    }

    // 灰度效果属性（禁用，文本组件不支持灰度效果）
    // @example 尝试设置时会无操作：this.grayscale = true
    @property({ visible() { return false; }, override: true })
    set grayscale(v: boolean) {
        // 文本组件不支持灰度效果，保留空实现
    }
    get grayscale(): boolean {
        return false;
    }

    // 自动修剪属性（强制启用，优化文本渲染）
    @property({ visible() { return false; }, override: true })
    set trim(v: boolean) {
        // 强制启用修剪，保留空实现
    }
    get trim(): boolean {
        return true;
    }

    // 颜色属性（强制使用纯白，实际颜色通过fontColor控制）
    // @example 设置颜色应使用fontColor属性：this.fontColor = color(255,0,0)
    @property({ type: Color, visible() { return false; }, override: true })
    public get color(): Color {
        return color(255, 255, 255, 255); // 返回固定白色
    }
    public set color(v: Color) {
        // 颜色设置被锁定，保留空实现
    }

    /** 
     * 文本内容 
     * @example 
     * // 设置普通文本
     * label.string = "Hello World";
     * // 设置富文本
     * label.string = "<color=#ff0000>红</color>色文字";
     */
    @property({ type: CCString, multiline: true })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel(); // 触发标签更新
    }
    get string() {
        return this._string;
    }

    /** 
     * 文本颜色 
     * @example
     * // 通过颜色对象设置
     * this.fontColor = color(255,0,0,255); 
     * // 通过16进制设置
     * this.fontColor = color().fromHEX("#ff0000");
     */
    @property({ type: Color, override: true })
    public get fontColor(): Color {
        return this._fontColor;
    }
    public set fontColor(v: Color) {
        if (v.equals(this._fontColor)) return;
        this._fontColor = v;
        this.setLabel(); // 颜色变更时更新渲染
    }

    /** 
     * 渐变色配置组件
     * @类型 YJGradientColor
     * @特性说明：
     * - 用于创建文本渐变效果
     * - 支持线性/径向渐变配置
     * - 颜色变化会自动触发文本重绘
     * @示例 
     * // 在属性面板拖拽渐变配置组件
     * this.gradientColor = this.node.getComponent(YJGradientColor);
     * // 代码设置渐变色（需确保组件存在）
     * this.gradientColor.gradientColor = [color(255,0,0), color(0,0,255)];
     */
    @property({ serializable: true })
    _gradientColor: YJGradientColor = null;
    @property({ type: YJGradientColor })
    public get gradientColor(): YJGradientColor {
        return this._gradientColor;
    }
    public set gradientColor(v: YJGradientColor) {
        if (v == this._gradientColor) return;
        this._gradientColor = v;
        this.setLabel();
    }

    /** 
     * 字体尺寸（单位：像素）
     * @特性说明：
     * - 实际渲染尺寸会根据hdpScale自动缩放
     * - 修改尺寸会自动调整行高（当autoLineHeight启用时）
     * @示例 
     * this.fontSize = 24; // 设置24像素字号
     * console.log(this.fontSize); // 输出实际渲染尺寸
     */
    @property
    public get fontSize(): number {
        return this._fontSize * this.hdpScale;
    }

    public set fontSize(v: number) {
        if (v == this._fontSize) return;
        this._fontSize = v;
        if (this._autoLineHeight) {
            this.lineHeight = this._fontSize * 1.2;
        }
        this.setLabel();
    }

    /** 
     * 自定义字体配置
     * @特性说明：
     * - 优先级：自定义字体 > YJTTFLoader字体 > 系统字体
     * - 修改字体会自动更新字体家族名称
     * - 支持TTF字体资源
     * @示例
     * // 加载自定义字体资源
     * const fontRes = await no.loadRes<Font>('fonts/MyFont');
     * this.font = fontRes; // 应用自定义字体
     */
    @property({ type: Font, tooltip: '如果没有设置自定义字体，则优先使用YJTTFLoader中加载的字体，如果不存在则使用系统字体' })
    public get font(): Font {
        return this._font;
    }

    public set font(v: TTFFont) {
        if (v == this._font) return;
        this._font = v;
        this._fontUuid = v ? v._uuid : '';
        this.fontFamily = v ? v['_fontFamily'] : 'Arial';
        this.setLabel();
    }

    /** 
     * 强制使用系统字体开关
     * @特性说明：
     * - 设置为true时清空自定义字体配置
     * - 会自动重置为Arial字体家族
     * @示例
     * this.useSys = true; // 强制使用系统字体
     */
    @property
    public get useSys(): boolean {
        return false;
    }

    public set useSys(v: boolean) {
        this._font = null;
        this._fontUuid = '';
        this._foitnFamily = 'Arial';
    }

    /** 
     * 当前使用的字体家族名称（只读）
     * @特性说明：
     * - 反映实际使用的字体名称
     * - 通过font属性设置自动更新
     * @示例
     * console.log(this.fontFamily); // 输出"Arial"或自定义字体名称
     */
    @property({ readonly: true })
    public get fontFamily(): string {
        return this._font?._fontFamily || this._foitnFamily;
    }

    public set fontFamily(v: string) {
        if (v == this._foitnFamily) return;
        this._foitnFamily = v;
    }

    /** 
     * 自动行高开关
     * @特性说明：
     * - 启用时行高自动设为字体大小的1.2倍
     * - 禁用后可手动设置lineHeight
     * @示例
     * this.autoLineHeight = true; // 启用自动行高
     * this.autoLineHeight = false; // 关闭后设置自定义行高
     * this.lineHeight = 30; 
     */
    @property({ displayName: '自动行高' })
    public get autoLineHeight(): boolean {
        return this._autoLineHeight;
    }

    public set autoLineHeight(v: boolean) {
        if (v == this._autoLineHeight) return;
        this._autoLineHeight = v;
        if (v) {
            this.lineHeight = this._fontSize * 1.2;
        }
    }
    /** 
     * 行高（单位：像素）
     * @特性说明：
     * - 实际值会自动乘以hdpScale进行高清适配
     * - 当autoLineHeight启用时该属性不可见
     * - 修改后会触发标签重绘
     * @示例
     * // 设置固定行高为30像素（自动应用hdp缩放）
     * this.lineHeight = 30;
     * // 获取实际渲染行高
     * console.log(this.lineHeight); // 输出缩放后的值
     */
    @property({ visible() { return !this._autoLineHeight; } })
    public get lineHeight(): number {
        return this._lineHeight * this.hdpScale;
    }

    public set lineHeight(v: number) {
        if (v == this._lineHeight) return;
        this._lineHeight = v;
        this.setLabel();
    }

    /** 
     * 水平对齐方式
     * @特性说明：
     * - 使用HorizontalTextAlignment枚举值
     * - 支持左对齐（0）、居中（1）、右对齐（2）
     * - 修改后会立即更新标签布局
     * @示例
     * // 设置为居中对齐
     * this.horizontalAlign = HorizontalTextAlignment.CENTER;
     * // 获取当前对齐方式
     * console.log(this.horizontalAlign); // 输出1
     */
    @property({ type: Enum(HorizontalTextAlignment) })
    public get horizontalAlign(): number {
        return this._horizontalAlign;
    }

    public set horizontalAlign(v: number) {
        if (v == this._horizontalAlign) return;
        this._horizontalAlign = v;
        this.setLabel();
    }
    /** 垂直对齐方式 */
    // @property({ type: Enum(VerticalTextAlignment), visible() { return false; } })
    // public get verticalAlign(): number {
    //     return 1;
    // }

    // public set verticalAlign(v: number) {
    //     if (v == this._verticalAlign) return;
    //     this._verticalAlign = v;
    //     this.setLabel();
    // }
    /** 
     * 文字排版模式
     * NONE: 不限制大小
     * CLAMP: 超出部分裁剪
     * SHRINK: 自动缩小以适应宽度
     * RESIZE_HEIGHT: 固定宽度，自动调整高度
     */
    /** 
     * 文字溢出处理模式
     * @特性说明：
     * - 使用Label.Overflow枚举值控制文本溢出行为
     * - NONE(0): 不限制尺寸，文本完全显示
     * - CLAMP(1): 超出部分裁剪
     * - SHRINK(2): 自动缩小字体以适应容器宽度
     * - RESIZE_HEIGHT(3): 固定宽度，自动调整高度
     * @示例
     * // 设置为自动缩小模式
     * this.overflow = Label.Overflow.SHRINK;
     * // 获取当前溢出模式
     * console.log(this.overflow); // 输出2
     */
    @property({ type: Enum(Label.Overflow) })
    public get overflow(): number {
        return this._overflow;
    }

    public set overflow(v: number) {
        if (v == this._overflow) return;
        this._overflow = v;
        if (v == Label.Overflow.NONE) {
            this.sizeMode = Sprite.SizeMode.RAW;
        } else if (v == Label.Overflow.CLAMP || v == Label.Overflow.SHRINK || v == Label.Overflow.RESIZE_HEIGHT) {
            this.maxWidth = no.width(this.node);
            this.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        this.setLabel();
    }

    /** 
     * 最大显示宽度（像素单位）
     * @特性说明：
     * - 仅在overflow不为NONE时生效
     * - 实际值会根据hdpScale进行缩放计算
     * @示例
     * // 设置最大宽度为200像素
     * this.maxWidth = 200;
     */
    @property({ visible() { return this._overflow != Label.Overflow.NONE; } })
    public get maxWidth(): number {
        return this._maxWidth * this.hdpScale;
    }

    public set maxWidth(v: number) {
        if (v == this._maxWidth) return;
        this._maxWidth = v;
        this.setLabel();
    }

    /** 
     * 是否固定容器宽度
     * @特性说明：
     * - 仅在overflow不为NONE时有效
     * - 设为true时容器宽度保持不变
     * @示例
     * // 启用固定宽度模式
     * this.fixWidth = true;
     */
    @property({ visible() { return this._overflow != Label.Overflow.NONE; } })
    public get fixWidth(): boolean {
        if (this._overflow == Label.Overflow.NONE) return false;
        return this._fixWidth;
    }

    public set fixWidth(v: boolean) {
        if (v == this._fixWidth) return;
        this._fixWidth = v;
        this.setLabel();
    }

    /** 
     * 是否启用斜体样式
     * @示例
     * // 启用斜体
     * this.italic = true;
     */
    @property
    public get italic(): boolean {
        return this._italic;
    }

    public set italic(v: boolean) {
        if (v == this._italic) return;
        this._italic = v;
        this.setLabel();
    }

    /** 
     * 是否启用粗体样式
     * @示例
     * // 启用粗体
     * this.bold = true;
     */
    @property
    public get bold(): boolean {
        return this._bold;
    }

    public set bold(v: boolean) {
        if (v == this._bold) return;
        this._bold = v;
        this.setLabel();
    }

    /** 
     * 是否显示下划线
     * @示例
     * // 显示下划线
     * this.underline = true;
     */
    @property
    public get underline(): boolean {
        return this._underline;
    }

    public set underline(v: boolean) {
        if (v == this._underline) return;
        this._underline = v;
        this.setLabel();
    }
    /** 
     * 下划线宽度（单位：逻辑像素）
     * @特性说明：
     * - 实际渲染宽度 = 设置值 * hdpScale（高分辨率缩放系数）
     * - 仅在启用下划线时显示该属性
     * @示例 
     * this.underlineWidth = 2; // 设置2像素宽下划线
     * this.underlineWidth = 0.5; // 设置0.5逻辑像素宽下划线
     */
    @property({ visible() { return this._underline; } })
    public get underlineWidth(): number {
        return this._underlineWidth * this.hdpScale;
    }

    public set underlineWidth(v: number) {
        if (v == this._underlineWidth) return;
        this._underlineWidth = v;
        this.setLabel(); // 下划线宽度变更需要重绘
    }

    /** 
     * 文字描边颜色
     * @特性说明：
     * - 使用Color类型或十六进制颜色值
     * - 颜色变更会自动触发重绘
     * @示例
     * this.outlineColor = color(255,0,0,255); // 红色描边
     * this.outlineColor = color().fromHEX("#00ff00"); // 绿色描边
     */
    @property
    public get outlineColor(): Color {
        return this._outlineColor;
    }

    public set outlineColor(v: Color) {
        if (v.equals(this._outlineColor)) return;
        this._outlineColor = v;
        this.setLabel(); // 描边颜色变化需要更新渲染
    }

    /** 
     * 文字描边宽度（单位：逻辑像素）
     * @特性说明：
     * - 实际渲染宽度 = 设置值 * hdpScale
     * - 建议值范围：1-5，过大的值可能影响性能
     * @示例
     * this.outlineWidth = 2; // 2像素描边
     * this.outlineWidth = 1.5; // 1.5逻辑像素描边
     */
    @property
    public get outlineWidth(): number {
        return this._outlineWidth * this.hdpScale;
    }

    public set outlineWidth(v: number) {
        if (v == this._outlineWidth) return;
        this._outlineWidth = v;
        this.setLabel(); // 描边宽度变化需要重新生成文字纹理
    }
    /** 
     * 阴影颜色
     * @特性说明：
     * - 使用Color类型或十六进制颜色值
     * - 颜色变更会自动触发阴影重绘
     * @示例
     * this.shadowColor = color(0,0,0,128); // 半透明黑色阴影
     * this.shadowColor = color().fromHEX("#FF000080"); // 带透明度的红色阴影
     */
    @property
    public get shadowColor(): Color {
        return this._shadowColor;
    }

    public set shadowColor(v: Color) {
        if (v.equals(this._shadowColor)) return;
        this._shadowColor = v;
        this.setLabel();
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
    @property
    public get shadowOffset(): Vec2 {
        const s = this._hdp ? this._hdpScale : 1;
        let offset = this._shadowOffset.clone();
        offset.x *= s;
        offset.y *= s;
        return offset;
    }

    public set shadowOffset(v: Vec2) {
        if (v.equals(this._shadowOffset)) return;
        this._shadowOffset = v;
        this.setLabel();
    }

    /** 
     * 阴影模糊宽度（单位：逻辑像素）
     * @特性说明：
     * - 实际模糊值 = 设置值 * hdpScale
     * - 建议范围：0-10，值越大模糊效果越明显
     * - 过大的值可能影响渲染性能
     * @示例
     * this.shadowBlur = 3; // 中等模糊效果
     * this.shadowBlur = 0; // 禁用模糊效果
     */
    @property
    public get shadowBlur(): number {
        return this._shadowBlur * this.hdpScale;
    }

    public set shadowBlur(v: number) {
        if (v == this._shadowBlur) return;
        this._shadowBlur = v;
        this.setLabel();
    }

    /** 
     * 空格断字功能
     * @特性说明：
     * - 启用时会在空格位置自动换行
     * - 禁用时空格会被视为普通字符
     * @示例
     * this.blankBreakWord = true; // 允许在空格处换行
     * this.blankBreakWord = false; // 禁止空格换行
     */
    @property
    public get blankBreakWord(): boolean {
        return this._blankBreakWord;
    }

    public set blankBreakWord(v: boolean) {
        if (v == this._blankBreakWord) return;
        this._blankBreakWord = v;
        this.setLabel();
    }

    /** 
     * 富文本支持
     * @特性说明：
     * - 启用后支持简单的HTML标签格式
     * - 支持标签：<color>, <size>, <b>, <i>
     * - 禁用时所有标签将作为普通文本显示
     * @示例
     * this.richText = true; // 启用富文本解析
     * this.richText = false; // 禁用富文本解析
     */
    @property
    public get richText(): boolean {
        return this._richText;
    }

    public set richText(v: boolean) {
        if (v == this._richText) return;
        this._richText = v;
        this.setLabel();
    }
    /** 
     * 高清显示模式开关
     * @特性说明：
     * - 启用后自动根据设备像素比调整渲染缩放
     * - 计算公式：hdpScale = max(1, 1 / view.getScaleX())
     * - 修改后会触发标签重绘
     * @示例
     * // 启用高清模式
     * this.HDP = true;
     * // 检查当前HDP状态
     * console.log(this.HDP ? "高清模式已启用" : "高清模式已禁用");
     */
    @property({ tooltip: '启用高清显示模式（根据设备像素比自动缩放）' })
    public get HDP(): boolean {
        return this._hdp;
    }

    public set HDP(v: boolean) {
        if (v == this._hdp) return;
        this._hdp = v;
        if (v) {
            // 计算高清缩放比例，保证最小为1
            this._hdpScale = Math.max(1, 1 / view.getScaleX());
        }
        this.setLabel(); // 需要更新标签渲染
    }

    /** 
     * 图集打包开关
     * @特性说明：
     * - 启用后会将文本渲染结果打包到动态图集
     * - 可提升渲染性能但会增加内存占用
     * - 建议静态文本启用，动态文本禁用
     * @示例
     * // 将常驻文本打包到图集
     * this.packToAtlas = true;
     * // 动态更新文本时禁用打包
     * this.packToAtlas = false;
     */
    @property({ tooltip: '将文本打包到动态图集提升性能' })
    public get packToAtlas(): boolean {
        return false;//this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
        // 注意：修改后需要手动调用setLabel()才会生效
    }


    /** 显示的文本内容 */
    @property({ serializable: true })
    protected _string: string = '';

    /** 字体颜色（默认白色） 
     * @example this.fontColor = Color.RED */
    @property({ serializable: true })
    protected _fontColor: Color = Color.WHITE.clone();

    /** 字体大小（单位：像素） 
     * @example this.fontSize = 32 */
    @property({ serializable: true })
    protected _fontSize: number = 22;

    /** 使用的TTF字体资源 */
    @property({ serializable: true })
    protected _font: TTFFont = null;

    /** 字体资源的UUID（编辑器使用） */
    @property({ serializable: true })
    protected _fontUuid: string = '';

    /** 备用字体名称（当TTF加载失败时使用） */
    @property({ serializable: true })
    protected _foitnFamily: string = 'Arial';

    /** 是否自动计算行高（默认true） 
     * @example this.autoLineHeight = false */
    @property({ serializable: true })
    protected _autoLineHeight: boolean = true;

    /** 手动设置的行高（当autoLineHeight=false时生效） */
    @property({ serializable: true })
    protected _lineHeight: number = 28;

    /** 水平对齐方式（0=左对齐 1=居中 2=右对齐） */
    @property({ serializable: true })
    protected _horizontalAlign: number = 0;

    /** 垂直对齐方式（0=顶部 1=居中 2=底部） */
    @property({ serializable: true })
    protected _verticalAlign: number = 2;

    /** 文本溢出处理方式（0=截断 1=自动换行） */
    @property({ serializable: true })
    protected _overflow: number = 0;

    /** 最大文本宽度（超出时根据overflow处理） */
    @property({ serializable: true })
    protected _maxWidth: number = 50;

    /** 是否固定宽度（默认自动适应内容） */
    @property({ serializable: true })
    protected _fixWidth: boolean = false;

    /** 斜体样式开关 */
    @property({ serializable: true })
    protected _italic: boolean = false;

    /** 粗体样式开关 
     * @example this.bold = true */
    @property({ serializable: true })
    protected _bold: boolean = false;

    /** 下划线开关 */
    @property({ serializable: true })
    protected _underline: boolean = false;

    /** 下划线宽度（当underline=true时生效） */
    @property({ serializable: true })
    protected _underlineWidth: number = 2;

    /** 文字描边宽度（0=无描边） */
    @property({ serializable: true })
    protected _outlineWidth: number = 0;

    /** 描边颜色（默认黑色） */
    @property({ serializable: true })
    protected _outlineColor: Color = Color.BLACK.clone();

    /** 阴影模糊程度（0=无阴影） */
    @property({ serializable: true })
    protected _shadowBlur: number = 0;

    /** 阴影偏移量（x,y方向偏移） */
    @property({ serializable: true })
    protected _shadowOffset: Vec2 = v2();

    /** 阴影颜色（默认黑色） */
    @property({ serializable: true })
    protected _shadowColor: Color = Color.BLACK.clone();

    /** 是否允许在空格处换行 */
    @property({ serializable: true })
    protected _blankBreakWord: boolean = false;

    /** 是否支持富文本格式 */
    @property({ serializable: true })
    protected _richText: boolean = false;

    /** 高清显示模式开关（见HDP属性） */
    @property({ serializable: true })
    protected _hdp: boolean = false;

    /** 动态图集打包开关（见packToAtlas属性） */
    @property({ serializable: true })
    protected _packToAtlas: boolean = true;

    /** 内部标记是否需要更新标签 */
    @property({ serializable: true })
    private _needSetLabel: boolean = false;

    /** 关联的面板名称（内部使用） */
    @property({ visible() { return false; } })
    panelName: string = '';

    /** 材质信息UUID（渲染系统使用） */
    @property({ visible() { return false; } })
    materialInfoUuid: string = '';

    /** 
     * 高清显示模式缩放系数 
     * @特性说明：
     * - 用于高分辨率屏幕适配（如Retina显示屏）
     * - 默认值为2，即1个逻辑像素对应2个物理像素
     * @示例
     * // 在1920x1080屏幕上实际渲染为3840x2160
     * this._hdpScale = 2;
     */
    private _hdpScale = 2;

    /** 
     * 标记是否需要更新文本渲染
     * @类型 boolean
     * @特性说明：
     * - 当组件属性变更时设置为true
     * - 在onEnable/onLoad生命周期中触发重绘
     * @示例
     * this._needSet = true; // 标记需要更新
     */
    private _needSet: boolean = true;

    /** 
     * 字体资源缓存映射表 
     * @静态
     * @结构 {[资源UUID: string]: TTFFont}
     * @特性说明：
     * - 键：字体资源UUID
     * - 值：已加载的TTF字体对象
     * @示例
     * YJCharLabel.fontMap['f32e5a8c-51d3-11ed...'] = myFont;
     */
    private static fontMap: { [uuid: string]: TTFFont } = {};

    /** 
     * 字体加载状态跟踪表 
     * @静态
     * @结构 {[资源UUID: string]: boolean}
     * @特性说明：
     * - 防止重复加载相同字体资源
     * - true表示加载中，false/null表示未加载
     * @示例
     * YJCharLabel.fontLoading['f32e5a8c-51d3-11ed...'] = true;
     */
    private static fontLoading: { [uuid: string]: boolean } = {};

    /** 
     * 组件实例唯一标识符
     * @特性说明：
     * - 用于字体资源关联和缓存查找
     * - 通过no._uuid()生成唯一值
     * @示例
     * this._uid = 'a1b2c3d4-e5f6-7890';
     */
    private _uid: string = '';

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
     * 组件加载时生命周期回调
     * @功能说明：
     * - 编辑器环境下自动加载默认字体
     * - 运行时初始化动态图集和材质
     * - 根据标记执行首次文本渲染
     * @示例
     * 在编辑器模式加载默认字体："msyh.ttf"
     * 运行时初始化动态图集："dynamic-atlas-001"
     */
    onLoad() {
        // super.onLoad();
        // 编辑器特殊处理逻辑
        if (EDITOR) {
            // 未指定字体时使用宏配置的默认字体
            if (!this._fontUuid) {
                const font = YJMacroConfig.TTF_FONT; // 默认字体配置
                if (font) {
                    // 异步加载TTF字体资源示例：no.EditorMode.getAssetByFileName("msyh.ttf")
                    no.EditorMode.getAssetByFileName<TTFFont>(font).then(ttf => {
                        this.font = ttf; // 设置字体实例
                    });
                }
            }
            return;
        }

        // 运行时材质和图集初始化
        if (this.packToAtlas || !this.customMaterial) {
            // 从材质管理器获取动态图集示例：materialInfoUuid="mat-info-001"
            this.dynamicAtlas = YJSample2DMaterialManager.ins.getMaterialInfo(this.materialInfoUuid)?.dynamicAtlas;
            this.customMaterial = this.dynamicAtlas?.customMaterial; // 关联自定义材质
        }

        // 初始需要更新时执行文本渲染
        if (this._needSet)
            this.setLabel(); // 触发文本绘制流程
    }

    /**
     * 组件销毁时生命周期回调
     * @功能说明：
     * - 释放非动态图集纹理资源
     * - 清理所有定时器和事件监听
     * - 销毁画布资源
     * @示例
     * 销毁Texture2D实例：texture.destroy()
     * 清理节点事件：node.targetOff(this)
     */
    onDestroy() {
        // 仅销毁非动态图集纹理
        if (!(this.spriteFrame?.texture instanceof DynamicAtlasTexture)) {
            this.spriteFrame?.texture?.destroy(); // 示例：销毁Texture2D资源
        }
        super.onDestroy();
        this.unscheduleAllCallbacks(); // 清除所有定时任务
        this.node.targetOff(this); // 移除节点事件监听
        this.clearCanvas(); // 释放画布内存
    }

    /**
     * 组件启用时生命周期回调
     * @功能说明：
     * - 当组件从禁用状态恢复时，自动更新文本内容
     * @示例
     * 重新激活组件时自动刷新显示文本
     */
    onEnable() {
        super.onEnable();
        // 需要更新时重新渲染
        if (this._needSet)
            this.setLabel(); // 执行文本更新
    }

    /**
     * 更新文本渲染
     * 处理文本的样式设置和渲染逻辑
     * @执行流程：
     * 1. 编辑器环境下且不需要更新标签时直接返回
     * 2. 检查节点有效性，无效时标记需要后续更新
     * 3. 重置更新标记并清理旧画布
     * 4. 空文本时执行清空操作，非空则生成唯一ID并尝试打包纹理
     * 5. 最终执行字体加载和绘制流程
     * @示例
     * 当文本内容从"Hello"变为"World"时：
     * - 生成新的UUID
     * - 加载字体文件
     * - 在画布上绘制新文本
     */
    private async setLabel() {
        // 编辑器环境下且不需要强制更新时跳过
        if (EDITOR && !this._needSetLabel) return;

        // 检查节点是否在场景树中且有效
        if (!isValid(this.node)) {
            this._needSet = true; // 标记需要延迟更新
            return;
        }

        this._needSet = false; // 重置更新标记
        this.clearCanvas(); // 清理旧画布资源

        if (this._string === '') {
            this.clearString(); // 示例：清空文本显示
            return;
        } else {
            this.updateUuid(); // 生成样式唯一标识
            // 尝试使用打包图集纹理，成功则直接返回
            if (this.packToAtlas && this.setPackedTexture()) return;

            // 异步加载字体后执行绘制
            this.loadFont().then(() => {
                this.toDraw(); // 启动绘制流程
            });
        }
    }

    /**
     * 执行实际绘制操作
     * @流程说明：
     * - 根据富文本标记选择绘制模式
     * - 完成绘制后更新纹理
     * @示例
     * 当richText=true时：
     * 绘制带样式的<b>粗体</b>文本
     * 否则绘制普通文本
     */
    private async toDraw() {
        // 选择绘制模式
        if (this.richText) {
            this.drawRichString(this._string); // 示例：绘制带HTML标签的文本
        } else {
            this.drawString(this._string); // 示例：绘制普通文本
        }
        this.updateTexture(); // 将画布内容更新到纹理
    }

    /**
     * 获取高DPI缩放比例
     * @returns {number} 当前设备的HDP缩放值
     * @示例
     * 当_hdp=true且_hdpScale=2时，返回2
     */
    private get hdpScale(): number {
        return this._hdp ? this._hdpScale : 1;
    }

    /**
     * 生成样式唯一标识
     * @实现方式：
     * 组合所有样式参数进行哈希计算
     * @参数说明：
     * 包含字体大小、颜色、字重、斜体等13个样式参数
     * @示例
     * 输入："Text" + red + 16px + Arial...
     * 输出：hash("Text_#ff0000_16_Arial_...")
     */
    private updateUuid() {
        // 拼接所有样式特征参数
        const styleSignature = this.string + "_" + this._fontColor + "_" +
            this.fontSize + "_" + this.fontFamily + "_" + this.outlineColor + '_' +
            this.outlineWidth + '_' + (this.bold ? '1' : '0') + '_' +
            (this.italic ? '1' : '0');

        // 生成哈希标识
        this._uid = no.Hash(styleSignature).toString();
    }

    /** @type {{canvas: HTMLCanvasElement, context: CanvasRenderingContext2D}} 共享画布实例 */
    private _canvas: { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D };

    /**
     * 获取共享画布实例
     * @实现方式：
     * - 从对象池获取可复用画布
     * - 避免频繁创建/销毁带来的性能开销
     * @示例
     * 首次调用时从池中获取新画布
     * 后续调用返回已缓存的画布
     */
    private shareCanvas() {
        if (!this._canvas) {
            this._canvas = no.canvasPool.get(); // 从对象池获取
        }
        return this._canvas;
    }

    /**
     * 清理画布资源
     * @实现方式：
     * - 将画布归还对象池
     * - 重置本地引用
     * @示例
     * 当画布尺寸为1024x768时：
     * - 归还后可供其他组件复用
     * - 避免内存泄漏
     */
    private clearCanvas() {
        if (this._canvas) {
            no.canvasPool.put(this._canvas); // 归还对象池
            this._canvas = null; // 清除引用
        }
    }

    /**
     * 设置画布字体样式
     * @param ctx 画布上下文
     * @param color 文字颜色（可选，默认使用组件字体颜色）
     * @param fontSize 字体大小（可选，默认使用组件字体大小）
     * @param bold 粗体（可选，默认使用组件粗体设置）
     * @param italic 斜体（可选，默认使用组件斜体设置）
     * @示例 
     * // 设置红色、24px、粗斜体样式
     * this.setFontStyle(ctx, '#ff0000', 24, true, true);
     * // 使用默认样式
     * this.setFontStyle(ctx);
     */
    private setFontStyle(ctx: CanvasRenderingContext2D, color?: string, fontSize?: number, bold?: boolean, italic?: boolean) {
        // 处理默认值并应用HDP缩放
        if (color == null) color = '#' + this._fontColor.toHEX('#rrggbb');
        if (fontSize == null) fontSize = this.fontSize;
        else fontSize *= this._hdp ? this._hdpScale : 1;
        if (bold == null) bold = this.bold;
        if (italic == null) italic = this.italic;

        // 配置基础文本属性
        ctx.textBaseline = 'top';  // 文本基线对齐方式
        ctx.textAlign = 'left';    // 文本水平对齐方式
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.imageSmoothingQuality = 'high'; // 高精度抗锯齿

        // 构建字体字符串（例："italic bold 24px Arial"）
        ctx.font = `${italic ? 'italic' : 'normal'} ${bold ? 'bold' : ''} ${fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = color; // 设置填充颜色
        // console.log('setFontStyle', ctx.font);
    }

    /**
     * 设置描边样式
     * @param ctx 画布上下文
     * @param color 描边颜色（可选，默认使用组件描边颜色）
     * @param lineWidth 描边宽度（可选，默认使用组件描边宽度*2）
     * @示例
     * // 设置5px红色描边
     * this.setStrokeStyle(ctx, '#ff0000', 5);
     */
    private setStrokeStyle(ctx: CanvasRenderingContext2D, color?: string, lineWidth?: number) {
        if (color == null) color = '#' + this.outlineColor.toHEX('#rrggbb');
        if (lineWidth == null) lineWidth = this.outlineWidth * 2; // 默认双倍宽度保证描边效果
        else lineWidth *= this.hdpScale * 2; // 应用HDP缩放

        ctx.lineWidth = lineWidth;     // 设置描边宽度
        ctx.strokeStyle = color;       // 设置描边颜色
    }

    /**
     * 设置阴影样式
     * @param ctx 画布上下文
     * @param color 阴影颜色（可选，默认使用组件阴影颜色）
     * @param blur 模糊半径（可选，默认使用组件阴影模糊值）
     * @param offset 阴影偏移量（可选，默认使用组件阴影偏移量）
     * @示例
     * // 设置向右下偏移5px、模糊10px的黑色阴影
     * this.setShadowStyle(ctx, '#000000', 10, new Vec2(5,5));
     */
    private setShadowStyle(ctx: CanvasRenderingContext2D, color?: string, blur?: number, offset?: Vec2) {
        if (color == null) color = '#' + this.shadowColor.toHEX('#rrggbb');
        const scale = this._hdp ? this._hdpScale : 1; // HDP缩放系数

        if (blur == null) blur = this.shadowBlur;
        else blur *= scale; // 应用HDP缩放

        if (offset == null) offset = this.shadowOffset;
        else {
            offset.x *= scale; // X轴偏移量缩放
            offset.y *= scale; // Y轴偏移量缩放
        }

        // 设置阴影三要素
        ctx.shadowBlur = blur;         // 模糊程度
        ctx.shadowColor = color;       // 阴影颜色
        ctx.shadowOffsetX = offset.x;  // X轴偏移
        ctx.shadowOffsetY = offset.y;  // Y轴偏移
    }

    /**
     * 清空当前文本内容
     * @实现说明：
     * - 重置画布尺寸为0宽度
     * - 保持行高不变以便后续布局
     * - 清空精灵帧引用
     * @示例
     * this.clearString(); // 清空当前显示的文本
     */
    private clearString() {
        const canvas = this.shareCanvas();
        canvas.canvas.width = 0; // 重置画布宽度
        canvas.canvas.height = this._lineHeight; // 保持行高
        no.size(this.node, math.size(0, this._lineHeight)); // 更新节点尺寸
        this.spriteFrame = null; // 清除纹理引用
    }

    /**
     * 判断字符是否为ASCII字符
     * @param c 待检测字符
     * @returns 是否ASCII字符（编码小于128）
     * @示例
     * this.isASCII('A'); // 返回true
     * this.isASCII('中'); // 返回false
     */
    private isASCII(c: string) {
        return c.charCodeAt(0) < 128;
    }

    /**
     * 获取字符渲染宽度（带缓存优化）
     * @param c 目标字符
     * @param fontSize 当前字体大小
     * @returns 字符宽度（像素）
     * @实现说明：
     * - ASCII字符使用精确测量并缓存结果
     * - 非ASCII字符使用字体大小近似估算
     * @示例
     * this.getCharWidth('A', 24); // 返回精确测量值
     * this.getCharWidth('汉', 24); // 返回24
     */
    private getCharWidth(c: string, fontSize: number): number {
        const a = this.isASCII(c);
        if (a) {
            const k = c + '::' + fontSize; // 构建缓存键
            if (!_measuredWidth.has(k)) {  // 未缓存时进行测量
                const ctx = this.shareCanvas().context;
                const mt = ctx.measureText(c); // 精确测量文本
                _measuredWidth.set(k, mt.width); // 缓存结果
            }
            return _measuredWidth.get(k); // 返回缓存值
        } else {
            return fontSize; // 非ASCII字符使用字体大小估算
        }
    }

    /**
     * 测量文本总宽度
     * @param ctx 画布上下文
     * @param str 要测量的文本内容
     * @param fontSize 可选参数，指定测量使用的字体大小（不传则使用组件当前字体大小）
     * @returns 文本总宽度（像素）
     * @实现说明：
     * - 自动应用HDP高清缩放
     * - 遍历每个字符累加宽度
     * @示例
     * const width = this.measureWidth(ctx, "Hello", 24); // 测量"Hello"在24号字体的宽度
     * const chWidth = this.measureWidth(ctx, "你好"); // 测量当前字体设置下中文宽度
     */
    private measureWidth(ctx: CanvasRenderingContext2D, str: any, fontSize?: number): number {
        // 处理字体大小参数，应用HDP缩放
        if (fontSize == null) fontSize = this.fontSize;
        else fontSize *= this._hdp ? this._hdpScale : 1;

        let w = 0;
        // 使用标准for循环遍历每个字符
        for (let i = 0, n = str.length; i < n; i++) {
            w += this.getCharWidth(str[i], fontSize);
        }
        return w;
    }

    /**
     * 绘制普通文本（支持多种溢出模式）
     * @param v 要绘制的文本内容
     * @实现说明：
     * - 处理换行符和不同溢出模式
     * - 自动调整行高和宽度
     * - 支持RESIZE_HEIGHT模式下的智能分词换行
     * @示例
     * this.drawString("Hello\nWorld"); // 绘制两行文本
     * this.drawString("非常长的需要自动换行的文本内容"); // 在RESIZE_HEIGHT模式下自动换行
     */
    private drawString(v: string) {
        const ctx = this.shareCanvas().context;
        this.setFontStyle(ctx); // 设置基础字体样式

        // 应用阴影效果（如果启用）
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);

        // 处理高度自适应模式
        if (this._overflow == Label.Overflow.RESIZE_HEIGHT) {
            let maxWidth = this.maxWidth;
            const extWidth = this.extWidth(); // 获取额外宽度（如轮廓、阴影等）
            // 处理换行符分割
            const lines = v.split('\n');
            let resultLines: string[] = [];
            const halfWidth = this.fontSize / 2; // 允许的宽度容差

            // 遍历每个原始行
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];

                // 处理空行情况
                if (line.length === 0) {
                    resultLines[resultLines.length] = '';
                    continue;
                }

                // 分词处理（根据空格/标点分词）
                const words = this.splitIntoWords(line);
                let currentLine = '';
                let currentWidth = extWidth; // 当前行累计宽度

                // 遍历每个词语
                for (let j = 0; j < words.length; j++) {
                    const word = words[j];
                    const wordWidth = this.measureWidth(ctx, word);

                    // 检查是否需要换行（考虑容差）
                    if (currentWidth + wordWidth <= this.maxWidth + halfWidth) {
                        currentLine += word;
                        currentWidth += wordWidth;
                    } else {
                        // 保存当前行并重置
                        if (currentLine) {
                            resultLines[resultLines.length] = currentLine;
                            currentLine = '';
                            maxWidth = Math.max(maxWidth, currentWidth);
                            currentWidth = extWidth;
                        }

                        // 处理超长单词（逐字符换行）
                        if (wordWidth > this.maxWidth + halfWidth) {
                            let tempLine = '';
                            let tempWidth = extWidth;

                            // 逐个字符处理
                            for (let k = 0; k < word.length; k++) {
                                const char = word[k];
                                const charWidth = this.measureWidth(ctx, char);

                                if (tempWidth + charWidth <= this.maxWidth + halfWidth) {
                                    tempLine += char;
                                    tempWidth += charWidth;
                                } else {
                                    if (tempLine) {
                                        resultLines[resultLines.length] = tempLine;
                                        maxWidth = Math.max(maxWidth, tempWidth);
                                    }
                                    tempLine = char;
                                    tempWidth = extWidth + charWidth;
                                }
                            }

                            if (tempLine) {
                                currentLine = tempLine;
                                currentWidth = tempWidth;
                            }
                        } else {
                            currentLine = word;
                            currentWidth = extWidth + wordWidth;
                        }
                    }
                }

                // 添加最后未处理的字符
                if (currentLine) {
                    resultLines[resultLines.length] = currentLine;
                }
            }

            // 绘制最终结果行
            this.drawLines(
                resultLines,
                this.fixWidth ? this.maxWidth : maxWidth,
                this.lineHeight
            );
        } else {
            // 处理其他溢出模式（CLAMP/SHRINK/NONE）
            const lines = v.split('\n');
            let resultLines: string[] = [];
            let maxWidth = 0;

            // 计算每行实际宽度
            for (let i = 0; i < lines.length; i++) {
                const currentLine = lines[i];
                let w = this.measureWidth(ctx, currentLine);
                let ww: number = 0;

                // 根据溢出模式调整宽度
                if (this._overflow == Label.Overflow.SHRINK) {
                    ww = w;
                } else if (this._overflow == Label.Overflow.CLAMP) {
                    ww = Math.min(w, this.maxWidth);
                } else {
                    ww = w;
                }

                maxWidth = Math.max(maxWidth, ww);
                resultLines[resultLines.length] = currentLine;
            }

            // 确定最终绘制宽度
            const width = this._overflow != Label.Overflow.NONE && this.fixWidth
                ? this.maxWidth
                : maxWidth;

            // 根据行数选择绘制方式
            if (resultLines.length > 1) {
                this.drawLines(
                    resultLines,
                    width + this.extWidth(),
                    this.lineHeight
                );
            } else {
                this.drawLine(
                    resultLines[0],
                    width,
                    this.lineHeight
                );
            }
        }
        return false;
    }

    /**
     * 绘制单行文本
     * @param v 要绘制的文本内容
     * @param width 文本逻辑宽度（不包含扩展区域）
     * @param height 文本逻辑高度（不包含扩展区域）
     * @实现步骤：
     * 1. 准备画布：调整画布尺寸，包含描边/阴影等扩展区域
     * 2. 计算起始坐标：根据描边/阴影参数调整绘制起点
     * 3. 设置绘制样式：字体/渐变/阴影/描边
     * 4. 逐字符绘制：先描边后填充保证视觉效果
     * 5. 绘制下划线：根据文本宽度添加下划线
     * 6. 处理缩放：根据溢出模式进行必要缩放
     * 7. HDP适配：处理高分辨率屏幕显示
     * @示例
     * // 绘制"Hello"文本，基础宽度100，高度30
     * this.drawLine("Hello", 100, 30);
     * // 带2px描边和阴影的文本绘制
     * this.outlineWidth = 2;
     * this.shadowBlur = 3;
     * this.drawLine("World", 120, 35);
     */
    private drawLine(v: string, width: number, height: number) {
        // 获取共享画布实例
        const canvas = this.shareCanvas();
        // 调整画布尺寸（增加描边/阴影需要的扩展空间）
        width += this.extWidth() + 2;  // +2像素安全边距
        height += this.extHeight();    // 增加垂直扩展区域
        canvas.canvas.width = width;
        canvas.canvas.height = height;

        // 初始化绘制起点坐标
        let x = 2, // 基础水平偏移
            y = 4; // 垂直起始位置

        // 垂直位置调整（应对描边和阴影偏移）
        if (this.outlineWidth > 0) y += this.outlineWidth / 2; // 描边居中补偿
        if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
            y -= this.shadowOffset.y; // 补偿负向阴影偏移
        }

        // 水平位置调整（描边和阴影扩展空间）
        if (this.outlineWidth > 0) {
            x += this.outlineWidth + 2; // 描边宽度+安全边距
        }
        if (this.shadowBlur > 0) {
            // 阴影模糊半径 + 水平偏移补偿
            x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
        }

        const ctx = canvas.context;
        this.setFontStyle(ctx); // 设置基础字体样式

        // 处理渐变填充
        if (this.gradientColor) {
            // 示例：创建从左到右的渐变
            ctx.fillStyle = this.gradientColor.createGradient(ctx, {
                x: 0,
                y,
                width,
                height
            });
        }

        // 设置阴影效果（示例：模糊5px，偏移(2,2)）
        if (this.shadowBlur > 0) this.setShadowStyle(ctx);

        // 设置描边样式（示例：红色2px描边）
        if (this.outlineWidth > 0) {
            this.setStrokeStyle(ctx);
        }

        const fontSize = this.fontSize;
        let x1 = x; // 当前字符绘制位置

        // 逐字符绘制（支持等宽/变宽字体）
        for (let i = 0, n = v.length; i < n; i++) {
            const c = v[i]; // 当前字符

            // 先绘制描边（如果有）
            if (this.outlineWidth > 0) {
                ctx.strokeText(c, x1, y);
            }

            // 绘制填充文字
            ctx.fillText(c, x1, y);

            const w = this.getCharWidth(c, fontSize); // 获取字符宽度
            x1 += w; // 移动到下一个字符位置
        }

        // 绘制下划线（示例：2px宽度下划线）
        this.drawUnderline(ctx, width, x, height);

        // 处理文本缩放（SHRINK溢出模式）
        let scale = 1;
        if (this._overflow == Label.Overflow.SHRINK) {
            const maxWidth = this.maxWidth;
            if (width > maxWidth) {
                scale = maxWidth / width; // 计算缩放比例
                width = maxWidth;         // 应用新宽度
                height *= scale;          // 按比例调整高度
                ctx.scale(scale, scale);  // 应用画布缩放
            }
        }

        // 应用高分辨率适配处理
        this.fixHDP(ctx, width, height);
    }

    /**
     * 绘制多行文本内容
     * @param lines 要绘制的文本行数组
     * @param width 单行基础宽度（不包含扩展宽度）
     * @param height 单行基础高度（不包含扩展高度）
     * @实现说明：
     * 1. 计算总画布尺寸（包含所有行的扩展高度）
     * 2. 逐行处理：
     *    - 设置字体/描边/阴影样式
     *    - 计算垂直位置偏移（考虑描边和阴影）
     *    - 根据对齐方式计算水平起始位置
     *    - 应用渐变颜色（如果设置）
     *    - 逐字符绘制文本（支持等宽/变宽字体）
     *    - 绘制下划线
     * 3. 最终应用高分辨率适配处理
     * @示例
     * this.drawLines(["Hello","World"], 100, 20);
     * 将创建200px宽（100+扩展宽度）x (20+扩展高度)*2高的画布
     */
    private drawLines(lines: string[], width: number, height: number) {
        // 获取共享画布并计算扩展尺寸
        const canvas = this.shareCanvas();
        // 单行总高度 = 基础高度 + 扩展高度（描边/阴影/下划线等）
        const hh = height + this.extHeight();
        // 总宽度 = 基础宽度 + 扩展宽度 + 2px边距
        width += this.extWidth() + 2;

        // 设置画布尺寸（宽度 x 总行高）
        canvas.canvas.width = width;
        canvas.canvas.height = hh * lines.length;
        const ctx = canvas.context;

        // 逐行绘制（使用标准for循环）
        for (let i = 0; i < lines.length; i++) {
            const v = lines[i];
            // 设置基础字体样式（示例：16px Arial）
            this.setFontStyle(ctx);
            // 设置描边样式（示例：2px红色描边）
            if (this.outlineWidth > 0) this.setStrokeStyle(ctx);
            // 设置阴影样式（示例：5px模糊黑色阴影）
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            // 计算垂直起始位置
            let y = hh * i + 4; // 基础行位置
            if (this.outlineWidth > 0) y += this.outlineWidth / 2; // 描边垂直偏移
            if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
                y -= this.shadowOffset.y; // 阴影垂直偏移补偿
            }

            // 测量文本实际宽度（考虑HDP缩放）
            const w = this.measureWidth(ctx, v);

            // 计算水平起始位置
            let x = 2; // 基础边距
            if (this.horizontalAlign == HorizontalTextAlignment.LEFT) {
                // 左对齐处理扩展边距
                if (this.outlineWidth > 0) x += this.outlineWidth + 2; // 描边边距
                if (this.shadowBlur > 0) {
                    x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0); // 阴影边距
                }
            } else {
                // 居中/右对齐计算
                if (this.horizontalAlign == HorizontalTextAlignment.CENTER) {
                    x = (width - w) / 2; // 水平居中位置
                } else {
                    x = width - w; // 右对齐位置
                }
            }

            // 应用渐变颜色（示例：从左到右的彩虹渐变）
            if (this.gradientColor) {
                ctx.fillStyle = this.gradientColor.createGradient(
                    ctx,
                    { x: 0, y, width: canvas.canvas.width, height: 0 }
                );
            }

            // 逐字符绘制（支持变宽字体）
            const fontSize = this.fontSize;
            let x1 = x; // 当前字符水平位置
            for (let j = 0; j < v.length; j++) {
                const c = v[j];
                const charWidth = this.getCharWidth(c, fontSize);
                // 先绘制描边（如果有）
                if (this.outlineWidth > 0) ctx.strokeText(c, x1, y);
                // 绘制填充文字
                ctx.fillText(c, x1, y);
                x1 += charWidth; // 移动到下一个字符位置
            }

            // 绘制下划线（示例：1px宽度下划线）
            this.drawUnderline(ctx, w, x, hh * (i + 1));
        }

        // 应用高分辨率适配（示例：Retina屏幕2倍缩放）
        this.fixHDP(ctx, width, canvas.canvas.height);
    }

    /**
     * 计算水平方向扩展区域
     * @实现说明：
     * - 基础边距2像素
     * - 描边需要两侧扩展（宽度*2 + 安全边距4）
     * - 阴影需要扩展模糊半径+水平偏移绝对值
     * @示例
     * 当outlineWidth=2，shadowBlur=5，shadowOffset.x=3时：
     * 2 + (2*2+4) + (5+3) = 2+8+8=18
     */
    private extWidth(): number {
        let a = 2;
        if (this.outlineWidth > 0) a += this.outlineWidth * 2 + 4;
        if (this.shadowBlur > 0) a += this.shadowBlur + Math.abs(this.shadowOffset.x);
        return a;
    }

    /**
     * 计算垂直方向扩展区域
     * @实现说明：
     * - 基础边距2像素
     * - 描边需要上下扩展（宽度*2）
     * - 阴影需要扩展模糊半径+垂直偏移绝对值
     * - 下划线需要扩展线宽*HDP缩放系数
     * @示例
     * 当outlineWidth=2，shadowBlur=5，shadowOffset.y=2，underlineWidth=1，hdpScale=2时：
     * 2 + (2*2) + (5+2) + (1*2) = 2+4+7+2=15
     */
    private extHeight(): number {
        let a = 2;
        if (this.outlineWidth > 0) a += this.outlineWidth * 2;
        if (this.shadowBlur > 0) a += this.shadowBlur + Math.abs(this.shadowOffset.y);
        if (this.underline) a += this.underlineWidth * this.hdpScale;
        return a;
    }

    /**
     * 高分辨率适配处理
     * @param ctx 画布上下文
     * @param width 原始逻辑宽度
     * @param height 原始逻辑高度
     * @实现说明：
     * - 应用反向缩放系数（如2x画布缩放为1x显示）
     * - 调整节点最终显示尺寸
     * @示例
     * 当hdpScale=2时：
     * 3840x2160画布 -> 缩放0.5 -> 最终显示1920x1080
     */
    private fixHDP(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (this._hdp) {
            let scale = 1 / this._hdpScale;
            width *= scale;
            height *= scale;
            ctx.scale(scale, scale);
        }
        no.size(this.node, math.size(width, height));
    }

    /**
     * 绘制文本下划线
     * @param ctx 画布上下文
     * @param width 文本宽度
     * @param x 起始X坐标
     * @param y 起始Y坐标（基线位置）
     * @实现说明：
     * - 根据下划线宽度和HDP缩放调整位置
     * - 处理阴影偏移对下划线位置的影响
     * - 绘制1px线段（实际显示根据HDP缩放）
     * @示例
     * 当hdpScale=2，underlineWidth=2时：
     * 实际绘制4物理像素宽的线，显示为2逻辑像素
     */
    private drawUnderline(ctx: CanvasRenderingContext2D, width: number, x: number, y: number) {
        if (!this.underline || width == 0) return;
        y -= this.underlineWidth * this.hdpScale + 2;
        if (this.shadowBlur > 0 && this.shadowOffset.y > 0) y -= this.shadowOffset.y;
        ctx.beginPath();
        ctx.strokeStyle = '#' + this._fontColor.toHEX('#rrggbb');
        ctx.lineWidth = this.underlineWidth;
        ctx.moveTo(x, y);
        ctx.lineTo(x + width - 4 * this.hdpScale, y);
        ctx.stroke();
    }

    /**
     * 设置动态图集打包的纹理
     * @returns 是否成功设置纹理
     * @实现说明：
     * 1. 从动态图集获取预制纹理
     * 2. 处理SHRINK溢出模式的缩放
     * 3. 应用HDP缩放系数
     * 4. 更新节点尺寸和精灵帧
     * @示例
     * 当纹理尺寸为200x100，maxWidth=150，hdpScale=2时：
     * SHRINK模式缩放系数=0.75 -> 最终尺寸150x75
     * HDP缩放后实际显示尺寸75x37.5
     */
    private setPackedTexture() {
        if (EDITOR) return false;
        const p = this.dynamicAtlas?.getSpriteFrameInstance(this._uid);
        if (p) {
            let width = p.rect.width,
                height = p.rect.height;
            if (this._overflow == Label.Overflow.SHRINK) {
                const maxWidth = this.maxWidth;
                if (width > maxWidth) {
                    let scale = maxWidth / width;
                    width = maxWidth;
                    height *= scale;
                }
            }
            if (this._hdp) {
                let scale = 1 / this._hdpScale;
                width *= scale;
                height *= scale;
            }
            no.size(this.node, math.size(width, height));
            this.spriteFrame = p;
            return true;
        }
        return false;
    }

    /**
     * 更新纹理数据
     * @实现步骤：
     * 1. 销毁旧纹理（非动态图集纹理）
     * 2. 创建ImageAsset和Texture2D
     * 3. 生成唯一UUID（格式：yjchar@[uid]）
     * 4. 创建新精灵帧并关联纹理
     * 5. 提交打包任务到作业管理器
     * @示例
     * 当_uid='123'时：
     * 生成texture._uuid='yjchar@123'
     * 精灵帧._uuid='123'
     */
    private updateTexture() {
        const canvas = this.shareCanvas();
        if (!canvas.canvas.width || !canvas.canvas.height) return;
        if (!(this.spriteFrame?.texture instanceof DynamicAtlasTexture)) {
            // this.spriteFrame?.texture?.destroy();
            this.spriteFrame?.destroy();
            this.spriteFrame = null;
        }
        // const image = new ImageAsset(canvas.canvas);
        // const texture = new Texture2D();
        // texture.image = image;
        // if (TextureInfoInGPU.isWork) {
        //     texture['_uuid'] = 'yjchar@' + this._uid;
        //     TextureInfoInGPU.addTextureUuidToPanel(texture['_uuid'], this.panelName);
        // }
        // let spriteFrame = new SpriteFrame();
        // spriteFrame['_uuid'] = this._uid;
        // spriteFrame.texture = texture;
        // this.spriteFrame = spriteFrame;
        this.spriteFrame = SpriteFrame.createWithImage(canvas.canvas);

        if (this.packToAtlas && this.dynamicAtlas) {
            YJJobManager.ins.addTask(this.packSpriteFrame.bind(this));
        }
        this.clearCanvas();
    }

    /**
     * 将精灵帧打包到动态图集
     * @returns 是否打包成功
     * @实现说明：
     * - 调用动态图集系统的pack接口
     * - 成功打包后销毁原始纹理
     * - 替换为图集内的共享精灵帧
     * @示例
     * 原始精灵帧尺寸200x200 -> 
     * 打包后使用图集中的区域(512,0,200,200)
     * 纹理引用改为图集纹理
     */
    private packSpriteFrame() {
        const s = this.dynamicAtlas.packSpriteFrame(this.spriteFrame, true);
        if (s) {
            this.spriteFrame.texture.destroy();
            this.spriteFrame.destroy();
            this.spriteFrame = s;
        }
        // no.size(this.node, size(this.spriteFrame.rect.width, this.spriteFrame.rect.height));
        return true;
    }

    /**
     * 绘制富文本内容
     * 支持基础HTML标签和样式解析
     * @param v 富文本字符串（可包含HTML标签）
     * @实现说明：
     * - 根据overflow模式选择不同的渲染方式
     * - RESIZE_HEIGHT模式允许自动调整高度
     * - 其他模式使用固定高度布局
     * @示例
     * this.drawRichString("<b>Hello</b><font color='#ff0000'>World</font>");
     * 将渲染加粗的"Hello"和红色的"World"
     */
    private drawRichString(v: string) {
        if (this._overflow != Label.Overflow.RESIZE_HEIGHT) this.drawRichStringNotResizeHeight(v);
        else this.drawRichStringWithResizeHeight(v);
        return false;
    }

    /**
     * 处理非自适应高度的富文本渲染
     * @param v 富文本内容
     * @实现流程：
     * 1. 解析HTML文本为结构化数据
     * 2. 初始化行数据容器
     * 3. 遍历解析结果：
     *    - 处理换行符
     *    - 应用样式设置（字体/描边/阴影）
     *    - 测量文本宽度
     *    - 收集文本片段
     * 4. 计算最终布局尺寸
     * 5. 根据行数选择单行/多行绘制方式
     * @参数说明：
     * extWidth - 基础扩展宽度（包含描边/阴影等附加宽度）
     * maxSize  - 当前行最大字号（用于垂直对齐）
     * ww       - 当前行累计宽度
     */
    private drawRichStringNotResizeHeight(v: string) {
        const ctx = this.shareCanvas().context;
        const extWidth = this.extWidth();
        // 解析HTML文本为结构化数组（示例：将"<b>text</b>"解析为{text:'text',style:{bold:true}}）
        const parsedElements = new HtmlTextParser().parse(v);
        // 行数据容器初始化
        const lines: any[] = [];
        let currentLine = { htmls: [], width: 0 }; // 当前行数据 {htmls:文本片段数组, width:行宽}
        let currentWidth = extWidth;    // 当前行宽度（初始为基础扩展宽度）
        let lineHeight = this.lineHeight; // 行高（取自组件属性）
        let currentLineWidth = 0;       // 当前行内容宽度（不含扩展宽度）
        let maxFontSize = this.fontSize; // 当前行最大字号
        let globalMaxWidth = 0;         // 全局最大行宽

        // 标准for循环遍历解析结果（避免使用for...of）
        for (let i = 0, elementCount = parsedElements.length; i < elementCount; i++) {
            const element = parsedElements[i];
            const style = element.style;  // 当前元素的样式对象
            const textContent = element.text; // 当前元素的文本内容

            // 处理显式换行标签（示例：<br/>）
            if (style?.isNewLine && textContent == '') {
                // 完成当前行并存入行数组
                currentLine.width = currentWidth;
                lines.push(no.clone(currentLine));
                currentLine.htmls = [];
                currentWidth = extWidth;
                // 更新全局最大行宽
                if (globalMaxWidth < currentLineWidth) globalMaxWidth = currentLineWidth;
                currentLineWidth = 0;
                continue;
            }

            // 应用字体样式（示例：设置红色24px粗体）
            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            // 设置描边样式（优先使用元素级样式）
            if (style?.outline || this.outlineWidth > 0) {
                this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            }
            // 设置阴影样式（使用组件级设置）
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            // 更新当前行最大字号（用于垂直对齐计算）
            maxFontSize = Math.max(maxFontSize, style?.size || 0);

            // 测量文本实际宽度（考虑HDP缩放）
            const textWidth = this.measureWidth(ctx, textContent, style?.size);
            currentLineWidth += textWidth;

            // 收集文本片段（示例：{text:'Hello',style:{color:'#ff0000'}}）
            currentLine.htmls.push({ style, text: textContent });
        }

        // 处理最后一行数据
        if (currentLine) {
            lines.push(currentLine);
        }
        if (globalMaxWidth < currentLineWidth) globalMaxWidth = currentLineWidth;

        // 根据溢出模式调整最终宽度
        let finalWidth = globalMaxWidth;
        if (this._overflow != Label.Overflow.NONE) {
            if (this.fixWidth) {
                // 固定宽度模式（示例：maxWidth=200时强制使用200px）
                finalWidth = this.maxWidth;
            } else if (this._overflow == Label.Overflow.CLAMP) {
                // 截断模式（示例：maxWidth=200时取min(实际宽度,200)）
                finalWidth = Math.min(globalMaxWidth, this.maxWidth);
            }
        }

        // 根据行数选择绘制方式
        if (lines.length > 1) {
            // 多行绘制（示例：带自动换行的段落文本）
            this.drawHtmlLines(lines, finalWidth + extWidth, lineHeight);
        } else {
            // 单行绘制（示例：标题文本）
            this.drawHtmlTexts(parsedElements, finalWidth, lineHeight, maxFontSize);
        }
    }

    /**
     * 处理自适应高度的富文本渲染
     * 根据容器宽度自动换行并调整高度
     * @param v 富文本内容（支持HTML样式标签，如<b><i><color>等）
     * 
     * 实现逻辑：
     * 1. 解析富文本为带样式的文本片段数组
     * 2. 根据容器宽度和文本测量结果进行自动换行
     * 3. 维护行数据（包含文本片段集合和行宽）
     * 4. 最终通过drawHtmlLines进行多行绘制
     * 
     * 示例：对于输入"<b>Hello</b> world"，会解析为两个文本片段：
     * [{text:'Hello',style:{bold:true}}, {text:' world'}]
     */
    private drawRichStringWithResizeHeight(v: string) {
        // 初始化最大宽度（考虑容器约束）
        let maxWidth = this.maxWidth;
        // 获取绘图上下文和扩展宽度（包含阴影/描边等额外空间）
        const ctx = this.shareCanvas().context;
        const extWidth = this.extWidth();
        // 半字号用于处理测量误差（防止因小数像素导致的布局问题）
        const halfWidth = this.fontSize / 2;

        // 空白处理配置（当启用blankBreakWord时使用空格作为分隔符）
        let blankWork = '', blankWidth = 0;
        if (this.blankBreakWord) {
            blankWork = ' '; // 使用空格作为分词分隔符
            blankWidth = this.measureWidth(ctx, blankWork); // 测量空格字符宽度
        }

        // 解析富文本为结构化数据
        // 示例：输入"<color=#ff0000>Red</color> text" 解析为：
        // [{text:'Red',style:{color:'#ff0000'}}, {text:' text'}]
        let parsedElements = new HtmlTextParser().parse(v);
        // 行数据存储（每行包含多个文本片段）
        let lines: any[] = [];
        // 当前行数据（htmls:文本片段集合，width:累计宽度）
        let currentLine: any = { htmls: [], width: 0 };
        // 当前行累计宽度（初始值包含扩展宽度）
        let currentLineWidth = extWidth;
        const lineHeight = this.lineHeight; // 行高配置

        // 遍历所有解析后的文本元素
        for (let elemIndex = 0, elemCount = parsedElements.length; elemIndex < elemCount; elemIndex++) {
            const elem = parsedElements[elemIndex];
            const style = elem.style;
            const text = elem.text;

            // 处理显式换行（如<br>标签）
            if (style?.isNewLine && text == '') {
                currentLine.width = currentLineWidth;
                lines.push(no.clone(currentLine));
                currentLine.htmls = [];
                currentLineWidth = extWidth;
                continue;
            }

            // 准备当前文本片段容器
            let textFragment: IHtmlTextParserResultObj = { style: style, text: '' };

            // 处理空白字符换行逻辑
            if (this.blankBreakWord && text == blankWork) {
                // 检查当前行剩余空间是否足够容纳空格
                if (currentLineWidth + blankWidth <= this.maxWidth + halfWidth) {
                    textFragment.text += blankWork;
                    currentLineWidth += blankWidth;
                    currentLine.htmls.push(textFragment);
                    currentLine.width = currentLineWidth;
                } else {
                    // 空间不足时换行
                    lines.push(no.clone(currentLine));
                    currentLine.htmls = [];
                    currentLineWidth = extWidth;
                }
                continue;
            }

            // 应用当前文本片段的样式设置
            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            if (style?.outline || this.outlineWidth > 0) {
                this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            }
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);

            // 分词处理（根据配置决定是否按空格分割）
            let words: string | string[];
            if (this.blankBreakWord) {
                words = text.split(blankWork); // 示例："hello world" -> ["hello", "world"]
            } else {
                words = text; // 不分割时按字符处理
            }

            // 处理每个单词/字符
            for (let wordIndex = 0, wordCount = words.length; wordIndex < wordCount; wordIndex++) {
                const word = words[wordIndex];
                // 测量当前单词宽度（考虑HDPI缩放）
                const wordWidth = this.measureWidth(ctx, word, style?.size);

                // 检查当前行剩余空间
                if (currentLineWidth + wordWidth <= this.maxWidth + halfWidth) {
                    // 追加到当前行：单词 + 空格（非最后一个单词）
                    textFragment.text += word + (wordIndex < wordCount - 1 ? blankWork : '');
                    currentLineWidth += wordWidth + (wordIndex < wordCount - 1 ? blankWidth : 0);
                    // 最后一个单词添加额外间距（防止截断）
                    if (wordIndex == wordCount - 1) currentLineWidth += 4 * this.hdpScale;
                } else {
                    // 换行处理
                    if (textFragment.text !== '') {
                        currentLine.htmls.push(textFragment);
                    }
                    // 记录当前行并创建新行
                    currentLine.width = currentLineWidth;
                    maxWidth = Math.max(maxWidth, currentLineWidth);
                    lines.push(no.clone(currentLine));
                    // 初始化新行数据
                    textFragment = { style: style, text: word + (wordIndex < wordCount - 1 ? blankWork : '') };
                    currentLineWidth = extWidth + wordWidth + (wordIndex < wordCount - 1 ? blankWidth : 0);
                    currentLine.htmls = [];
                }
            }

            // 收集剩余文本片段
            if (textFragment.text !== '') {
                currentLine.htmls.push(textFragment);
            }
        }

        // 处理最后未完成的行
        if (currentLine.htmls.length > 0) {
            currentLine.width = currentLineWidth;
            maxWidth = Math.max(maxWidth, currentLineWidth);
            lines.push(currentLine);
        }

        // 绘制所有行（固定宽度模式使用maxWidth，否则使用实际最大宽度）
        this.drawHtmlLines(lines, this.fixWidth ? this.maxWidth : maxWidth, lineHeight);
    }

    /**
     * 绘制HTML格式的文本内容（单行模式）
     * @param htmls HTML解析结果数组
     * @param width 容器逻辑宽度
     * @param height 容器逻辑高度
     * @param fontSize 当前行最大字号（用于垂直对齐）
     * @实现说明：
     * 1. 计算画布物理尺寸（包含扩展区域）
     * 2. 初始化绘制起点坐标（考虑描边/阴影偏移）
     * 3. 遍历HTML元素：
     *    - 设置字体/描边/阴影样式
     *    - 应用渐变效果（如果设置）
     *    - 逐字符绘制文本（支持变宽字体）
     * 4. 绘制下划线
     * 5. 处理SHRINK溢出模式的缩放
     * 6. 应用高分辨率适配
     * @示例
     * 当htmls=[{text:"Hello",style:{color:'#f00'}},{text:"World",style:{size:24}}]时：
     * - 绘制红色"Hello"和24px默认颜色"World"
     * - 总宽度=两个文本片段宽度之和+扩展宽度
     */
    private drawHtmlTexts(htmls: IHtmlTextParserResultObj[], width: number, height: number, fontSize: number) {
        // 获取共享画布并计算物理尺寸
        const canvas = this.shareCanvas();
        width += this.extWidth() + 2;  // 水平扩展区域 + 2px边距
        height += this.extHeight();    // 垂直扩展区域（描边/阴影/下划线）
        canvas.canvas.width = width;
        canvas.canvas.height = height;

        // 初始化绘制起点（示例：当outlineWidth=2时，x=2+2+2=6）
        let x = 2; // 基础边距
        let y = 4; // 垂直起始位置
        // 垂直偏移处理（描边和阴影可能影响垂直位置）
        if (this.outlineWidth > 0) y += this.outlineWidth / 2; // 描边垂直补偿（示例：2px描边下移1px）
        if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
            y -= this.shadowOffset.y; // 阴影垂直补偿（示例：阴影y偏移-3时上移3px）
        }

        // 水平偏移处理（描边和阴影扩展区域）
        if (this.outlineWidth > 0) {
            x += this.outlineWidth + 2; // 描边边距（示例：2px描边右侧+2px安全边距）
        }
        if (this.shadowBlur > 0) {
            // 阴影水平补偿（示例：5px模糊+左偏移-3时，x+=5+3=8）
            x += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
        }

        const ctx = canvas.context;
        let totalTextWidth = 0; // 文本内容总宽度
        let currentX = x;       // 当前绘制水平位置

        // 标准for循环遍历HTML元素
        for (let i = 0, elementCount = htmls.length; i < elementCount; i++) {
            const element = htmls[i];
            const style = element.style;  // 当前元素的样式配置
            const text = element.text;    // 当前元素的文本内容

            // 设置字体样式（示例：设置蓝色18px斜体）
            this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
            // 设置阴影效果（使用组件级设置）
            if (this.shadowBlur > 0) this.setShadowStyle(ctx);
            // 设置描边样式（优先使用元素级样式）
            if (style?.outline || this.outlineWidth > 0) {
                this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
            }
            // 应用渐变颜色（示例：从左到右的红蓝渐变）
            if (this.gradientColor) {
                ctx.fillStyle = this.gradientColor.createGradient(
                    ctx,
                    { x: 0, y, width: canvas.canvas.width, height: 0 }
                );
            }

            // 计算实际字号（考虑HDP缩放）
            const finalFontSize = style?.size * this.hdpScale || this.fontSize;
            let charX = currentX; // 字符绘制起始位置

            // 逐字符绘制（支持变宽字体）
            for (let charIndex = 0, charCount = text.length; charIndex < charCount; charIndex++) {
                const char = text[charIndex];
                const charWidth = this.getCharWidth(char, finalFontSize);

                // 先绘制描边再绘制填充（示例：黑色描边+白色填充）
                if (style?.outline || this.outlineWidth > 0) {
                    ctx.strokeText(char, charX, y);
                }
                ctx.fillText(char, charX, y);

                charX += charWidth; // 移动到下一个字符位置
            }

            totalTextWidth += charX - currentX; // 累计文本宽度
            currentX = charX; // 更新当前绘制位置
        }

        // 绘制下划线（示例：2px宽度下划线）
        this.drawUnderline(ctx, totalTextWidth, x, height);

        // 处理SHRINK溢出模式（示例：当width=300而maxWidth=200时，缩放比例0.66）
        let scale = 1;
        if (this._overflow == Label.Overflow.SHRINK) {
            const maxWidth = this.maxWidth;
            if (width > maxWidth) {
                scale = maxWidth / width;     // 计算缩放比例
                width = maxWidth;             // 应用新宽度
                height *= scale;              // 按比例调整高度
                ctx.scale(scale, scale);      // 应用画布缩放
            }
        }

        // 高分辨率适配处理（示例：Retina屏缩放系数2x）
        this.fixHDP(ctx, width, height);
    }

    /**
     * 绘制HTML文本行
     * @param lines HTML文本行数组
     * @param width 容器宽度
     * @param height 行高
     */
    /**
     * 绘制多行HTML格式文本
     * @param lines 行数据数组，每行包含htmls文本片段集合和width行宽
     * @param width 容器逻辑宽度（不包含扩展区域）
     * @param height 单行逻辑高度（不包含扩展区域）
     * @实现步骤：
     * 1. 计算画布尺寸：根据行数和扩展区域调整
     * 2. 逐行处理：
     *    - 计算垂直位置：补偿描边和阴影偏移
     *    - 计算水平起始位置：根据水平对齐方式
     *    - 遍历文本片段：应用样式并绘制字符
     * 3. 绘制下划线：每行底部添加装饰线
     * 4. HDP适配：处理高分辨率显示
     * @示例
     * // 绘制两行带样式的文本
     * this.drawHtmlLines([
     *   {htmls:[{text:'Hello',style:{color:'#f00'}}], width: 80},
     *   {htmls:[{text:'World',style:{size:24}}], width: 100}
     * ], 200, 30);
     */
    private drawHtmlLines(lines: any[], width: number, height: number) {
        // 获取共享画布并计算带扩展区域的行高
        const canvas = this.shareCanvas();
        const lineHeightWithExt = height + this.extHeight();

        // 调整画布尺寸（增加扩展区域和安全边距）
        width += this.extWidth() + 2; // +2像素防止边缘裁剪
        canvas.canvas.width = width;
        canvas.canvas.height = lineHeightWithExt * lines.length; // 总高度=行高*行数
        const ctx = canvas.context;

        // 逐行绘制（标准for循环避免使用for...of）
        for (let i = 0, lineCount = lines.length; i < lineCount; i++) {
            const line = lines[i];
            // 计算垂直起始位置（考虑多行叠加）
            let yPos = lineHeightWithExt * i + 4;

            // 垂直位置补偿（描边居中/阴影偏移）
            if (this.outlineWidth > 0) yPos += this.outlineWidth / 2; // 示例：2px描边下移1px
            if (this.shadowBlur > 0 && this.shadowOffset.y < 0) {
                yPos -= this.shadowOffset.y; // 补偿负向阴影偏移
            }

            // 计算水平起始位置（根据对齐方式）
            let xPos = 2; // 基础偏移
            if (this.horizontalAlign == HorizontalTextAlignment.LEFT) {
                // 左对齐处理扩展空间（示例：描边2px时xPos=2+2+2=6）
                if (this.outlineWidth > 0) xPos += this.outlineWidth + 2;
                if (this.shadowBlur > 0) {
                    xPos += this.shadowBlur + (this.shadowOffset.x < 0 ? -this.shadowOffset.x : 0);
                }
            } else {
                // 居中/右对齐计算（示例：容器宽200，行宽150，右对齐时xPos=200-150=50）
                const lineWidth = line.width;
                if (this.horizontalAlign == HorizontalTextAlignment.CENTER) {
                    xPos = (width - lineWidth) / 2; // 水平居中
                } else {
                    xPos = width - lineWidth; // 右对齐
                }
            }

            let totalSegmentWidth = 0; // 当前行累计宽度
            let currentX = xPos;       // 当前绘制水平位置
            const htmlSegments = line.htmls;

            // 遍历行内文本片段（标准for循环）
            for (let j = 0, segCount = htmlSegments.length; j < segCount; j++) {
                const segment = htmlSegments[j];
                const style = segment.style;
                const text = segment.text;

                // 应用字体样式（示例：设置红色24px粗体）
                this.setFontStyle(ctx, style?.color, style?.size, style?.bold, style?.italic);
                // 设置阴影效果（使用组件级参数）
                if (this.shadowBlur > 0) this.setShadowStyle(ctx);

                // 计算实际字号（考虑HDP缩放，示例：hdpScale=2时24px变为48px）
                const finalFontSize = style?.size * this.hdpScale || this.fontSize;
                let tempX = currentX; // 临时绘制位置

                // 绘制描边（优先使用片段级样式）
                if (style?.outline || this.outlineWidth > 0) {
                    this.setStrokeStyle(ctx, style?.outline?.color, style?.outline?.width);
                    // 逐字符绘制描边（示例："A"先绘制黑色描边）
                    for (let k = 0, charCount = text.length; k < charCount; k++) {
                        const char = text[k];
                        const charWidth = this.getCharWidth(char, finalFontSize);
                        ctx.strokeText(char, tempX, yPos);
                        tempX += charWidth;
                    }
                    tempX = currentX; // 重置位置准备填充绘制
                }

                // 设置渐变填充（示例：从左到右的红蓝渐变）
                if (this.gradientColor) {
                    ctx.fillStyle = this.gradientColor.createGradient(ctx, {
                        x: 0,
                        y: yPos,
                        width: canvas.canvas.width,
                        height: 0
                    });
                }

                // 逐字符绘制填充（示例："A"在描边上绘制白色填充）
                for (let k = 0, charCount = text.length; k < charCount; k++) {
                    const char = text[k];
                    const charWidth = this.getCharWidth(char, finalFontSize);
                    ctx.fillText(char, tempX, yPos);
                    tempX += charWidth;
                }

                // 更新行内位置和累计宽度
                totalSegmentWidth += tempX - currentX;
                currentX = tempX;
            }

            // 绘制下划线（示例：在行底绘制2px宽线）
            this.drawUnderline(ctx, totalSegmentWidth, xPos, lineHeightWithExt * (i + 1));
        }

        // 高分辨率适配处理（示例：Retina屏缩放系数2x）
        this.fixHDP(ctx, width, canvas.canvas.height);
    }

    /**
     * 移除文本标签及其关联资源
     * @实现说明：
     * 1. 清空精灵帧引用（释放纹理内存）
     * 2. 重置字体引用（解除资源依赖）
     * 3. 标记不需要更新标签状态
     * @示例
     * label.removeLabel(); // 清除当前显示的文本和字体
     */
    public removeLabel() {
        this.spriteFrame = null;  // 释放精灵帧资源
        // this._font = null;        // 清空字体引用
        this._needSetLabel = false; // 标记不需要更新标签
    }

    /**
     * 重置并重新加载文本标签
     * @实现流程：
     * 1. 标记需要更新标签状态
     * 2. 如果存在字体UUID：
     *    - 异步加载字体文件
     *    - 加载完成后更新字体并重绘
     * 3. 否则直接触发重绘
     * @示例
     * label.resetLabel(); // 重新加载当前字体并刷新显示
     * 当_fontUuid='f0a1b2'时，会从资源管理器加载对应字体
     */
    public resetLabel() {
        this._needSetLabel = true; // 设置标签需要更新标志
        if (this._fontUuid) {
            // 通过UUID异步加载字体文件
            no.assetBundleManager.loadAny<TTFFont>({ uuid: this._fontUuid, type: TTFFont }, font => {
                this._font = font;      // 更新组件字体引用
                this.setLabel();        // 触发标签重绘
            });
        } else
            this.setLabel(); // 无自定义字体时直接重绘
    }

    /**
     * 从字体缓存中获取字体资源
     * @param fontUuid 字体资源UUID 
     * @returns 缓存的TTF字体对象或undefined
     * @示例
     * getFontFromCache('f0a1b2') // 返回uuid为f0a1b2的缓存字体
     */
    private getFontFromCache(fontUuid: string): TTFFont | undefined {
        return YJCharLabel.fontMap[fontUuid]; // 从静态缓存字典查询
    }

    /**
     * 将字体存入缓存字典
     * @param fontUuid 字体资源UUID
     * @param bf 要缓存的TTF字体对象
     * @实现说明：
     * - 使用哈希表存储提高查询效率
     * - 避免重复缓存相同字体
     * @示例
     * setFontToCache('f0a1b2', fontObject) // 将字体存入fontMap.f0a1b2
     */
    private setFontToCache(fontUuid: string, bf: TTFFont): void {
        if (!this.getFontFromCache(fontUuid)) // 防止覆盖已有缓存
            YJCharLabel.fontMap[fontUuid] = bf; // 以UUID为键存储字体对象
    }


    /**
     * 加载自定义字体（支持缓存和异步加载）
     * @实现流程：
     * 1. 检查字体是否已加载
     * 2. 检查字体缓存：
     *    - 命中缓存：直接使用缓存字体
     *    - 未命中但正在加载：等待加载完成
     *    - 全新加载：发起异步请求并更新缓存
     * 3. 设置字体家族名称
     * @示例
     * await label.loadFont(); // 加载并应用uuid指定的字体
     * 当_fontUuid='f0a1b2'时，流程：
     * 1. 检查fontMap缓存 -> 未找到
     * 2. 发起加载请求 -> 加载完成后存入fontMap.f0a1b2
     */
    public async loadFont() {
        // 仅当需要加载且存在字体UUID时执行
        if (!this._font && this._fontUuid) {
            // 尝试从缓存获取字体
            const bf = this.getFontFromCache(this._fontUuid);
            if (bf) {
                this._font = bf; // 直接使用缓存字体
            }
            // 处理并发加载请求
            else if (YJCharLabel.fontLoading[this._fontUuid]) {
                await no.sleep(0);  // 让出事件循环
                await this.loadFont(); // 递归等待加载完成
            }
            // 发起新的字体加载请求
            else {
                YJCharLabel.fontLoading[this._fontUuid] = true; // 标记为加载中
                return new Promise<void>((resolve, reject) => {
                    // 通过资源管理器加载字体文件
                    no.assetBundleManager.loadByUuid<TTFFont>(this._fontUuid, file => {
                        try {
                            if (file) {
                                this._font = file; // 更新当前字体引用
                                this.setFontToCache(this._fontUuid, file); // 存入缓存
                                this.fontFamily = this._font._fontFamily; // 设置CSS字体家族名称
                            }
                            resolve();
                        } catch (e) { reject(e); }
                    });
                }).catch(e => {
                    console.error('字体加载失败:', e); // 输出错误日志但继续运行
                });
            }
        }
    }

    /**
     * 检查字符是否属于CJK统一字符集
     * @param char 单个字符
     * @returns 是否在CJK相关Unicode范围内
     * @示例
     * isCJK('汉') -> true   // 汉字
     * isCJK('あ') -> true   // 平假名
     * isCJK('ㄱ') -> true   // 韩文字母
     * isCJK('A')  -> false  // 拉丁字母
     */
    private isCJK(char: string): boolean {
        const code = char.charCodeAt(0);
        return (
            (code >= 0x4E00 && code <= 0x9FFF) ||   // 基本汉字（20992字）
            (code >= 0x3040 && code <= 0x309F) ||   // 日文平假名（96字）
            (code >= 0x30A0 && code <= 0x30FF) ||   // 日文片假名（96字）
            (code >= 0xAC00 && code <= 0xD7AF) ||   // 韩文谚文（11184字）
            (code >= 0x3100 && code <= 0x312F) ||   // 注音符号（48字）
            (code >= 0x31C0 && code <= 0x31EF) ||   // 汉字笔画（48字）
            (code >= 0xFF00 && code <= 0xFFEF)      // 全角字符（239字）
        );
    }

    /**
     * 多语言智能分词处理
     * @param text 原始文本
     * @returns 分词后的数组
     * @实现逻辑：
     * - 空格断词模式：保留空格作为独立元素
     * - 常规模式：
     *   1. CJK字符单独成词
     *   2. 连续非CJK字符组成英文单词
     *   3. 空格作为独立元素
     * @示例
     * splitIntoWords("Hello世界!") -> ["Hello", "世", "界", "!"]
     * splitIntoWords("New York City") -> ["New"," ","York"," ","City"]
     */
    private splitIntoWords(text: string): string[] {
        // 启用空格断词时使用正则分割
        if (this.blankBreakWord) {
            // 某些环境不支持零宽断言，改为兼容写法
            let arr: string[] = [];
            let temp = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === ' ') {
                    if (temp.length > 0) {
                        arr.push(temp);
                        temp = '';
                    }
                    arr.push(' ');
                } else {
                    temp += char;
                }
            }
            if (temp.length > 0) {
                arr.push(temp);
            }
            return arr;
        }

        let words = [];
        let currentWord = '';
        const textLength = text.length;

        // 标准for循环遍历每个字符
        for (let i = 0; i < textLength; i++) {
            const char = text[i];

            // 处理CJK字符
            if (this.isCJK(char)) {
                // 保存已累积的非CJK单词
                if (currentWord.length > 0) {
                    words.push(currentWord);
                    currentWord = '';
                }
                words.push(char); // CJK字符独立成词
            }
            // 处理空格字符
            else if (char === ' ') {
                if (currentWord.length > 0) {
                    words.push(currentWord);
                    currentWord = '';
                }
                words.push(char); // 空格作为独立元素
            }
            // 累积非CJK字符
            else {
                currentWord += char; // 构建英文单词
            }
        }

        // 处理末尾残留字符
        if (currentWord.length > 0) {
            words.push(currentWord);
        }

        return words;
    }
}

