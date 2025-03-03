import { DynamicAtlasTexture } from "NoUi3/engine/atlas";
import { FuckUi } from "NoUi3/fuckui/FuckUi";
import { no } from "NoUi3/no";
import { ccclass, property, Sprite, SpriteFrame, requireComponent, size, Vec2, v2, v3 } from "NoUi3/yj";

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
@requireComponent([Sprite])
export class SetFogOfWar extends FuckUi {
    @property({ displayName: '视野半径', tooltip: '相对于实际地图的半径范围' })
    visionRadius: number = 50;

    // 探索过区域的透明度 (0-1, 0为完全透明，1为完全不透明)
    @property({ range: [0, 1], displayName: '探索过区域透明度', tooltip: '探索过区域的透明度' })
    exploredAlpha: number = 0.5;

    // 移动超过此距离才更新迷雾（像素）
    @property({ displayName: '更新迷雾阈值', tooltip: '移动超过此距离才更新迷雾' })
    updateThreshold: number = 10;

    // 迷雾精灵
    private fogSprite: Sprite = null!;

    // 迷雾纹理
    private fogTexture: DynamicAtlasTexture = null!;

    // 纹理数据缓冲区
    private textureBuffer: Uint8Array = null!;

    // 地图缩放比例
    private mapScale: number = 1;

    // 地图宽度
    private _mapWidth: number = 0;
    
    // 地图高度
    private _mapHeight: number = 0;

    // 上一次更新迷雾的位置
    private _lastUpdatePos: Vec2;

    /**
     * 数据变更处理
     * @param data 包含迷雾系统的相关数据
     */
    protected onDataChange(data: any) {
        if (data.size) {
            this._createFogSystem(data.size);
            this.clearDataValue(`${this.bind_keys}.size`);
        }
        if (data.scale) {
            this.mapScale = data.scale;
            this.clearDataValue(`${this.bind_keys}.scale`);
        }
        if (data.pos) {
            if (!this._lastUpdatePos) {
                this._lastUpdatePos = new Vec2(data.pos[0] * this.mapScale, data.pos[1] * this.mapScale);
                this.updateFog();
            } else {
                const pos = v2(data.pos[0] * this.mapScale, data.pos[1] * this.mapScale);
                const distance = Vec2.distance(pos, this._lastUpdatePos);

                // 如果移动了足够的距离，更新迷雾
                if (distance >= this.updateThreshold) {
                    this._lastUpdatePos.set(pos);
                    this.updateFog();
                }
            }
        }
    }

    /**
     * 创建迷雾系统
     * @param mapSize 地图尺寸 [宽度, 高度]
     */
    private _createFogSystem(mapSize: number[]) {
        const [width, height] = mapSize;
        no.size(this.node, size(width, height));
        this._mapWidth = width;
        this._mapHeight = height;
        // 创建纹理缓冲区 (RGBA格式，每像素4字节)
        // 注意：这里直接使用地图尺寸作为纹理尺寸
        this.textureBuffer = new Uint8Array(width * height * 4);

        // console.log("创建迷雾纹理，尺寸:", width, "x", height);

        // 初始化缓冲区 (全黑不透明)
        for (let i = 0; i < width * height; i++) {
            // RGBA: 黑色不透明
            this.textureBuffer[i * 4] = 0;     // R
            this.textureBuffer[i * 4 + 1] = 0; // G
            this.textureBuffer[i * 4 + 2] = 0; // B
            this.textureBuffer[i * 4 + 3] = 255; // A (不透明)
        }

        // 创建纹理
        this.fogTexture = new DynamicAtlasTexture();
        this.fogTexture.initWithSize(width, height);
        this.fogTexture.uploadData(this.textureBuffer);

        // 添加精灵组件
        this.fogSprite = this.node.getComponent(Sprite);

        // 设置精灵使用迷雾纹理
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = this.fogTexture;
        this.fogSprite.spriteFrame = spriteFrame;
    }

    /**
     * 根据角色位置更新迷雾
     */
    public updateFog() {
        // 转换为纹理坐标
        const texturePos = this.xyToUv(this._lastUpdatePos.x, this._lastUpdatePos.y);
        const centerX = texturePos[0];
        const centerY = texturePos[1];

        // 增大视野范围以便于调试和观察效果
        const effectiveRadius = Math.floor(this.visionRadius * this.mapScale); // 临时放大视野半径便于观察

        // 计算视野范围的边界（优化：只更新视野范围内的像素）
        const startX = Math.max(0, centerX - effectiveRadius - 2);
        const endX = Math.min(this._mapWidth - 1, centerX + effectiveRadius + 2);
        const startY = Math.max(0, centerY - effectiveRadius - 2);
        const endY = Math.min(this._mapHeight - 1, centerY + effectiveRadius + 2);

        // console.log("更新迷雾区域:", startX, startY, endX, endY, "中心点:", centerX, centerY);

        // 在视野半径内更新迷雾
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                // 计算到中心的距离
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 计算像素索引
                const pixelIndex = (y * this._mapWidth + x) * 4;

                if (distance <= effectiveRadius) {
                    // 在视野范围内 - 完全透明
                    this.textureBuffer[pixelIndex + 3] = 0;
                } else if (distance <= effectiveRadius + 0) { // 增加过渡区域宽度
                    // 在边缘区域 - 半透明(已探索)
                    // 只有当前像素是完全不透明时才设置为半透明（避免覆盖已探索区域）
                    if (this.textureBuffer[pixelIndex + 3] > Math.floor(this.exploredAlpha * 255)) {
                        this.textureBuffer[pixelIndex + 3] = Math.floor(this.exploredAlpha * 255);
                    }
                }
                // 超出范围的不变
            }
        }

        // 更新纹理
        this._updateTexture();
    }

    /**
     * 更新迷雾纹理
     */
    private _updateTexture() {
        // 直接使用uploadData方法更新纹理
        if (this.fogTexture) {
            this.fogTexture.uploadData(this.textureBuffer);

            // 更新精灵渲染
            if (this.fogSprite) {
                this.fogSprite.updateRenderer();
            }
        }
    }

    /**
     * 将世界坐标转换为纹理坐标
     * @param x 世界坐标X
     * @param y 世界坐标Y
     * @returns 纹理坐标 [u, v]
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


