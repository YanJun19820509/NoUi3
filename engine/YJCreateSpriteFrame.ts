
import { ccclass, property, requireComponent, Component, Sprite, SpriteFrame, Texture2D, Enum, Size, v2, Vec2 } from '../yj';
import { AlignType } from '../types';
import { DynamicAtlasTexture } from './atlas';

/**
 * Predefined variables
 * Name = YJCreateSpriteFrame
 * DateTime = Thu Jun 30 2022 10:23:50 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCreateSpriteFrame.ts
 * FileBasenameNoExtension = YJCreateSpriteFrame
 * URL = db://assets/NoUi3/engine/YJCreateSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJCreateSpriteFrame')
@requireComponent(Sprite)
/**
 * 动态图集生成组件
 * @description 用于将多个SpriteFrame合并生成新的组合式SpriteFrame
 * @example
 * // 在节点上添加组件后：
 * const creator = node.getComponent(YJCreateSpriteFrame);
 * // 创建包含三个图标的组合SpriteFrame
 * creator.useSpriteFrames([icon1, icon2, icon3], 'combined_icon');
 */
export class YJCreateSpriteFrame extends Component {
    /**
     * 排列方式枚举
     * @enum {number}
     * - None: 自由排列（默认横向排列）
     * - Top: 顶部对齐水平排列
     * - Bottom: 底部对齐水平排列
     * - Middle: 垂直居中水平排列
     * - Left: 左对齐垂直排列
     * - Right: 右对齐垂直排列
     * - Center: 水平居中垂直排列
     */
    @property({ type: Enum(AlignType) })
    align: AlignType = AlignType.None;
    
    /**
     * 元素间隔偏移量
     * @description 根据排列方式不同，x表示水平间距，y表示垂直间距
     * @example
     * // 水平排列时设置10像素间距
     * offset = v2(10, 0);
     */
    @property
    offset: Vec2 = v2();

    /**
     * 使用多个SpriteFrame生成组合图集
     * @param sfs 需要组合的SpriteFrame数组
     * @param uuid 生成的新SpriteFrame的唯一标识
     * @example
     * // 创建横向排列的三个图标组合，间距5像素
     * creator.align = AlignType.Top;
     * creator.offset = v2(5, 0);
     * creator.useSpriteFrames([icon1, icon2, icon3], 'menu_icons');
     */
    public useSpriteFrames(sfs: SpriteFrame[], uuid: string): void {
        if (sfs.length > 0) {
            let size = this.getSize(sfs);
            let texture = new DynamicAtlasTexture();
            texture.initWithSize(size.width, size.height);
            let newSf = new SpriteFrame();
            newSf.texture = texture;
            newSf._uuid = uuid;
            this.getComponent(Sprite).spriteFrame = newSf;

            this.createImage(texture, sfs);
        } else
            this.getComponent(Sprite).spriteFrame = null;
    }

    /**
     * 计算组合图集所需总尺寸
     * @param sfs SpriteFrame数组
     * @returns 计算后的总尺寸对象
     * @example
     * // 当水平排列三个100x50的SpriteFrame，间隔10像素时：
     * // 总宽度 = 100 + (100+10) + (100+10) = 320
     * // 总高度 = 50
     */
    private getSize(sfs: SpriteFrame[]): Size {
        let size = new Size();
        for (let i = 0; i < sfs.length; i++) {
            const sf = sfs[i];
            switch (this.align) {
                case AlignType.Top:
                case AlignType.Bottom:
                case AlignType.Middle:
                    // 水平排列：累加宽度，取最大高度
                    size.width += sf.rect.width + (i > 0 ? this.offset.x : 0);
                    size.height = Math.max(size.height, sf.rect.height);
                    break;
                case AlignType.Left:
                case AlignType.Right:
                case AlignType.Center:
                    // 垂直排列：取最大宽度，累加高度
                    size.width = Math.max(size.width, sf.rect.width);
                    size.height += sf.rect.height + (i > 0 ? this.offset.y : 0);
                    break;
                default:
                    // 自由排列：同时累加宽高
                    size.width += sf.rect.width + (i > 0 ? this.offset.x : 0);
                    size.height += sf.rect.height + (i > 0 ? this.offset.y : 0);
                    break;
            }
        }
        return size;
    }

    /**
     * 在动态纹理上绘制所有SpriteFrame
     * @param texture 目标动态纹理
     * @param sfs 需要绘制的SpriteFrame数组
     * @example
     * // 绘制流程：
     * 1. 获取每个SpriteFrame的纹理数据
     * 2. 根据排列方式计算绘制位置
     * 3. 将纹理数据绘制到动态纹理的指定位置
     */
    private createImage(texture: DynamicAtlasTexture, sfs: SpriteFrame[]) {
        let width = texture.width, height = texture.height;

        let x = 0, y = 0, sx = 0, sy = 0;
        for (let i = 0; i < sfs.length; i++) {
            const sf = sfs[i];
            let rect = sf.rect;
            let buffer = texture.getTextureBuffer(sf.texture as Texture2D, rect);
            
            // 根据对齐方式计算绘制位置和步进值
            switch (this.align) {
                case AlignType.Top:
                    sx = rect.width + this.offset.x; // 水平步进：元素宽度+水平间隔
                    break;
                case AlignType.Bottom:
                    sx = rect.width + this.offset.x;
                    y = height - rect.height; // 底部对齐：总高度-元素高度
                    break;
                case AlignType.Middle:
                    sx = rect.width + this.offset.x;
                    y = (height - rect.height) / 2; // 垂直居中
                    break;
                case AlignType.Left:
                    sy = rect.height + this.offset.y; // 垂直步进：元素高度+垂直间隔
                    break;
                case AlignType.Right:
                    x = width - rect.width; // 右对齐：总宽度-元素宽度
                    sy = rect.height + this.offset.y;
                    break;
                case AlignType.Center:
                    x = (width - rect.width) / 2; // 水平居中
                    sy = rect.height + this.offset.y;
                    break;
                default:
                    sx = rect.width + this.offset.x;
                    sy = rect.height + this.offset.y;
                    break;
            }
            texture.drawTextureBufferAt(buffer, x, y, rect.width, rect.height);
            x += sx;
            y += sy;
        }
    }
}
