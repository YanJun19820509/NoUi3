import { YJRenderBase } from '../../base/render/YJRenderBase';
import { no } from '../../no';
import { EDITOR, ccclass, isValid, math, property, size, JsonAsset, Attribute, UIVertexFormat, color, executeInEditMode } from '../../yj';

@ccclass('YJBitmapLabel')
// @executeInEditMode()
/**
 * 位图文本组件，支持动态加载位图字体配置并渲染文本
 * @example
 * // 编辑器用法：
 * // 1. 将组件挂载到节点
 * // 2. 设置atlasJson属性为位图字体配置文件路径（如：'resources/font/fnt_combat'）
 * // 3. 设置fontType指定字体子类型（如有）
 * // 4. 在string属性输入要显示的文本
 * 
 * // 运行时动态更新：
 * const label = this.getComponent(YJBitmapLabel);
 * label.atlasJson = 'resources/font/new_font'; // 切换字体图集
 * label.string = 'New Text'; // 更新显示内容
 * label.size = 1.2; // 调整整体缩放
 */
export class YJBitmapLabel extends YJRenderBase {
    /**
     * 位图字体图集配置文件路径
     * @example 'resources/font/fnt_combat'
     */
    @property
    public get atlasJson(): string {
        return this._atlasJson;
    }

    public set atlasJson(v: string) {
        if (this._atlasJson == v) return;
        this._atlasJson = v;
        this._atlasConfig = null; // 清空缓存配置
        this.loadJson(); // 重新加载新配置
    }

    /**
     * 字体子类型（用于多字体图集的情况）
     * @example 'bold' 或 'outline'
     */
    @property
    public get fontType(): string {
        return this._fontType;
    }

    public set fontType(v: string) {
        this._fontType = v;
        this.setLabel(); // 字体类型改变时立即更新显示
    }

    /**
     * 显示文本内容
     * @example 
     * label.string = 'Hello World!\n第二行文本';
     */
    @property({ multiline: true })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel(); // 文本变化时触发重绘
    }
    get string() {
        return this._string;
    }

    /**
     * 整体缩放比例（基于原始字体大小）
     * @example 1.0表示原始大小，2.0表示双倍大小
     */
    @property
    public get size(): number {
        return this._size;
    }

    public set size(v: number) {
        this._size = v;
        this.setLabel(); // 缩放比例改变时更新显示
    }

    /**
     * 行高（像素单位），当字符高度小于该值时自动使用该值
     */
    @property
    public get lineHeight(): number {
        return this._lineHeight;
    }

    public set lineHeight(v: number) {
        this._lineHeight = v;
        this.setLabel(); // 行高改变时重新布局
    }

    /**
     * 字符水平间距（像素单位）
     */
    @property
    public get spacingX(): number {
        return this._spacingX;
    }

    public set spacingX(v: number) {
        if (this._spacingX == v) return;
        this._spacingX = v;
        this.setLabel(); // 间距改变时重新计算布局
    }

    // 序列化属性
    @property({ serializable: true })
    protected _atlasJson: string = '';
    @property({ serializable: true })
    protected _fontType: string = '';
    @property({ serializable: true })
    protected _string: string = '';
    @property({ serializable: true })
    protected _spacingX: number = 0;
    @property({ serializable: true })
    protected _size: number = 0;
    @property({ serializable: true })
    protected _lineHeight: number = 0;

    private _atlasConfig: any; // 缓存的图集配置数据

    onLoad() {
        this.loadJson(); // 组件加载时自动加载配置
    }

    /**
     * 通过属性动画更新文本内容
     * @param v 包含string属性的对象
     * @example
     * this.getComponent(YJBitmapLabel).a_text({string: 'New Text'});
     */
    public a_text(v: any) {
        this.string = v.string;
    }

    /**
     * 加载图集配置文件
     * @description 根据运行环境自动选择加载方式：
     * - 编辑器环境下使用EditorMode加载
     * - 运行时使用assetBundleManager加载
     */
    private loadJson() {
        if (this._atlasConfig) {
            this.setLabel();
            return;
        }
        if (EDITOR) {
            no.EditorMode.loadAnyFile<JsonAsset>(this.atlasJson).then(file => {
                this._atlasConfig = file.json;
                this.setLabel();
            })
        } else {
            no.assetBundleManager.loadJSON(this.atlasJson, item => {
                this._atlasConfig = item.json;
                this.setLabel();
            });
        }
    }

    /**
     * 强制刷新文本显示
     * @example
     * // 当图集配置已更新但未自动刷新时调用
     * this.getComponent(YJBitmapLabel).resetLabel();
     */
    public resetLabel() {
        this.setLabel();
    }

    /**
     * 清空当前显示内容
     * @description 将节点尺寸重置为0高度，保持行高设置
     */
    private clearString() {
        no.size(this.node, math.size(0, this._lineHeight));
    }

    /**
     * 更新文本显示核心方法
     * @description 执行流程：
     * 1. 校验节点有效性
     * 2. 处理空文本情况
     * 3. 初始化渲染数据
     * 4. 执行绘制
     */
    private setLabel() {
        if (!isValid(this.node)) return;

        if (this._string == '') {
            this.renderable = false;
            this.clearString();
            return;
        }

        this.renderable = true;
        this.initRenderData(this._string.length, 4); // 每个字符4个顶点
        this.toDraw(); // 生成绘制数据
        this._assembler.updateRenderData(this); // 提交渲染数据更新
    }

    /**
     * 生成绘制数据
     * @description 计算步骤：
     * 1. 获取所有字符配置
     * 2. 计算总宽度和最大高度
     * 3. 设置节点尺寸
     * 4. 根据锚点计算绘制起始位置
     * 5. 逐个字符生成四边形数据
     */
    private toDraw() {
        const arr = this.getCharConfigs();
        const anchorPoint = no.anchor(this.node);
        let width = 0, height = 0;

        // 计算总尺寸
        for (let i = 0, n = arr.length; i < n; i++) {
            const letterInfo = arr[i];
            if (!letterInfo) continue;
            width += letterInfo.originalSize[0] + this.spacingX;
            height = Math.max(height, letterInfo.originalSize[1]);
        }
        width -= this.spacingX; // 去除最后一个间距
        height = Math.max(height, this.lineHeight); // 确保最小行高

        no.size(this.node, size(width, height));

        // 计算绘制起始位置（基于锚点）
        let appX = -anchorPoint.x * width;
        const appY = height * anchorPoint.y;

        // 生成每个字符的四边形数据
        for (let i = 0, n = arr.length; i < n; i++) {
            const letterInfo = arr[i];
            if (!letterInfo) continue;

            const x = appX;
            const y = appY - letterInfo.originalSize[1] / 2; // 垂直居中
            this.appendQuad(
                letterInfo.uv,
                letterInfo.rotated,
                x,
                y,
                letterInfo.originalSize[0],
                letterInfo.originalSize[1]
            );

            appX += letterInfo.originalSize[0] + this.spacingX;
        }
    }

    /**
     * 获取字符配置数组
     * @returns 每个字符对应的图集配置信息数组
     * @description 配置键生成规则：
     * - 如果有fontType: 'fontType/charCode'
     * - 没有fontType: 'charCode'
     */
    private getCharConfigs() {
        return Array.from(this._string).map(char => {
            const charCode = char.charCodeAt(0);
            const key = this.fontType ? `${this.fontType}/${charCode}` : charCode.toString();
            return this._atlasConfig[key];
        });
    }

    /**
     * 添加单个字符的四边形数据
     * @param uv UV坐标数组 [u0, v0, u1, v1]
     * @param rotated 是否旋转纹理
     * @param x 绘制位置X
     * @param y 绘制位置Y
     * @param width 字符宽度
     * @param height 字符高度
     */
    private appendQuad(uv: number[], rotated: boolean, x: number, y: number, width: number, height: number) {
        this.setRenderData({
            uv: uv,
            xy: this.getXY(x, y, width, height),
            rotated: rotated,
            // colors: [color(255, 255, 255, 255)], // 预留颜色设置
            // colors2: [color(255, 255, 255, 255)]
        });
    }

    /**
     * 定义顶点数据格式
     * @returns 顶点属性数组
     */
    protected vertexFormat(): Attribute[] {
        return UIVertexFormat.vfmtPosUvTwoColor;
    }
}