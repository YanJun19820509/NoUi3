
import {
    EDITOR, ccclass, SpriteFrame, Label, UIRenderer, Texture2D,
    Sprite, BitmapFont, Node, rect, SpriteAtlas, Material, size, director, dynamicAtlasManager,
    Vec2
} from '../yj';
import { PackedFrameData, SpriteFrameDataType } from '../types';
import { Atlas } from './atlas';
// import { YJShowDynamicAtlasDebug } from './YJShowDynamicAtlasDebug';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJDynamicAtlas
 * DateTime = Tue Apr 19 2022 15:57:55 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDynamicAtlas.ts
 * FileBasenameNoExtension = YJDynamicAtlas
 * URL = db://assets/common/engine/YJDynamicAtlas.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 将子节点Label及特定SpriteFrame添加进入动态图集
 * 【不能与原生动态合图同时使用】。
 */
@ccclass('YJDynamicAtlas')
export class YJDynamicAtlas {

    /**
     * 动态图集构造函数
     * @param atlas 图集实例，用于管理动态合图
     * @param material 自定义材质，用于渲染合图后的UI元素
     * @example
     * // 创建动态图集实例
     * const atlas = new Atlas(1024, 1024);
     * const material = new Material();
     * const dynamicAtlas = new YJDynamicAtlas(atlas, material);
     */
    constructor(atlas: Atlas, material: Material) {
        this.atlas = atlas;
        this._customMaterial = material;
    }

    /**
     * 获取/设置自定义材质
     * @description 用于控制合图元素的渲染效果，设置时会自动应用到所有子节点渲染组件
     * @example
     * // 修改材质属性
     * dynamicAtlas.customMaterial.setProperty('color', Color.RED);
     */
    // @property({ type: Material })
    public get customMaterial(): Material {
        return this._customMaterial;
    }

    public set customMaterial(v: Material) {
        this._customMaterial = v;
        // 实现代码已注释，保留原始逻辑结构
    }

    /** @internal 存储自定义材质实例 */
    // @property({ serializable: true })
    _customMaterial: Material = null;

    /** 动态图集管理实例 */
    public atlas: Atlas;

    /** SpriteFrame缓存映射表（UUID到SpriteFrame的映射） */
    private spriteFrameMap: any = {};

    /**
     * 合图旋转开关
     * @description 控制是否允许旋转子图以优化空间布局（默认关闭）
     * @example
     * // 启用旋转优化
     * dynamicAtlas.canRotate = true;
     */
    private canRotate = false;

    /**
     * 销毁动态图集资源
     * @description 释放所有缓存的SpriteFrame、材质和图集资源
     * @example
     * // 关闭UI面板时调用
     * onClose() {
     *     this.dynamicAtlas.destroy();
     * }
     */
    destroy() {
        // 销毁所有缓存的SpriteFrame
        for (const key in this.spriteFrameMap) {
            (this.spriteFrameMap[key] as SpriteFrame).destroy();
        }

        // 释放材质和图集资源
        this._customMaterial?.destroy();
        this._customMaterial = null;
        this.atlas?.destroy();
        this.atlas = null;
    }

    /**
     * 获取合图生成的纹理
     * @readonly
     * @example
     * // 获取纹理尺寸
     * const textureSize = dynamicAtlas.spriteTexture.getContentSize();
     */
    public get spriteTexture() {
        return this.atlas._texture;
    }

    /**
     * 创建动态合图SpriteFrame
     * @param uuid 唯一标识符 
     * @param packedFrame 打包后的帧数据（包含坐标、尺寸、旋转等信息）
     * @returns 新创建的SpriteFrame实例
     * @example
     * // 创建100x50的旋转子图:
     * createSpriteFrame('bullet_01', {
     *   x: 10, y: 20, w: 100, h: 50,
     *   rotate: true, texture: atlasTexture
     * });
     */
    private createSpriteFrame(uuid: string, packedFrame: PackedFrameData): SpriteFrame {
        let spriteFrame = new SpriteFrame();
        spriteFrame._uuid = uuid;
        spriteFrame.originalSize = size(10, 10); // 原始尺寸占位值，实际尺寸由rect决定
        spriteFrame.texture = packedFrame.texture; // 设置合图纹理
        spriteFrame.rotated = packedFrame.rotate;  // 记录旋转状态
        spriteFrame.rect = rect(packedFrame.x, packedFrame.y, packedFrame.w, packedFrame.h); // 设置纹理区域
        this.spriteFrameMap[uuid] = spriteFrame; // 缓存SpriteFrame
        return spriteFrame;
    }

    /**
     * 获取缓存的SpriteFrame实例
     * @param uuid 要获取的SpriteFrame唯一标识
     * @returns 已存在的SpriteFrame实例或新建实例
     * @example
     * // 获取或创建UI图标实例:
     * const frame = getSpriteFrameInstance('ui/icon_skill');
     * if (frame) sprite.spriteFrame = frame;
     */
    public getSpriteFrameInstance(uuid: string): SpriteFrame | null {
        if (!this.isWork) return null;
        let spriteFrame: SpriteFrame = this.spriteFrameMap[uuid];
        if (spriteFrame) return spriteFrame; // 返回缓存实例
        let packedFrame = this.getPackedFrame(uuid);
        if (!packedFrame) return null;
        return this.createSpriteFrame(uuid, packedFrame); // 创建新实例
    }

    /**
     * 将SpriteFrame打包到动态图集
     * @param spriteFrame 要打包的原始SpriteFrame
     * @param canRotate 是否允许旋转以优化空间
     * @returns 打包后的SpriteFrame实例
     * @example
     * // 打包角色头像并允许旋转:
     * const packedAvatar = packSpriteFrame(avatarFrame, true);
     * avatarComponent.spriteFrame = packedAvatar;
     */
    public packSpriteFrame(spriteFrame: SpriteFrame, canRotate = true): SpriteFrame {
        if (!this.isWork || !spriteFrame) return null;
        let uuid = spriteFrame._uuid;
        if (!this.insertSpriteFrame(spriteFrame, this.canRotate && canRotate)) return null; // 插入图集
        return this.getSpriteFrameInstance(uuid); // 获取打包后的实例
    }

    /**
     * 获取已打包的帧数据
     * @param uuid 要查询的SpriteFrame唯一标识
     * @returns 打包后的位置尺寸等数据
     * @example
     * // 获取子弹图标的打包信息:
     * const bulletData = getPackedFrame('bullet_01');
     * console.log(`位置:${bulletData.x},${bulletData.y} 尺寸:${bulletData.w}x${bulletData.h}`);
     */
    public getPackedFrame(uuid: string): PackedFrameData | null {
        if (!this.isWork) return null;
        // this.initAtlas(); // 需要时初始化图集
        return this.atlas.getPackedFrame(uuid); // 从图集管理器获取数据
    }

    /**
     * 将整个Sprite图集打包到动态图集中
     * @param atlas 要合并的Sprite图集
     * @example
     * // 合并UI图集到动态图集:
     * const uiAtlas = resources.get('ui/atlas', SpriteAtlas);
     * dynamicAtlas.packAtlasToDynamicAtlas(uiAtlas);
     * // 合并后所有子SpriteFrame将使用动态图集坐标
     */
    public packAtlasToDynamicAtlas(atlas: SpriteAtlas) {
        if (!this.isWork) return;
        let frames = atlas.getSpriteFrames();
        // 如果已经是动态图集则跳过
        if (frames[0].original) return;
        // 获取原始纹理并绘制到动态图集
        let texture = frames[0].texture as Texture2D;
        const p = this.atlas.drawTexture(texture);
        if (p) {
            let frame: SpriteFrame;
            let offset: Vec2;
            // 更新所有子SpriteFrame的坐标偏移
            for (let i = 0, n = frames.length; i < n; i++) {
                frame = frames[i];
                offset = frame.rect.origin;
                frame._setDynamicAtlasFrame({
                    x: p.x + offset.x,  // 计算在动态图集中的实际X坐标
                    y: p.y + offset.y,  // 计算在动态图集中的实际Y坐标
                    texture: p.texture  // 指向动态图集纹理
                });
            }
        }
    }

    /**
     * 将单个SpriteFrame打包到动态图集
     * @param comp 需要更新材质的UI组件
     * @param frame 要打包的SpriteFrame
     * @param canRotate 是否允许旋转以优化空间
     * @param onFail 打包失败时的回调
     * @example
     * // 打包按钮精灵帧并更新组件:
     * const btnComp = this.getComponent(Button);
     * dynamicAtlas.packToDynamicAtlas(btnComp, btnSpriteFrame, true, () => {
     *     console.warn('打包失败，使用原图');
     * });
     */
    public packToDynamicAtlas(comp: UIRenderer, frame: SpriteFrame, canRotate: boolean, onFail?: () => void) {
        // 标签组件和系统未启用时直接返回
        if (!this.isWork || comp instanceof Label) {
            onFail?.();
            return;
        }

        // 检查是否已经是动态图集纹理
        if (frame && frame.original && frame.texture._uuid == this.atlas?._texture._uuid) {
            onFail?.();
            return;
        }

        // 有效尺寸检查
        if (frame && frame.texture && frame.texture.width > 0 && frame.texture.height > 0) {
            // 将SpriteFrame插入图集
            const packedFrame = this.insertSpriteFrame(frame, this.canRotate && canRotate);
            if (packedFrame)
                this.setPackedFrame(comp, frame, packedFrame);  // 更新组件材质
            else onFail?.();
        }
    }

    /**
     * 将Canvas内容打包到动态图集
     * @param comp 需要更新的UI组件
     * @param uuid 生成的SpriteFrame唯一标识
     * @param canvas 要绘制的HTMLCanvas元素
     * @param onFail 绘制失败回调
     * @example
     * // 动态生成验证码并打包:
     * const canvas = document.createElement('canvas');
     * drawCaptcha(canvas); // 自定义绘制逻辑
     * dynamicAtlas.packCanvasToDynamicAtlas(labelComp, 'captcha', canvas);
     */
    public packCanvasToDynamicAtlas(comp: UIRenderer, uuid: string, canvas: HTMLCanvasElement, onFail?: () => void) {
        if (!this.isWork) {
            onFail?.();
            return;
        }
        // 将Canvas内容绘制到动态图集
        const p = this.atlas.drawCanvas(canvas, uuid);
        if (p) {
            // 使用指定UUID创建新的SpriteFrame
            this.setPackedFrame(comp, null, p, uuid);
        } else onFail?.();
    }

    /**
     * 将位图字体精灵帧打包到动态图集
     * @param bf 需要处理的位图字体对象
     * @param canRotate 是否允许旋转贴图以优化空间（可选，默认使用类实例的canRotate配置）
     * @param onSuccess 打包成功回调，返回新的位图字体对象（包含优化后的精灵帧）
     * @param onFail 打包失败回调
     * @example
     * // 加载位图字体后优化处理：
     * const bmFont = resources.get('font/num') as BitmapFont;
     * dynamicAtlas.packBitmapFontSpriteFrameToDynamicAtlas(
     *   bmFont,
     *   true,
     *   (newFont) => {
     *     label.font = newFont; // 使用优化后的字体
     *   },
     *   () => console.error('字体打包失败')
     * );
     */
    public packBitmapFontSpriteFrameToDynamicAtlas(bf: BitmapFont, canRotate?: boolean, onSuccess?: (bf: BitmapFont) => void, onFail?: () => void) {
        // 检查动态图集是否启用
        if (!this.isWork) {
            onFail?.();
            return;
        }
        const frame = bf.spriteFrame;
        // 验证精灵帧是否已存在于当前图集
        if (frame && frame.original && frame.texture._uuid == this.atlas?._texture._uuid) {
            onFail?.();
            return;
        }

        // 尝试将精灵帧插入图集
        const packedFrame = this.insertSpriteFrame(frame, this.canRotate && canRotate);
        if (packedFrame) {
            // 克隆原始精灵帧并更新图集参数
            let ff = frame.clone();
            ff._uuid = frame._uuid;
            ff.rotated = packedFrame.rotate;
            ff._setDynamicAtlasFrame(packedFrame);
            no.setValueSafely(this.spriteFrameMap, { [frame._uuid]: ff });

            // 创建新的位图字体实例保留原配置
            let font = new BitmapFont();
            font.name = bf.name;
            font.fntConfig = bf.fntConfig;
            font.fontDefDictionary = bf.fontDefDictionary;
            font.fontSize = bf.fontSize;
            font.spriteFrame = ff;
            onSuccess?.(font);
        } else onFail?.();
    }

    /**
     * 从动态图集中移除指定精灵帧
     * @param frame 需要移除的精灵帧
     * @example
     * // 当不再需要某个UI元素时释放资源：
     * const oldFrame = sprite.spriteFrame;
     * dynamicAtlas.removeFromDynamicAtlas(oldFrame);
     * oldFrame.destroy(); // 彻底销毁资源
     */
    public removeFromDynamicAtlas(frame: SpriteFrame): void {
        if (!this.isWork || !this.atlas || !frame) return;
        // 清除图集中的纹理数据
        this.atlas.clearTexture(frame);
        // 重置精灵帧的图集引用
        frame._resetDynamicAtlasFrame();
    }

    /**
     * 设置组件使用的打包后帧数据
     * @param comp 需要更新的UI渲染组件（Label/Sprite）
     * @param frame 原始精灵帧
     * @param packedFrame 打包后的帧数据（包含坐标、旋转等信息）
     * @param _uuid 可选自定义唯一标识符
     * @example
     * // 更新Label组件使用动态图集：
     * const packedData = atlas.getPackedFrame('font_01');
     * setPackedFrame(labelComp, originalFrame, packedData);
     * 
     * // 更新Sprite组件使用动态图集：
     * setPackedFrame(spriteComp, null, packedData, 'custom_sprite_01');
     */
    private setPackedFrame(comp: UIRenderer, frame: SpriteFrame, packedFrame: PackedFrameData, _uuid?: string) {
        if (!this.spriteFrameMap) return;

        if (packedFrame) {
            const uuid = _uuid || frame?._uuid; // 优先使用自定义UUID

            // 处理Label组件
            if (comp instanceof Label) {
                // 确保使用自定义材质
                if (!comp.customMaterial)
                    comp.customMaterial = this.customMaterial;

                // 位图字体处理分支
                if (comp.font instanceof BitmapFont) {
                    // 克隆原始帧并应用动态图集参数
                    let ff = frame.clone();
                    ff.rotated = packedFrame.rotate;
                    ff._setDynamicAtlasFrame(packedFrame);

                    // 更新字体使用的精灵帧
                    (comp.font as BitmapFont).spriteFrame = ff;

                    // 触发渲染数据更新
                    comp.markForUpdateRenderData(true);
                    comp['_assembler'].updateRenderData(comp);

                    // 强制合并批次优化渲染
                    director.root.batcher2D.forceMergeBatches(comp.customMaterial, ff, comp);

                    // 缓存新生成的精灵帧
                    no.setValueSafely(this.spriteFrameMap, { [uuid]: ff });
                }
                // 系统字体处理分支
                else {
                    // 直接修改原始帧参数
                    frame.rotated = packedFrame.rotate;
                    frame._setDynamicAtlasFrame(packedFrame);

                    // 获取渲染数据并更新UV坐标
                    const renderData = comp['_renderData'];
                    const vData = renderData.chunk.vb;
                    const uv = comp['_ttfSpriteFrame'].uv;

                    // 手动更新顶点缓冲区的UV数据
                    vData[3] = uv[0];   // 左下U
                    vData[4] = uv[1];   // 左下V
                    vData[12] = uv[2];  // 右下U
                    vData[13] = uv[3];  // 右下V 
                    vData[21] = uv[4];  // 右上U
                    vData[22] = uv[5];  // 右上V
                    vData[30] = uv[6];  // 左上U
                    vData[31] = uv[7];  // 左上V

                    // 标记纹理数据变更并更新渲染
                    renderData.textureDirty = true;
                    comp.markForUpdateRenderData(false);
                    renderData.updateRenderData(comp, comp['_ttfSpriteFrame']);

                    // 合并批次并缓存精灵帧
                    director.root.batcher2D.forceMergeBatches(comp.customMaterial, frame, comp);
                    no.setValueSafely(this.spriteFrameMap, { [uuid]: frame });
                }
            }
            // 处理Sprite组件
            else if (comp instanceof Sprite) {
                // 创建或克隆精灵帧
                let ff = frame?.clone() || new SpriteFrame();
                ff._uuid = uuid;
                ff.rotated = packedFrame.rotate;

                // 设置默认尺寸（当原始尺寸无效时）
                if (!ff.rect.width || !ff.rect.height) {
                    ff.rect = rect(0, 0, packedFrame.w, packedFrame.h);
                }

                // 应用动态图集参数并更新组件
                ff._setDynamicAtlasFrame(packedFrame);
                comp.spriteFrame = ff;

                // 缓存新生成的精灵帧
                no.setValueSafely(this.spriteFrameMap, { [uuid]: ff });
            }
        }
    }

    /**
     * 将精灵帧插入动态图集
     * @param spriteFrame 需要插入的精灵帧
     * @param canRotate 是否允许旋转精灵帧以优化空间布局（默认false）
     * @returns 返回打包后的帧数据，若插入失败返回null
     * @example
     * // 插入角色纹理并允许旋转:
     * const characterFrame = this.getComponent(Sprite).spriteFrame;
     * const packedData = dynamicAtlas.insertSpriteFrame(characterFrame, true);
     * if (!packedData) console.warn('插入图集失败');
     */
    public insertSpriteFrame(spriteFrame: SpriteFrame, canRotate = false) {
        // 有效性检查：空帧或已经是当前图集纹理时直接返回
        if (!spriteFrame || spriteFrame.texture._uuid == this.atlas?._texture._uuid) return null;

        // 像素游戏特殊处理（已注释的采样器过滤逻辑）
        // const sampler = spriteFrame.texture.getSamplerInfo();
        // if (sampler.minFilter !== 2 || sampler.magFilter !== 2 || sampler.mipFilter !== 0) {
        //     return null;
        // }

        // 延迟初始化逻辑（已注释）
        // this.initAtlas();

        // 调用图集管理器插入帧数据，包含空间不足回调
        const frame = this.atlas.insertSpriteFrame(spriteFrame, this.canRotate && canRotate, () => {
            no.err(`${this.atlas.uuid}动态图集无空间！`);
        });
        return frame;
    }

    /**
     * 获取动态图集是否生效
     * @description 生效条件：
     * 1. 非iOS微信环境
     * 2. 原生动态合图未启用
     * 3. 非编辑器模式
     * @returns 当前是否处于工作状态
     * @example
     * // 在更新前检查图集是否可用:
     * if (dynamicAtlas.isWork) {
     *     this.updateCharacterTexture();
     * }
     */
    public get isWork(): boolean {
        // iOS微信环境特殊处理
        if (no.notUseDynamicAtlas) return false;
        // 系统动态合图未启用且非编辑器模式
        let a = !dynamicAtlasManager.enabled && !EDITOR;
        return a;
    }

    /**
     * 创建并设置采样器2D精灵帧
     * @param sprite 目标精灵组件
     * @param spriteFrame 精灵帧数据（包含尺寸/UV等）
     * @param name 缓存名称（用于后续获取）
     * @example
     * // 从配置文件创建精灵帧:
     * const config = loadConfig('bullet_01');
     * dynamicAtlas.setSpriteFrameInSample2D(bulletSprite, config.frameData, 'bullet');
     */
    public setSpriteFrameInSample2D(sprite: Sprite, spriteFrame: SpriteFrameDataType, name: string) {
        const sf = this.createSpriteFrameInSample2D(spriteFrame);
        sprite.spriteFrame = sf;
        // 强制更新渲染器数据
        sprite['_assembler']?.updateRenderData(sprite);
        this.spriteFrameMap[name] = sf;
    }

    /**
     * 设置缓存的采样器2D精灵帧
     * @param sprite 目标精灵组件
     * @param name 缓存时使用的名称
     * @returns 是否设置成功
     * @example
     * // 重用已缓存的按钮图标:
     * if (!dynamicAtlas.setCachedSpriteFrameInSample2D(btnSprite, 'icon_home')) {
     *     this.loadNewIcon('icon_home');
     * }
     */
    public setCachedSpriteFrameInSample2D(sprite: Sprite, name: string): boolean {
        const sf = this.spriteFrameMap[name];
        if (sf) {
            sprite.spriteFrame = sf;
            sprite['_assembler']?.updateRenderData(sprite);
            return true;
        }
        return false;
    }

    /**
     * 创建采样器2D精灵帧
     * @param spriteFrame 精灵帧数据对象，包含以下属性：
     * - uuid: 唯一标识符
     * - originalSize: [width, height] 原始尺寸
     * - rect: [x, y, width, height] 纹理区域
     * - uv: [u0, v0, u1, v1, u2, v2, u3, v3] UV坐标数组
     * - rotated: 是否旋转
     * - textureSize: [width, height] 纹理尺寸
     * - uvSliced: 九宫格切片UV数据（可选）
     * - capInsets: 九宫格边距 [left, right, top, bottom]（可选）
     * @returns 新创建的SpriteFrame实例
     * @example
     * // 创建按钮图标的精灵帧：
     * createSpriteFrameInSample2D({
     *   uuid: 'btn_icon',
     *   originalSize: [100, 50],
     *   rect: [10, 20, 80, 40],
     *   uv: [0.1,0.1,0.9,0.1,0.9,0.9,0.1,0.9],
     *   rotated: false,
     *   textureSize: [1024, 1024],
     *   uvSliced: [...], // 九宫格切片数据
     *   capInsets: [10,10,10,10]
     * });
     */
    private createSpriteFrameInSample2D(spriteFrame: SpriteFrameDataType): SpriteFrame {
        let newSpriteFrame: SpriteFrame = new SpriteFrame();
        // 设置唯一标识（通过非标准方式设置内部属性）
        newSpriteFrame['_uuid'] = spriteFrame.uuid;
        // 使用动态图集的共享纹理
        newSpriteFrame.texture = this.spriteTexture;
        // 设置原始尺寸（逻辑尺寸）
        newSpriteFrame.originalSize = size(spriteFrame.originalSize[0], spriteFrame.originalSize[1]);
        // 设置纹理区域（实际像素坐标）
        newSpriteFrame.rect = rect(spriteFrame.rect[0], spriteFrame.rect[1], spriteFrame.rect[2], spriteFrame.rect[3]);
        // 设置UV坐标（纹理采样坐标）
        newSpriteFrame.uv = spriteFrame.uv;
        // 设置旋转标记（影响渲染时的顶点顺序）
        newSpriteFrame['_rotated'] = spriteFrame.rotated;
        // 记录实际纹理尺寸（用于后续计算）
        newSpriteFrame['_w'] = spriteFrame.textureSize[0];
        newSpriteFrame['_h'] = spriteFrame.textureSize[1];

        // 处理九宫格切片数据
        if (spriteFrame.uvSliced) {
            // 使用传入的切片UV数据
            newSpriteFrame.uvSliced = spriteFrame.uvSliced;
            // 设置九宫格边距（默认四边为0）
            newSpriteFrame['_capInsets'] = spriteFrame.capInsets || [0, 0, 0, 0];
        } else {
            // 生成默认的切片UV数据（非九宫格模式）
            newSpriteFrame.uvSliced = this.defaultUVSliced(spriteFrame.uv, false);
            newSpriteFrame['_capInsets'] = [0, 0, 0, 0];
        }
        return newSpriteFrame;
    }

    /**
     * 生成默认的切片UV数据
     * @param uv 原始UV坐标数组 [u0, v0, u1, v1, u2, v2, u3, v3]
     * @param rotated 是否旋转标记
     * @returns 16个顶点UV数据的数组，结构为：
     * [
     *   // 左上角
     *   {u, v}, {u, v}, // 左上-左上
     *   {u, v}, {u, v}, // 左上-右上
     *   // 右上角
     *   {u, v}, {u, v}, // 右上-左上
     *   {u, v}, {u, v}, // 右上-右上
     *   // 左下角
     *   {u, v}, {u, v}, // 左下-左上
     *   {u, v}, {u, v}, // 左下-右上
     *   // 右下角
     *   {u, v}, {u, v}, // 右下-左上
     *   {u, v}, {u, v}  // 右下-右上
     * ]
     * @example
     * // 生成100x50非旋转精灵的默认UV切片：
     * defaultUVSliced([0,0,1,0,1,1,0,1], false);
     */
    private defaultUVSliced(uv: number[], rotated: boolean) {
        if (!rotated) {
            // 非旋转模式UV布局（标准矩形）
            return [
                { u: uv[0], v: uv[1] }, { u: uv[0], v: uv[1] },  // 左上-左上
                { u: uv[2], v: uv[3] }, { u: uv[2], v: uv[3] },  // 左上-右上
                { u: uv[0], v: uv[1] }, { u: uv[0], v: uv[1] },  // 右上-左上
                { u: uv[2], v: uv[3] }, { u: uv[2], v: uv[3] },  // 右上-右上
                { u: uv[4], v: uv[5] }, { u: uv[4], v: uv[5] },  // 左下-左上
                { u: uv[6], v: uv[7] }, { u: uv[6], v: uv[7] },  // 左下-右上
                { u: uv[4], v: uv[5] }, { u: uv[4], v: uv[5] },  // 右下-左上
                { u: uv[6], v: uv[7] }, { u: uv[6], v: uv[7] }   // 右下-右上
            ];
        } else {
            // 旋转90度模式UV布局
            return [
                { u: uv[4], v: uv[5] }, { u: uv[4], v: uv[5] },  // 左上-左下
                { u: uv[0], v: uv[1] }, { u: uv[0], v: uv[1] },  // 左上-左上
                { u: uv[4], v: uv[5] }, { u: uv[4], v: uv[5] },  // 右上-左下
                { u: uv[0], v: uv[1] }, { u: uv[0], v: uv[1] },  // 右上-左上
                { u: uv[6], v: uv[7] }, { u: uv[6], v: uv[7] },  // 左下-右下
                { u: uv[2], v: uv[3] }, { u: uv[2], v: uv[3] },  // 左下-右上
                { u: uv[6], v: uv[7] }, { u: uv[6], v: uv[7] },  // 右下-右下
                { u: uv[2], v: uv[3] }, { u: uv[2], v: uv[3] }   // 右下-右上
            ];
        }
    }

    /**
     * 设置动态图集到节点及其子组件
     * @param node 目标节点
     * @param dynamicAtlas 动态图集实例
     * @example
     * // 将动态图集应用到整个UI面板：
     * YJDynamicAtlas.setDynamicAtlas(uiPanel, dynamicAtlas);
     * // 影响的组件包括：
     * // - YJCreateNode: 动态节点创建器
     * // - YJLanguageSprite: 多语言精灵
     * // - YJCharLabel: 字符标签
     * // - YJBitmapFont: 位图字体
     * // 等其他需要动态图集的组件
     */
    // public static setDynamicAtlas(node: Node, dynamicAtlas: YJDynamicAtlas): void {
    //     // 收集所有需要动态图集的组件类型
    //     let bs = [].concat(
    //         node.getComponentsInChildren('YJCreateNode'),      // 动态节点创建器
    //         node.getComponentsInChildren('SetSpriteFrameInSampler2D'), // 采样器设置组件
    //         node.getComponentsInChildren('YJLanguageSprite'),  // 多语言精灵组件
    //         node.getComponentsInChildren('SetCreateCacheNode'),// 缓存节点创建器
    //         node.getComponentsInChildren('SetCreateNode'),     // 通用节点创建器
    //         node.getComponentsInChildren('SetCreateNodeByUrl'),// URL节点创建器 
    //         node.getComponentsInChildren('SetList'),           // 列表组件
    //         node.getComponentsInChildren('SetPage'),           // 分页组件
    //         node.getComponentsInChildren('YJCharLabel'),       // 字符标签组件
    //         node.getComponentsInChildren('YJBitmapFont')       // 位图字体组件
    //     );

    //     // 遍历所有组件并设置动态图集引用
    //     for (let i = 0; i < bs.length; i++) {
    //         if (!bs[i].dynamicAtlas) {
    //             bs[i].dynamicAtlas = dynamicAtlas;
    //         }
    //     }

    //     // 保留的材质设置逻辑（当前已注释）
    //     // let r: UIRenderer[] = [].concat(node.getComponentsInChildren(Sprite));
    //     // r.forEach(rr => {
    //     //     if (!rr.customMaterial) {
    //     //         rr.customMaterial = dynamicAtlas.customMaterial;
    //     //     }
    //     // });
    // }
}
