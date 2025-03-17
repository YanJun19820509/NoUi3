import { no } from '../../no';
import { Mat4, RenderData, Texture2D, UIRenderer, UIVertexFormat, Vec3, ccclass, property, Attribute, Color } from '../../yj';
/**
 * 自定义基础渲染组件
 */
export type RenderDataType = { uv?: number[], xy?: number[], rotated?: boolean, colors?: Color[], colors2?: Color[] };
@ccclass('YJRenderBase')
/**
 * 自定义基础渲染组件
 * @remarks
 * - 提供基础的渲染功能，包括纹理设置、顶点数据管理等
 * - 支持自定义顶点格式和渲染数据结构
 * - 提供默认的顶点数据处理方法
 * - 支持渲染数据自动更新和渲染状态管理
 * 
 * @example
 * // 创建一个自定义渲染组件
 * const render = new YJRenderBase();
 * render.node.parent = this.node; // 添加到当前节点
 * render.texture = texture; // 设置纹理
 * render.color = new Color(255, 255, 255, 255); // 设置颜色
 * 
 * // 设置默认顶点数据
 * render.setDefaultRenderData();
 * 
 * // 添加默认顶点数据
 * render.addDefaultRenderData();
 * 
 * // 设置顶点数据
 * render.setRenderData({
 *     uv: [0, 0, 1, 0, 0, 1, 1, 1],
 *     xy: [0, 0, 1, 0, 0, 1, 1, 1],
 *     colors: [new Color(255, 255, 255, 255)],
 * });
 * 
 * // 添加顶点数据
 * render.addRenderData({
 *     uv: [0, 0, 1, 0, 0, 1, 1, 1],
 *     xy: [0, 0, 1, 0, 0, 1, 1, 1],
 *     colors: [new Color(255, 255, 255, 255)],
 * });
 * 
 * // 修改指定顶点数据
 * render.updateCustomRenderData({
 *     uv: [0, 0, 1, 0, 0, 1, 1, 1],
 *     xy: [0, 0, 1, 0, 0, 1, 1, 1],
 *     colors: [new Color(255, 255, 255, 255)],
 * });
 */
export class YJRenderBase extends UIRenderer {
    /**
     * 渲染器使用的纹理资源
     * @property {Texture2D} texture
     * @desc 
     * - 设置/获取当前渲染器使用的纹理
     * - 修改纹理会自动触发渲染数据重建
     * - 支持运行时动态更换纹理
     * @example
     * // 更换纹理并更新：
     * renderComp.texture = newTexture;
     */
    @property({ type: Texture2D })
    public get texture(): Texture2D {
        return this._texture;
    }

    public set texture(v: Texture2D) {
        this._texture = v;
        this.destroyRenderData();
        this._flushAssembler();
        if (this._texture)
            this.markForUpdateRenderData();
    }

    /** 
     * 内部纹理存储字段 
     * @protected 通过texture属性访问器进行访问
     */
    @property({ serializable: true })
    protected _texture: Texture2D = null;

    /** 
     * 顶点颜色数据数组（每个顶点对应一个颜色）
     * @public
     * @desc 
     * - 用于存储每个顶点的颜色值
     * - 数组长度应与顶点数量一致
     * - 支持RGBA颜色设置
     * @example
     * // 设置四个顶点的颜色：
     * this.renderColors = [
     *     new Color(255,0,0),  // 左下顶点红色
     *     new Color(0,255,0),  // 右下顶点绿色
     *     new Color(0,0,255),  // 左上顶点蓝色
     *     new Color(255,255,0) // 右上顶点黄色
     * ];
     */
    public renderColors: Color[] = [];
    
    /** 
     * 第二组顶点颜色数据（可选）
     * @public
     * @desc 
     * - 用于需要多套颜色数据的特殊着色效果
     * - 用法与renderColors相同
     */
    public renderColors2: Color[] = [];
    
    /** 
     * 面片顶点索引数量记录数组
     * @public
     * @desc 
     * - 每个元素记录对应面片的顶点数量
     * - 例如[4,4]表示有两个四边形面片
     * - 用于动态构建索引缓冲区
     */
    public indexNumMap: number[] = [];

    /** 
     * 渲染开关控制
     * @protected
     * @desc 
     * - true时正常渲染（默认）
     * - false时跳过渲染流程
     * @example
     * // 临时隐藏渲染：
     * this.renderable = false;
     */
    protected renderable: boolean = true;

    /** 
     * 当前顶点数据写入偏移量 
     * @private 用于跟踪顶点缓冲区的写入位置
     */
    private dataOffset: number = 0;
    
    /** 
     * 当前索引数据写入偏移量 
     * @private 用于跟踪索引缓冲区的写入位置
     */
    private indexOffset: number = 0;

    /**
     * 组件销毁生命周期回调
     * @desc 
     * - 自动释放纹理资源
     * - 防止内存泄漏
     */
    onDestroy() {
        this._texture?.destroy();
    }

    /**
     * 定义顶点数据结构
     * @virtual
     * @returns {Attribute[]} 顶点属性格式数组
     * @desc 
     * - 默认使用位置+UV+颜色的标准格式
     * - 子类可重写以支持自定义顶点格式
     * @example
     * // 添加法线属性：
     * protected vertexFormat(): Attribute[] {
     *     return [
     *         { name: 'a_position', format: 'float32x3' },
     *         { name: 'a_uv0', format: 'float32x2' },
     *         { name: 'a_color', format: 'float32x4' },
     *         { name: 'a_normal', format: 'float32x3' }
     *     ];
     * }
     */
    protected vertexFormat(): Attribute[] {
        return UIVertexFormat.vfmtPosUvColor;
    }

    /**
     * 刷新装配器状态
     * @desc 
     * - 当材质或纹理变更时需手动调用
     * - 负责重建渲染数据（RenderData）
     * - 自动处理装配器类型变更时的数据销毁
     * @example
     * // 更换材质后刷新：
     * this.material = newMaterial;
     * this._flushAssembler();
     */
    protected _flushAssembler() {
        // 装配器类型变更时销毁旧数据
        if (this._assembler !== YJAssemblerBase) {
            this.destroyRenderData();
            this._assembler = YJAssemblerBase;
        }

        // 创建新的渲染数据
        if (!this._renderData) {
            if (this._assembler?.createData) {
                this._renderData = this._assembler.createData(this.vertexFormat());
                this._renderData!.material = this.material; // 绑定当前材质
            }
        }
    }

    /**
     * 执行渲染提交
     * @param render 渲染器实例
     * @desc 
     * - 引擎每帧自动调用
     * - 仅当满足渲染条件时提交数据到渲染管线
     * - 开发者不应手动调用此方法
     */
    protected _render(render: any) {
        if (!this._canRender()) return;
        render.commitComp(this, this._renderData, this._texture, this._assembler!, null);
    }

    /**
     * 判断是否可渲染
     * @returns {boolean} 是否满足渲染条件
     * @desc 
     * - 检查渲染开关状态
     * - 验证父类渲染条件
     * - 确保纹理资源有效
     * @example
     * // 临时禁用渲染：
     * this.renderable = false;
     */
    protected _canRender() {
        return !!(this.renderable && super._canRender() && this._texture);
    }

    /**
     * 初始化渲染数据结构
     * @param planeNum 要渲染的平面数量（如多个精灵图需要多个平面）
     * @param vertextNum 单个平面的顶点数（3=三角形，4=四边形）
     * @desc 
     * - 必须先于任何渲染数据操作调用
     * - 自动计算顶点/索引缓冲区大小
     * - 重置所有数据写入偏移量
     * @example
     * // 初始化3个四边形平面：
     * this.initRenderData(3, 4);
     * // 初始化2个三角形平面：
     * this.initRenderData(2, 3);
     */
    protected initRenderData(planeNum: number, vertextNum: 3 | 4 = 4) {
        const renderData = this._renderData;
        // 计算顶点和索引数量（三角形需要3个索引，四边形分解为2个三角形需要6个）
        const indexPerPlane = vertextNum === 3 ? 3 : 6;
        
        // 调整缓冲区大小
        renderData.dataLength = planeNum * vertextNum;
        renderData.resize(renderData.dataLength, planeNum * indexPerPlane);
        
        // 标记需要更新渲染数据
        this.markForUpdateRenderData();
        
        // 重置状态
        this.indexOffset = 0;
        this.dataOffset = 0;
        this.renderColors.length = 0;
        this.renderColors2.length = 0;
        this.indexNumMap.length = 0;
        
        // 记录每个平面的顶点数
        for (let i = 0; i < planeNum; i++) {
            this.indexNumMap.push(vertextNum);
        }
    }

    /**
     * 设置默认顶点数据
     * @desc 
     * - 使用默认UV坐标和位置坐标初始化顶点数据
     * - 采用当前组件的color属性作为顶点颜色
     * - 适用于需要快速初始化标准四边形顶点数据的场景
     * @example
     * // 初始化一个默认四边形：
     * this.setDefaultRenderData();
     * // 效果等同于设置：
     * this.setRenderData({
     *     uv: [0,0,1,0,0,1,1,1], // 完整纹理映射
     *     xy: [0,0,1,0,0,1,1,1], // 单位四边形
     *     colors: [this.color]    // 使用当前颜色
     * });
     */
    protected setDefaultRenderData() {
        this.setRenderData({
            uv: this.getDefaultUV(),
            xy: this.getDefaultXY(),
            colors: [this.color],
        })
    }

    /**
     * 添加默认顶点数据
     * @desc 
     * - 追加新的默认顶点数据到现有数据末尾
     * - 自动扩展顶点缓冲区大小
     * - 适用于动态添加多个标准图形的场景
     * @example
     * // 先初始化一个四边形，再追加一个四边形：
     * this.initRenderData(1, 4);
     * this.setDefaultRenderData();
     * this.addDefaultRenderData();
     */
    protected addDefaultRenderData() {
        this.addRenderData({
            uv: this.getDefaultUV(),
            xy: this.getDefaultXY(),
            colors: [this.color],
        })
    }

    /**
     * 设置顶点数据
     * @param d 渲染数据结构体
     * @property {number[]} d.uv - UV坐标数组（每2个元素表示一个顶点的UV）
     * @property {number[]} d.xy - 顶点坐标数组（每2个元素表示一个顶点的位置）
     * @property {Color[]} d.colors - 顶点颜色数组（支持每个顶点单独颜色）
     * @property {Color[]} [d.colors2] - 第二组顶点颜色数组（可选）
     * @desc 
     * - 循环使用预先分配的顶点缓冲区
     * - 不会改变顶点数据总长度，仅覆盖现有数据
     * - 自动处理颜色数据更新
     * - 维护数据写入偏移量状态
     * @example
     * // 设置自定义三角形数据：
     * this.setRenderData({
     *     uv: [0,0, 1,0, 0.5,1],
     *     xy: [0,0, 100,0, 50,100],
     *     colors: [Color.RED, Color.GREEN, Color.BLUE]
     * });
     */
    protected setRenderData(d: RenderDataType) {
        // 循环缓冲区处理：当索引超过平面数量时重置偏移
        if (this.indexOffset >= this.indexNumMap.length) {
            this.indexOffset = 0;
            this.dataOffset = 0;
        }
        
        // 更新顶点坐标和UV数据
        this.updateCustomRenderData(d);
        // 更新颜色数据（支持双色组）
        this.updateCustomRenderDataColor(d.colors, d.colors2);
        
        // 移动数据写入指针：根据当前平面的顶点数前进
        this.dataOffset += this.indexNumMap[this.indexOffset];
        this.indexOffset++;
    }

    /**
     * 添加顶点数据
     * @param d 渲染数据结构体
     * @property {number[]} d.uv - UV坐标数组（每2个元素表示一个顶点的UV）
     * @property {number[]} d.xy - 顶点坐标数组（每2个元素表示一个顶点的位置）
     * @property {Color[]} d.colors - 顶点颜色数组
     * @desc 
     * - 动态扩展顶点缓冲区，增加新的面片数据
     * - 会改变顶点数据总长度，需先调用resetRenderData重置缓冲区
     * - 自动计算新的索引数量（三角形带模式：n顶点对应(n-2)*3个索引）
     * - 维护indexNumMap记录每个面片的顶点数
     * 
     * @example
     * // 添加一个三角形面片：
     * this.addRenderData({
     *     uv: [0,0, 1,0, 0.5,1],
     *     xy: [0,0, 100,0, 50,100],
     *     colors: [Color.RED]
     * });
     * // 顶点数从0变为3，索引数增加3
     */
    protected addRenderData(d: RenderDataType) {
        const renderData = this._renderData,
            vertexCount = renderData.vertexCount,  // 当前顶点总数
            indexCount = renderData.indexCount,    // 当前索引总数
            n = d.uv.length / 2;                   // 新面片的顶点数（每个顶点2个UV坐标）
        
        // 扩展数据缓冲区：顶点数增加n，索引数增加三角形带需要的索引数
        renderData.dataLength = vertexCount + n;
        renderData.resize(renderData.dataLength, indexCount + (n - 2) * 3);
        
        // 记录新面片的顶点数（3=三角形，4=四边形）
        this.indexNumMap[this.indexNumMap.length] = n;
        
        // 写入实际数据
        this.setRenderData(d);
    }

    /**
     * 更新当前数据偏移位置的顶点数据
     * @param d 渲染数据结构体
     * @property {boolean} [d.rotated] - 是否旋转纹理（影响UV映射方式）
     * @desc 
     * - 根据dataOffset自动定位写入位置
     * - 支持两种UV映射模式（普通/旋转90度）
     * - 同时更新顶点坐标和UV数据
     * - 不会改变顶点数据总长度，仅覆盖现有数据
     * 
     * @example
     * // 更新四边形面片的UV为旋转模式：
     * this.updateCustomRenderData({
     *     uv: [0,0, 1,0, 0,1, 1,1],
     *     rotated: true
     * });
     * 
     * // 更新三角形面片的位置：
     * this.updateCustomRenderData({
     *     xy: [10,10, 110,10, 60,110]
     * });
     */
    protected updateCustomRenderData(d: RenderDataType) {
        const renderData = this._renderData;
        const dataOffset = this.dataOffset;    // 当前数据写入偏移量
        const dataList = renderData.data;      // 顶点数据数组
        const indexNum = this.indexNumMap[this.indexOffset]; // 当前面片的顶点数

        // 处理UV坐标更新（支持旋转纹理）
        if (d.uv?.length > 0) {
            if (!d.rotated) {
                // 标准UV映射：左下->右下->左上->右上
                dataList[dataOffset].u = d.uv[0]; dataList[dataOffset].v = d.uv[1];
                dataList[dataOffset + 1].u = d.uv[2]; dataList[dataOffset + 1].v = d.uv[3];
                dataList[dataOffset + 2].u = d.uv[4]; dataList[dataOffset + 2].v = d.uv[5];
                if (indexNum == 4) { // 四边形需要设置第四个顶点
                    dataList[dataOffset + 3].u = d.uv[6]; dataList[dataOffset + 3].v = d.uv[7];
                }
            } else {
                // 旋转90度UV映射：左上->左下->右上->右下
                dataList[dataOffset].u = d.uv[4]; dataList[dataOffset].v = d.uv[5];
                dataList[dataOffset + 1].u = d.uv[0]; dataList[dataOffset + 1].v = d.uv[1];
                dataList[dataOffset + 2].u = d.uv[6]; dataList[dataOffset + 2].v = d.uv[7];
                if (indexNum == 4) {
                    dataList[dataOffset + 3].u = d.uv[2]; dataList[dataOffset + 3].v = d.uv[3];
                }
            }
        }

        // 处理顶点坐标更新
        if (d.xy?.length > 0) {
            for (let i = 0; i < indexNum; i++) {
                // 每个顶点设置x,y坐标（坐标系原点在左上角）
                dataList[dataOffset + i].x = d.xy[i * 2];     // x坐标
                dataList[dataOffset + i].y = d.xy[i * 2 + 1]; // y坐标
            }
        }
    }

    /**
     * 更新顶点颜色数据
     * @param colors 主颜色数组（每个元素对应一个顶点颜色）
     * @param colors2 第二颜色数组（可选，用于特殊着色效果）
     * @desc
     * - 支持三角形（3顶点）和四边形（4顶点）两种面片类型
     * - 颜色数组长度不足时会自动复用前序颜色值
     * - 当colors2存在时，会同时更新第二组颜色数据
     * 
     * @example
     * // 更新四边形面片颜色（带渐变色）：
     * this.updateCustomRenderDataColor([
     *     new Color(255,0,0),  // 左下顶点红色
     *     new Color(0,255,0),  // 右下顶点绿色
     *     new Color(0,0,255),  // 左上顶点蓝色
     *     new Color(255,255,0) // 右上顶点黄色
     * ]);
     * 
     * // 更新三角形面片颜色（单色）：
     * this.updateCustomRenderDataColor([Color.WHITE]);
     */
    protected updateCustomRenderDataColor(colors: Color[], colors2?: Color[]) {
        const dataOffset = this.dataOffset;    // 当前数据写入起始索引
        const indexNum = this.indexNumMap[this.indexOffset]; // 当前面片顶点数（3或4）
        
        // 处理主颜色数据
        if (colors?.length > 0) {
            this.renderColors[dataOffset] = colors[0];
            this.renderColors[dataOffset + 1] = colors[1] || colors[0]; // 缺省时复用第一个颜色
            this.renderColors[dataOffset + 2] = colors[2] || colors[0];
            if (indexNum == 4) // 四边形需要设置第四个顶点颜色
                this.renderColors[dataOffset + 3] = colors[3] || colors[1] || colors[0];
        }

        // 处理第二颜色数据（可选）
        if (colors2?.length > 0) {
            this.renderColors2[dataOffset] = colors2[0];
            this.renderColors2[dataOffset + 1] = colors2[1] || colors2[0];
            this.renderColors2[dataOffset + 2] = colors2[2] || colors2[0];
            if (indexNum == 4)
                this.renderColors2[dataOffset + 3] = colors2[3] || colors2[1] || colors2[0];
        }
    }

    /**
     * 计算四边形顶点在节点局部空间的坐标
     * @param x 左上角起始X坐标（基于节点左下角原点）
     * @param y 左上角起始Y坐标（基于节点左下角原点）
     * @param width 四边形宽度（单位：像素）
     * @param height 四边形高度（单位：像素）
     * @returns 四个顶点坐标数组，顺序：[左下, 右下, 左上, 右上]
     * 
     * @example
     * // 创建100x50的四边形，起始于(10,20)：
     * const xy = this.getXY(10, 20, 100, 50);
     * // 返回：[10, -30, 110, -30, 10, 20, 110, 20]
     */
    protected getXY(x: number, y: number, width: number, height: number): number[] {
        return [
            x, y - height,        // 左下顶点
            x + width, y - height,// 右下顶点
            x, y,                 // 左上顶点
            x + width, y          // 右上顶点
        ];
    }

    /**
     * 计算纹理UV坐标
     * @param u 起始U坐标（纹理左边界，范围0-1）
     * @param v 起始V坐标（纹理上边界，范围0-1）
     * @param width UV宽度（占纹理比例，范围0-1）
     * @param height UV高度（占纹理比例，范围0-1）
     * @returns 四个顶点UV坐标数组，顺序：[左下, 右下, 左上, 右上]
     * 
     * @example
     * // 截取纹理右半部分：
     * const uv = this.getUV(0.5, 0, 0.5, 1);
     * // 返回：[0.5,1, 1.0,1, 0.5,0, 1.0,0]
     */
    protected getUV(u: number, v: number, width: number, height: number): number[] {
        return [
            u, v + height,        // 左下UV
            u + width, v + height,// 右下UV 
            u, v,                // 左上UV
            u + width, v         // 右上UV
        ];
    }

    /**
     * 获取默认UV坐标（完整纹理映射）
     * @returns 覆盖整个纹理的UV坐标数组
     * @desc 
     * - 左下(0,1) -> 右下(1,1) -> 左上(0,0) -> 右上(1,0)
     * - 对应标准纹理映射方式
     */
    protected getDefaultUV(): number[] {
        return [0, 1, 1, 1, 0, 0, 1, 0];
    }

    /**
     * 获取基于节点属性的默认顶点坐标
     * @returns 四个顶点坐标数组，顺序：[左下, 右下, 左上, 右上]
     * @desc 
     * - 根据节点尺寸和锚点自动计算
     * - 坐标系原点在节点左下角
     * - 自动适配不同锚点设置
     * 
     * @example
     * // 节点尺寸200x100，锚点(0.5,0.5)时：
     * // 返回：[-100,-50, 100,-50, -100,50, 100,50]
     */
    protected getDefaultXY(): number[] {
        const { width, height } = no.size(this.node), // 获取节点尺寸
            { x, y } = no.anchor(this.node);          // 获取锚点比例
        return [
            -width * x, -height * y,                // 左下
            width * (1 - x), -height * y,           // 右下
            -width * x, height * (1 - y),           // 左上
            width * (1 - x), height * (1 - y)       // 右上
        ];
    }
}

/**
 * 渲染数据装配器
 * @desc 
 * - 负责将顶点数据装配到渲染数据中
 * - 支持多种顶点格式和渲染模式
 * - 自动处理顶点坐标和UV映射
 * - 维护渲染数据缓冲区
 * 
 * @example
 * // 创建渲染数据装配器：
 * const assembler = YJAssemblerBase.createData();
 * 
 * // 装配顶点数据：
 * assembler.addVertexData(vertexData);
 */
export const YJAssemblerBase = {
    /**
     * 创建渲染数据对象
     * @param vertexFormat 顶点属性格式数组（可选）
     * @returns {RenderData} 新创建的渲染数据实例
     * @desc 
     * - 工厂方法用于创建指定顶点格式的渲染数据
     * - 默认创建空数据容器，需后续填充数据
     * - 自动初始化数据长度和缓冲区大小
     * @example
     * // 创建带位置和UV属性的渲染数据：
     * const format = [Attribute.ATTR_POSITION, Attribute.ATTR_UV];
     * const data = YJAssemblerBase.createData(format);
     */
    createData(vertexFormat?: Attribute[]) {
        const renderData = RenderData.add(vertexFormat);
        renderData.dataLength = 0;   // 初始化数据长度计数器
        renderData.resize(0, 0);     // 预分配顶点和索引缓冲区
        return renderData;
    },

    /**
     * 填充图形API缓冲区
     * @param comp 渲染组件实例
     * @param renderer 渲染器实例
     * @desc 
     * - 主渲染循环调用的核心方法
     * - 自动处理顶点数据更新流程：
     *   1. 更新世界坐标（当节点变换发生变化时）
     *   2. 更新UV坐标（当顶点数据变化时）
     *   3. 更新颜色数据（当颜色变化时）
     *   4. 更新索引数据（总是执行）
     * @example
     * // 在自定义渲染器中调用：
     * assembler.fillBuffers(this, renderer);
     */
    fillBuffers(comp: YJRenderBase, renderer: any) {
        if (comp === null) {
            return;
        }

        const renderData = comp.renderData!;
        // 节点变换更新时需要重新计算世界坐标
        if (comp.node.hasChangedFlags || renderData.vertDirty) {
            this.updateWorldVerts(comp);
        }

        // 顶点数据变化时更新UV和颜色
        if (renderData.vertDirty) {
            this.updateUVs(comp);    // 更新纹理坐标
            this.updateColor(comp);  // 更新顶点颜色
            renderData.vertDirty = false; // 清除脏标记
        }

        // 总是更新索引数据
        this.updateIndexes(comp);
    },

    /**
     * 更新渲染数据到GPU
     * @param comp 渲染组件实例
     * @desc 
     * - 当纹理或顶点数据变化时手动调用
     * - 执行更新管线：
     *   1. 检查纹理有效性
     *   2. 更新UV坐标
     *   3. 更新颜色数据
     *   4. 提交数据到渲染器
     * @example
     * // 在修改顶点数据后强制更新：
     * comp.setRenderData(newData);
     * YJAssemblerBase.updateRenderData(comp);
     */
    updateRenderData(comp: YJRenderBase) {
        const texture: Texture2D = comp['texture'];
        const renderData = comp.renderData;
        if (renderData && texture) {
            this.updateUVs(comp);    // 标记需要更新UV
            this.updateColor(comp);  // 标记需要更新颜色
            if (renderData.vertDirty) {
                this.updateVertexData(comp); // 更新顶点位置数据
            }
            renderData.updateRenderData(comp, texture); // 提交到渲染管线
        }
    },
    /**
     * 更新顶点世界坐标
     * @param comp 渲染组件实例
     * @desc 
     * - 根据节点世界矩阵计算顶点最终屏幕坐标
     * - 处理节点变换（位移/旋转/缩放）对顶点的影响
     * - 使用透视除法处理3D空间坐标到2D屏幕坐标的转换
     * - 计算结果直接写入顶点缓冲区
     * 
     * @example
     * // 当节点发生移动时自动触发：
     * node.setPosition(100, 50);
     * // 或手动强制更新：
     * this.updateWorldVerts(renderComp);
     */
    updateWorldVerts(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const dataList = renderData.data; // 原始顶点数据数组
        const chunk = renderData.chunk;   // 渲染数据块
        const vData = chunk.vb;           // 顶点缓冲区Float32Array
        const vertexCount = renderData.vertexCount; // 顶点总数
        const floatStride = renderData.floatStride; // 单个顶点数据跨度（浮点数个数）

        const m = comp.node.worldMatrix;  // 节点的世界变换矩阵

        let offset = 0; // 顶点缓冲区写入偏移量
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];     // 当前顶点原始数据
            const x = vert.x;             // 局部坐标X
            const y = vert.y;             // 局部坐标Y
            
            // 计算透视除法因子 (1 / w)，用于3D透视投影
            let rhw = m.m03 * x + m.m07 * y + m.m15; // 计算w分量
            rhw = rhw ? Math.abs(1 / rhw) : 1;       // 避免除以零

            // 应用世界变换矩阵并执行透视除法
            vData[offset + 0] = (m.m00 * x + m.m04 * y + m.m12) * rhw; // 屏幕坐标X
            vData[offset + 1] = (m.m01 * x + m.m05 * y + m.m13) * rhw; // 屏幕坐标Y
            vData[offset + 2] = (m.m02 * x + m.m06 * y + m.m14) * rhw; // Z深度值
            offset += floatStride; // 移动到下一个顶点数据位置
        }
    },

    /**
     * 顶点数据更新预留方法
     * @param comp 渲染组件实例
     * @desc 
     * - 用于子类扩展自定义顶点数据更新逻辑
     * - 当前为空实现，需要时在子类中重写
     * 
     * @example
     * // 在子类中实现自定义顶点更新：
     * protected updateVertexData(comp: YourRenderComp) {
     *     // 添加法线或自定义顶点属性计算
     * }
     */
    updateVertexData(comp: YJRenderBase) {

    },

    /**
     * 更新UV坐标数据
     * @param comp 渲染组件实例 
     * @desc
     * - 将顶点UV坐标写入顶点缓冲区
     * - UV坐标范围[0,1]对应纹理的[左下,右上]
     * - 每个顶点的UV数据存储在顶点缓冲区的第3、4位置（前3位为坐标）
     * 
     * @example
     * // 动态修改UV实现纹理滚动：
     * verts.forEach(v => v.u += 0.1);
     * this.updateUVs(renderComp);
     */
    updateUVs(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;     // 顶点缓冲区
        const vertexCount = renderData.vertexCount; 
        const floatStride = renderData.floatStride; // 单个顶点数据长度
        const dataList = renderData.data;      // 原始顶点数据

        let vertexOffset = 3; // UV在顶点数据中的起始位置（前3位是xyz坐标）
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            vData[vertexOffset] = vert.u;     // 写入U坐标
            vData[vertexOffset + 1] = vert.v; // 写入V坐标
            vertexOffset += floatStride;      // 移动到下一个顶点
        }
    },

    /**
     * 更新索引缓冲区数据
     * @param comp 渲染组件实例
     * @desc 
     * - 构建三角形/四边形索引数据
     * - 根据indexNumMap配置生成三角形带索引
     * - 3个顶点构成三角形，4个顶点构成四边形（两个三角形）
     * 
     * @example
     * // 当indexNumMap为[3,4]时：
     * // 第一个元素生成三角形索引：0,1,2
     * // 第二个元素生成四边形索引：3,4,5 和 4,6,5
     */
    updateIndexes(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const chunk = renderData.chunk;
        const meshBuffer = chunk.meshBuffer;
        const ib = meshBuffer.iData; // 索引缓冲区数据
        const indexNumMap = comp.indexNumMap; // 每个面片的顶点数量配置
        
        let vid = chunk.vertexOffset; // 当前顶点缓冲区的起始偏移
        let indexOffset = meshBuffer.indexOffset; // 当前索引缓冲区的写入位置

        // 遍历所有面片配置生成索引
        for (let i = 0, count = indexNumMap.length; i < count; i++) {
            const start = vid; // 当前面片的起始顶点索引
            const indexNum = indexNumMap[i]; // 当前面片需要的顶点数（3=三角形，4=四边形）
            
            // 生成基础三角形索引
            ib[indexOffset++] = start;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 2;

            // 如果是四边形则生成第二个三角形
            if (indexNum == 4) {
                ib[indexOffset++] = start + 1;
                ib[indexOffset++] = start + 3;
                ib[indexOffset++] = start + 2;
            }

            vid += indexNum; // 移动到下一个面片的起始顶点
        }
        meshBuffer.indexOffset += renderData.indexCount; // 更新缓冲区写入位置
    },

    /**
     * 更新顶点颜色数据
     * @param comp 渲染组件实例 
     * @desc
     * - 将颜色数据写入顶点缓冲区
     * - 支持主颜色(renderColors)和次颜色(renderColors2)
     * - 颜色值需要归一化为0-1范围（除以255）
     * - 颜色数据在顶点缓冲区中的布局：
     *   [x,y,z, u,v, r,g,b,a, r2,g2,b2,a2]
     * 
     * @example
     * // 设置顶点渐变色：
     * comp.renderColors = [
     *     new Color(255,0,0), 
     *     new Color(0,255,0),
     *     new Color(0,0,255),
     *     new Color(255,255,0)
     * ];
     */
    updateColor(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb; // 顶点缓冲区
        const vertexCount = renderData.vertexCount; // 总顶点数
        const floatStride = renderData.floatStride; // 单个顶点数据长度（浮点数个数）
        
        let colorOffset = 5; // 颜色数据起始位置（前5个float是x,y,z,u,v）
        for (let i = 0; i < vertexCount; i++) {
            // 写入主颜色（使用顶点自定义颜色或默认颜色）
            const color: Color = comp.renderColors?.[i] || comp.color;
            vData[colorOffset] = color.r / 255;     // R通道
            vData[colorOffset + 1] = color.g / 255; // G通道
            vData[colorOffset + 2] = color.b / 255; // B通道
            vData[colorOffset + 3] = color.a / 255; // A通道

            // 写入次颜色（如果存在）
            if (comp.renderColors2?.[i]) {
                vData[colorOffset + 4] = comp.renderColors2[i].r / 255;
                vData[colorOffset + 5] = comp.renderColors2[i].g / 255;
                vData[colorOffset + 6] = comp.renderColors2[i].b / 255;
                vData[colorOffset + 7] = comp.renderColors2[i].a / 255;
            }

            colorOffset += floatStride; // 移动到下一个顶点的颜色数据位置
        }
    },
};

