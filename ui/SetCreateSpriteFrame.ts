
import { ccclass, property, requireComponent, Component, Node, SpriteFrame, math, Texture2D, Label, LabelOutline, LabelShadow, Layers, UITransform, Sprite, SpriteAtlas, Rect } from '../yj';
import { DynamicAtlasTexture } from '../engine/atlas';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { CreateSpritemFrameData, CreateSpritemFrameLabelData, CreateSpritemFrameSFData } from '../types';
import { HackUi } from './HackUi';
import { SetEffect } from './SetEffect';

/**
 * Predefined variables
 * Name = SetCreateSpriteFrame
 * DateTime = Fri Jul 15 2022 23:31:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateSpriteFrame.ts
 * FileBasenameNoExtension = SetCreateSpriteFrame
 * URL = db://assets/Script/NoUi3/ui/SetCreateSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * data: CreateSpritemFrameData
 */
@ccclass('SetCreateSpriteFrame')
@requireComponent(Sprite)
/**
 * 设置精灵帧
 * @description 根据输入数据创建精灵帧，并设置到Sprite组件上
 * @example
 * // 在UI编辑器中配置：
 * // atlases: 包含所有精灵帧的精灵图集
 * // data: 包含精灵帧数据的对象
 */
export class SetCreateSpriteFrame extends HackUi {
    /**
     * 精灵图集集合
     * @description 用于查找精灵帧的图集资源池
     * @example 
     * // 在编辑器中配置：
     * // atlases: [界面元素图集, 图标图集, 背景图集]
     */
    @property({ type: SpriteAtlas })
    atlases: SpriteAtlas[] = [];

    // 动态纹理实例，用于合并生成新精灵帧
    private texture: DynamicAtlasTexture;

    /**
     * 数据变更处理
     * @param data 输入数据 {width:纹理宽度, height:纹理高度, spriteFrames:需要合并的精灵帧配置数组}
     * @流程说明
     * 1. 初始化动态纹理
     * 2. 绘制普通精灵帧
     * 3. 如果有文字标签则绘制文字，否则直接设置最终精灵帧
     * @示例
     * // 输入数据结构示例：
     * const data = {
     *   width: 1024,
     *   height: 1024,
     *   spriteFrames: [
     *     {name: 'btn_red', x: 100, y: 100},
     *     {name: 'icon_coin', x: 200, y: 200}
     *   ]
     * };
     */
    protected onDataChange(data: CreateSpritemFrameData) {
        if (!data) return;
        // 初始化动态纹理画布
        this.texture = new DynamicAtlasTexture();
        this.texture.initWithSize(data.width, data.height);
        // 绘制普通精灵帧元素
        this.drawSpriteFrames(data.spriteFrames);
        // 条件判断是否绘制文字元素
        if (data.labels && data.labels.length > 0)
            this.drawTTFSpriteFrames(data.labels);
        else {
            this.setSpriteFrame();
        }
    }

    /**
     * 在图集集合中查找指定名称的精灵帧
     * @param name 要查找的精灵帧名称
     * @returns 找到的精灵帧对象，未找到返回null
     * @查找逻辑 遍历所有图集，使用getSpriteFrame方法查找
     * @示例
     * const sf = this.findSpriteFrame('icon_weapon');
     * if(sf) sf.texture = ...;
     */
    private findSpriteFrame(name: string): SpriteFrame {
        // 使用传统for循环遍历图集数组
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            let sf = this.atlases[i].getSpriteFrame(name);
            if (sf) return sf;
        }
        return null;
    }

    /**
     * 将多个精灵帧绘制到动态纹理
     * @param spriteFrames 精灵帧配置数组
     * @流程说明
     * 1. 创建绘制参数数组
     * 2. 遍历配置数据查找对应精灵帧
     * 3. 当所有元素准备就绪后执行最终绘制
     * @示例配置
     * const config = [
     *   {name: 'bg', x: 0, y: 0},
     *   {name: 'avatar_frame', x: 100, y: 100}
     * ];
     */
    private drawSpriteFrames(spriteFrames: CreateSpritemFrameSFData[]) {
        let arr: { frame: SpriteFrame, x: number, y: number }[] = [];
        // 使用传统for循环处理每个精灵帧配置
        for (let i = 0, n = spriteFrames.length; i < n; i++) {
            const a = spriteFrames[i];
            const sf = this.findSpriteFrame(a.name);
            // 使用数组索引赋值代替push
            arr[arr.length] = {
                frame: sf,
                x: a.x,
                y: a.y
            };
            // 当所有元素处理完成时触发最终绘制
            if (arr.length == n) {
                this.drawSpriteFramesToTexture(arr)
            }
        }
    }

    /**
     * 将多个TTF文字标签绘制到动态纹理
     * @param labels 文字标签配置数组
     * @流程说明
     * 1. 创建临时数组存储异步生成的标签
     * 2. 使用传统for循环遍历每个标签配置
     * 3. 异步创建文字标签（支持字体动态加载）
     * 4. 当所有标签创建完成后：
     *    - 等待一帧确保渲染就绪
     *    - 执行最终绘制
     *    - 更新精灵帧显示
     * @示例配置
     * const labels = [
     *   { string: '攻击+10', x: 100, y: 200, font: 'font/arial', size: 24 },
     *   { string: '防御+5', x: 300, y: 200, color: '#ff0000', bold: true }
     * ];
     */
    private drawTTFSpriteFrames(labels: CreateSpritemFrameLabelData[]) {
        let arr: { label: Label, x: number, y: number }[] = [];
        // 使用传统for循环处理每个标签配置
        for (let i = 0; i < labels.length; i++) {
            const a = labels[i];
            this.createLabel(a).then(label => {
                // 使用数组索引赋值代替push
                arr[arr.length] = {
                    label: label,
                    x: a.x,
                    y: a.y
                };
                // 当所有标签创建完成时
                if (arr.length == labels.length) {
                    // 延迟一帧确保所有标签渲染就绪
                    this.scheduleOnce(() => {
                        this.drawTTFSpriteFramesToCanvas(arr);
                        this.setSpriteFrame();
                    });
                }
            }).catch(e => { no.err('createspriteframe', e); });
        }
    }

    /**
     * 创建文字标签节点
     * @param d 标签配置参数
     * @returns 带有字体加载的Promise对象
     * @创建流程
     * 1. 创建新节点并添加UITransform组件
     * 2. 配置基础文字样式（颜色/大小/粗体/斜体）
     * 3. 添加描边/阴影等特效组件
     * 4. 异步加载字体资源
     * @示例输入
     * {
     *   string: 'Level Up!',
     *   font: 'font/helvetica',
     *   size: 32,
     *   color: '#ffd700',
     *   outlineWidth: 2,
     *   outlineColor: '#000000'
     * }
     */
    private createLabel(d: any): Promise<Label> {
        // 创建基础节点
        let labelNode = new Node();
        labelNode.layer = Layers.Enum.EDITOR;
        labelNode.addComponent(UITransform);
        
        // 配置Label组件
        let label = labelNode.addComponent(Label);
        label.color = no.str2Color(d.color);
        label.fontSize = d.size;
        label.lineHeight = d.size + 4; // 增加行高避免文字裁剪
        label.isItalic = d.italic;
        label.isBold = d.bold;
        label.cacheMode = Label.CacheMode.NONE; // 禁用缓存确保实时渲染
        
        // 添加描边效果
        if (d.outlineColor) {
            let outline = labelNode.addComponent(LabelOutline);
            outline.color = no.str2Color(d.outlineColor);
            outline.width = d.outlineWidth;
        }
        
        // 添加阴影效果
        if (d.shadowColor) {
            let shadow = labelNode.addComponent(LabelShadow);
            shadow.color = no.str2Color(d.shadowColor);
            shadow.offset = d.shadowOffset;
            shadow.blur = d.shadowBlur;
        }
        
        label.string = d.string;
        labelNode.parent = this.node;
        
        // 异步加载字体并返回Promise
        return new Promise<Label>(resolve => {
            no.assetBundleManager.loadFont(d.font, f => {
                if (!label || !label.isValid) return;
                label.font = f;
                resolve(label);
            });
        }).catch(e => {
            console.error(e);
            return null;
        });
    }

    /**
     * 将单个精灵帧绘制到纹理的指定位置
     * @param sf 要绘制的精灵帧
     * @param x 绘制位置的X坐标（中心点）
     * @param y 绘制位置的Y坐标（中心点）
     * @流程说明
     * 1. 克隆精灵帧的矩形区域
     * 2. 处理旋转精灵帧的宽高交换
     * 3. 获取纹理缓冲区数据
     * 4. 执行旋转校正（如果需要）
     * 5. 将缓冲区绘制到目标纹理
     * @示例 绘制一个旋转45度的图标到(200,300)位置：
     * const sf = this.findSpriteFrame('rotated_icon');
     * this.drawSpriteFrameToTexture(sf, 200, 300);
     */
    private drawSpriteFrameToTexture(sf: SpriteFrame, x: number, y: number) {
        // 克隆原始矩形防止污染源数据
        let rect = sf.rect.clone();
        
        // 处理旋转精灵帧的宽高交换
        if (sf.rotated) {
            const temp = rect.width;
            rect.width = rect.height;
            rect.height = temp;
        }
        
        // 获取纹理缓冲区数据
        let buffer = this.texture?.getTextureBuffer(sf.texture as Texture2D, rect);
        
        // 旋转校正处理
        if (sf.rotated) {
            this._rotateImageBuffer(buffer, rect.width, rect.height, false);
            // 交换回原始尺寸用于正确绘制
            const temp = rect.width;
            rect.width = rect.height;
            rect.height = temp;
        }
        
        // 计算中心点坐标并绘制
        this.texture?.drawTextureBufferAt(
            buffer, 
            x - rect.width / 2, // 水平居中
            y - rect.height / 2, // 垂直居中
            rect.width, 
            rect.height
        );
    }

    /**
     * 旋转图像缓冲区数据
     * @param buffer 原始图像缓冲区
     * @param width 图像原始宽度
     * @param height 图像原始高度
     * @param cw 是否顺时针旋转（默认true）
     * @算法说明
     * 1. 将Uint8Array转换为二维颜色数组
     * 2. 根据旋转方向调整数据顺序
     * 3. 重新映射像素位置实现旋转
     * 4. 将处理后的数据写回原始缓冲区
     * @示例 将100x200的图像逆时针旋转90度：
     * this._rotateImageBuffer(buffer, 100, 200, false);
     */
    private _rotateImageBuffer(buffer: Uint8Array, width: number, height: number, cw = true) {
        // 将扁平数组转换为二维颜色数组
        var dd = [];
        let length = Math.ceil(buffer.length / 4);
        for (var ii = 0; ii < length; ii++) {
            dd[ii] = [];
            for (var jj = 0; jj < 4; jj++) {
                dd[ii][jj] = buffer[ii * 4 + jj];
            }
        }
        
        // 处理顺时针旋转
        cw && (dd = dd.reverse());
        
        // 重新排列像素位置
        let bb = [];
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                const [_x, _y] = [y, width - x - 1];
                bb[_y * height + _x] = dd[y * width + x];
            }
        }
        
        // 写回原始缓冲区
        for (var i = 0; i < length; i++) {
            for (var j = 0; j < 4; j++) {
                buffer[i * 4 + j] = bb[i][j];
            }
        }
    }

    /**
     * 将多个TTF文本精灵帧绘制到画布纹理上
     * @param labels 需要绘制的标签数组，每个元素包含：
     *        label - 文本标签对象
     *        x - 绘制位置的X坐标（单位：像素）
     *        y - 绘制位置的Y坐标（单位：像素）
     * @示例 将两个标签绘制到(10,20)和(30,40)位置：
     * drawTTFSpriteFramesToCanvas([
     *     {label: label1, x: 10, y: 20},
     *     {label: label2, x: 30, y: 40}
     * ]);
     */
    private drawTTFSpriteFramesToCanvas(labels: { label: Label, x: number, y: number }[]) {
        for (let i = 0; i < labels.length; i++) {
            const a = labels[i];
            this.drawSpriteFrameToTexture(a.label.ttfSpriteFrame, a.x, a.y);
        }
    }

    /**
     * 将多个精灵帧绘制到纹理贴图
     * @param frames 需要绘制的精灵帧数组，每个元素包含：
     *        frame - 精灵帧对象
     *        x - 目标位置的X坐标（单位：纹理像素）
     *        y - 目标位置的Y坐标（单位：纹理像素）
     * @示例 合并两个精灵帧到纹理的指定位置：
     * drawSpriteFramesToTexture([
     *     {frame: frame1, x: 0, y: 0},
     *     {frame: frame2, x: 64, y: 0}
     * ]);
     */
    private drawSpriteFramesToTexture(frames: { frame: SpriteFrame, x: number, y: number }[]) {
        for (let i = 0; i < frames.length; i++) {
            const a = frames[i];
            this.drawSpriteFrameToTexture(a.frame, a.x, a.y);
        }
    }

    /**
     * 从像素数据创建HTMLCanvas图像
     * @param pixels 图像像素数据（RGBA格式）
     * @param rect 图像尺寸信息对象，包含：
     *        width - 图像宽度
     *        height - 图像高度
     * @returns 生成的Canvas元素
     * @示例 创建100x200的红色图像：
     * const pixels = new Uint8Array(100*200*4).fill(255);
     * _createImage(pixels, {width: 100, height: 200});
     */
    private _createImage(pixels: ArrayBufferView, rect: Rect): HTMLCanvasElement {
        // 创建画布并设置尺寸
        let canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // 获取2D上下文并创建图像数据对象
        let ctx = canvas.getContext("2d");
        let imageData = ctx.createImageData(rect.width, rect.height);
        
        // 将输入像素数据复制到ImageData
        let i = 0, // ImageData索引
            k = 0, // 输入数据索引
            data = imageData.data,
            length = data.length;
        
        // 使用while循环代替for循环优化性能
        while (i < length) {
            data[i++] = pixels[k++]; // R
            data[i++] = pixels[k++]; // G
            data[i++] = pixels[k++]; // B
            data[i++] = pixels[k++]; // A
        }
        
        // 将图像数据绘制到画布
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * 更新精灵帧并处理动态纹理
     * @流程说明
     * 1. 安全检查对象有效性
     * 2. 创建带时间戳的新精灵帧
     * 3. 根据是否使用动态纹理组件选择更新方式
     * 4. 触发着色器检查
     * @示例 在按钮点击时调用：
     * button.node.on('click', () => this.setSpriteFrame());
     */
    private setSpriteFrame() {
        if (!this || !this.isValid) return;
        
        // 创建带时间戳的新精灵帧
        let newSf = new SpriteFrame();
        newSf.texture = this.texture;
        newSf._uuid = `${no.sysTime.now}`;
        
        // 根据组件存在性选择更新方式
        if (!this?.getComponent(YJDynamicTexture)) {
            this.getComponent(Sprite).spriteFrame = newSf;
        } else {
            this?.getComponent(YJDynamicTexture).packSpriteFrame(newSf);
        }
        
        this.checkShader();
    }

    /**
     * 检查并更新材质特效
     * @说明 调用SetEffect组件的工作方法更新材质参数
     * @示例 在纹理更新后自动触发特效更新
     */
    private checkShader() {
        this.getComponent(SetEffect)?.work();
    }
}
