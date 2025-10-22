import { DynamicAtlasTexture } from "../../engine/atlas";
import { HackUi } from "../../ui/HackUi";
import { no } from "../../no";
import { ccclass, property, Sprite, SpriteFrame, requireComponent, size, Vec2, v2, v3 } from "../../yj";

/**
 * 迷雾效果
 * Author mqsy_yj
 * DateTime Sat Nov 16 2024 11:17:07 GMT+0800 (中国标准时间)
 * data:{
 * pos?:[x:number,y:number],//当前位置,这里是角色相对于地图的坐标
 * size?:[width:number,height:number],//迷雾大小
 * scale?: number, //迷雾相对于实际地图的缩放
 * }
 */
@ccclass('SetFogOfWar')
/**
 * 战争迷雾系统组件
 * @example
 * // 在属性面板设置：
 * // visionRadius: 80       // 视野半径80像素
 * // exploredAlpha: 0.3     // 已探索区域30%透明度
 * // updateThreshold: 15    // 移动15像素以上才更新
 * 
 * // 代码调用示例：
 * // 初始化迷雾系统（地图尺寸1000x800）
 * this.getComponent(SetFogOfWar).onDataChange({ size: [1000, 800] });
 * // 更新角色位置（世界坐标）
 * this.getComponent(SetFogOfWar).onDataChange({ pos: [x, y] });
 */
@requireComponent([Sprite])
export class SetFogOfWar extends HackUi {
    /** 可视范围半径（基于实际地图尺寸） */
    @property({ displayName: '视野半径', tooltip: '相对于实际地图的半径范围' })
    visionRadius: number = 50;

    /** 已探索区域的透明度（0完全透明 - 1不透明） */
    @property({ range: [0, 1], displayName: '探索过区域透明度', tooltip: '探索过区域的透明度' })
    exploredAlpha: number = 0.5;

    /** 位置更新阈值（减少频繁更新） */
    @property({ displayName: '更新迷雾阈值', tooltip: '移动超过此距离才更新迷雾,相对于实际地图' })
    updateThreshold: number = 10;

    /** 精度缩放系数（值越大迷雾边缘越平滑） */
    @property({ displayName: '精度缩放', tooltip: '精度缩放', min: 1 })
    accuracyScale: number = 2;

    // 以下为系统内部组件和参数
    private fogSprite: Sprite = null!;         // 渲染迷雾的精灵组件
    private fogTexture: DynamicAtlasTexture = null!; // 动态纹理对象
    private textureBuffer: Uint8Array = null!; // 纹理数据缓冲区（RGBA格式）
    private mapScale: number = 1;              // 地图缩放比例
    private _mapWidth: number = 0;             // 地图实际宽度（考虑精度缩放后）
    private _mapHeight: number = 0;            // 地图实际高度（考虑精度缩放后）
    private _lastUpdatePos: Vec2;              // 上次更新时的位置坐标

    onDestroy(): void {
        this.fogSprite?.spriteFrame?.destroy();
        this.fogTexture?.destroy();
        this.fogTexture = null;
        this.textureBuffer = null;
        this._lastUpdatePos = null;
        this.fogSprite = null;
        this._lastUpdatePos = null;
        this._mapWidth = 0;
        this._mapHeight = 0;
    }

    /**
     * 数据变更处理
     * @param data 包含以下可能参数：
     * - size: 地图原始尺寸 [width, height]
     * - scale: 地图缩放比例
     * - pos: 当前观察位置 [x, y]（世界坐标）
     * 
     * @example
     * // 同时更新地图尺寸和缩放比例
     * onDataChange({ 
     *   size: [1920, 1080],
     *   scale: 0.5,
     *   pos: [player.x, player.y]
     * });
     */
    protected onDataChange(data: any) {
        // 初始化迷雾系统（首次收到地图尺寸时创建）
        if (data.size) {
            this._createFogSystem(data.size);
            this.clearDataValue(`${this.bind_keys}.size`);
        }

        // 更新地图缩放比例
        if (data.scale) {
            this.mapScale = data.scale;
            this.clearDataValue(`${this.bind_keys}.scale`);
        }

        // 处理位置更新
        if (data.pos) {
            // 转换为纹理坐标系下的位置（考虑缩放和精度）
            const scaledPos = v2(
                data.pos[0] * this.mapScale * this.accuracyScale,
                data.pos[1] * this.mapScale * this.accuracyScale
            );

            // 首次更新直接设置位置
            if (!this._lastUpdatePos) {
                this._lastUpdatePos = new Vec2(scaledPos.x, scaledPos.y);
                this.updateFog();
            }
            // 后续更新检查移动距离
            else {
                const distance = Vec2.distance(scaledPos, this._lastUpdatePos);

                // 超过阈值时更新位置并刷新迷雾
                if (distance >= this.updateThreshold * this.mapScale * this.accuracyScale) {
                    this._lastUpdatePos.set(scaledPos);
                    this.updateFog();
                }
            }
        }
    }

    /**
     * 初始化迷雾系统
     * @param mapSize 地图原始尺寸 [width, height]
     * 
     * @description 创建流程：
     * 1. 计算实际纹理尺寸（原始尺寸 * 精度缩放）
     * 2. 创建RGBA缓冲区并初始化为不透明黑色
     * 3. 创建动态纹理并绑定到精灵组件
     * 4. 设置节点尺寸和缩放比例
     */
    private _createFogSystem(mapSize: number[]) {
        // 计算缩放后的地图尺寸
        const [baseWidth, baseHeight] = mapSize;
        this._mapWidth = baseWidth * this.accuracyScale;
        this._mapHeight = baseHeight * this.accuracyScale;

        // 设置节点尺寸和缩放
        no.size(this.node, size(this._mapWidth, this._mapHeight));
        no.scale(this.node, v3(1 / this.accuracyScale, 1 / this.accuracyScale, 1));

        // 初始化纹理缓冲区（每个像素4字节RGBA）
        this.textureBuffer = new Uint8Array(this._mapWidth * this._mapHeight * 4);

        // console.log("创建迷雾纹理，尺寸:", width, "x", height);

        // 初始化缓冲区 (全黑不透明)
        for (let i = 0, n = this._mapWidth * this._mapHeight; i < n; i++) {
            // RGBA: 黑色不透明
            this.textureBuffer[i * 4] = 0;     // R
            this.textureBuffer[i * 4 + 1] = 0; // G
            this.textureBuffer[i * 4 + 2] = 0; // B
            this.textureBuffer[i * 4 + 3] = 255; // A (不透明)
        }

        // 创建动态纹理
        this.fogTexture?.destroy();
        this.fogTexture = new DynamicAtlasTexture();
        this.fogTexture.initWithSize(this._mapWidth, this._mapHeight);
        this.fogTexture.uploadData(this.textureBuffer);

        // 配置精灵组件
        this.fogSprite = this.node.getComponent(Sprite);
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = this.fogTexture;
        this.fogSprite.spriteFrame = spriteFrame;
    }

    /**
     * 更新迷雾状态（根据当前位置）
     * 
     * @description 更新逻辑：
     * 1. 将世界坐标转换为纹理坐标
     * 2. 计算有效视野范围
     * 3. 遍历范围内每个像素：
     *    - 计算与中心的距离
     *    - 使用平滑函数计算透明度
     *    - 更新缓冲区中的Alpha值
     * 4. 更新纹理数据
     */
    public updateFog() {
        // 转换到纹理坐标系
        const [centerX, centerY] = this.xyToUv(this._lastUpdatePos.x, this._lastUpdatePos.y);

        // 计算实际有效半径（考虑缩放和精度）
        const effectiveRadius = Math.floor(this.visionRadius * this.mapScale * this.accuracyScale);
        const transitionWidth = 5 * this.accuracyScale; // 边缘过渡宽度

        // 计算更新区域边界（优化性能，只处理视野范围内像素）
        const startX = Math.max(0, centerX - effectiveRadius - 2);
        const endX = Math.min(this._mapWidth - 1, centerX + effectiveRadius + 2);
        const startY = Math.max(0, centerY - effectiveRadius - 2);
        const endY = Math.min(this._mapHeight - 1, centerY + effectiveRadius + 2);

        let dx: number;
        let dy: number;
        let distance: number;
        let pixelIndex: number;
        let smoothFactor: number;
        let newAlpha: number;
        // 遍历区域内的每个像素
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                // 计算像素到中心的距离
                dx = x - centerX;
                dy = y - centerY;
                distance = Math.sqrt(dx * dx + dy * dy);

                // 计算像素索引
                pixelIndex = (y * this._mapWidth + x) * 4;

                // 使用平滑函数计算过渡效果
                smoothFactor = no.smoothStep(distance, effectiveRadius, effectiveRadius + transitionWidth);

                // 根据距离设置透明度
                if (smoothFactor === 1) continue; // 完全在视野外

                if (smoothFactor === 0) {
                    this.textureBuffer[pixelIndex + 3] = 0; // 完全可见
                } else {
                    // 计算混合后的透明度（保留最低值）
                    newAlpha = Math.floor(this.exploredAlpha * 255 * smoothFactor);
                    if (this.textureBuffer[pixelIndex + 3] > newAlpha) {
                        this.textureBuffer[pixelIndex + 3] = newAlpha;
                    }
                }
            }
        }

        // 提交纹理更新
        this._updateTexture();
    }

    /**
     * 提交纹理数据更新
     */
    private _updateTexture() {
        if (this.fogTexture) {
            // 上传新数据到GPU
            this.fogTexture.uploadData(this.textureBuffer);

            // 强制刷新精灵渲染
            if (this.fogSprite) {
                this.fogSprite.markForUpdateRenderData();
            }
        }
    }

    /**
     * 坐标转换：世界坐标 -> 纹理坐标
     * @param x 世界X坐标
     * @param y 世界Y坐标
     * @returns [u, v] 纹理坐标
     * 
     * @description 转换规则：
     * 1. X轴：世界坐标 + 地图半宽 = 纹理X坐标
     * 2. Y轴：地图高度 - (世界坐标 + 地图半高) = 纹理Y坐标
     * 3. 坐标范围限制在[0, 地图尺寸-1]
     */
    private xyToUv(x: number, y: number) {
        // 计算相对于地图左下角的位置
        const relativeX = x + this._mapWidth / 2;
        // 注意：这里Y坐标需要翻转，因为纹理坐标系原点在左上角
        const relativeY = this._mapHeight - (y + this._mapHeight / 2);

        // 在等大纹理中，世界坐标可以直接映射到纹理坐标
        return [
            Math.max(0, Math.min(Math.floor(relativeX), this._mapWidth - 1)),
            Math.max(0, Math.min(Math.floor(relativeY), this._mapHeight - 1))
        ];
    }
}


