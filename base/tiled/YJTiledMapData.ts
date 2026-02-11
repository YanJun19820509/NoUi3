
import { Size, v2, Vec2 } from '../../yj';
import { no } from '../../no';
import { arrayUtils } from '../../extend/arrayUtils';

/**
 * Predefined variables
 * Name = YJTiledMapData
 * DateTime = Fri Jan 14 2022 17:33:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTiledMapData.ts
 * FileBasenameNoExtension = YJTiledMapData
 * URL = db://assets/Script/common/base/tiled/YJTiledMapData.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * 瓦片地图数据类
 * @desc 
 * - 负责解析TiledMap的JSON数据
 * - 提供地图大小、单元格大小、锚点等基本信息
 * - 支持获取图层对象和瓦片信息
 * 
 * @example
 * // 创建瓦片地图数据实例
 * const tiledMapData = new YJTiledMapData(tiledMapJson);
 * 
 * // 获取图层对象
 * const layerObjects = tiledMapData.getLayerObjects('layerName');
 * 
 * // 获取瓦片信息
 * const tiles = tiledMapData.getTiles(layerData);
 */
export class YJTiledMapData {
    /** 
     * 地图尺寸（像素单位）
     * @desc 
     * - 根据地图方向(gridScale)和网格数量(uv)计算得出
     * - 正交地图：网格宽高直接相乘
     * - 六边形地图：特殊的高度计算公式
     * @example
     * // 正交地图 10x10 网格，32x32单元格：
     * // mapSize = 320x320
     * 
     * // 六边形地图 10x10 网格，64x64单元格：
     * // mapSize = (10+0.5)*64, (10-1)*64*0.75 + 64 = 672x640
     */
    public mapSize: Size;

    /** 
     * 单个网格单元尺寸（像素单位）
     * @example new Size(32, 32) 表示32x32像素的单元格
     */
    public tileSize: Size;

    /** 
     * 地图锚点位置（标准化坐标）
     * @desc 根据renderorder计算得出，影响地图坐标系原点位置
     * @example v2(0,1) 表示锚点在左上角
     */
    public anchor: Vec2;

    /** 
     * 图层数据存储结构
     * @desc 
     * - 使用Map结构按图层类型分类存储
     * - 键：图层类型字符串（如"terrain", "object"）
     * - 值：包含图层ID为键的对象字典
     * @example 
     * layers.get('terrain') = {
     *   1: [tile1, tile2...], // 图层ID为1的地形数据
     *   2: [tile1, tile2...]  // 图层ID为2的地形数据
     * }
     */
    private layers: Map<string, any>;

    /** 
     * 图集数据存储
     * @desc 
     * - 使用Map结构按全局图块ID(gid)存储
     * - 键：图块全局ID
     * - 值：包含图块元数据的对象
     * @example 
     * tilesets.get(1025) = {
     *   image: 'tree.png',
     *   width: 64,
     *   height: 64,
     *   prop: {collidable: true}
     * }
     */
    private tilesets: Map<number, any>;

    /** 网格数量（列数x行数） */
    private uv: Size;

    /** 
     * 网格缩放系数
     * @desc 根据地编方向计算得出：
     * - 正交地图: (1, 1)
     * - 六边形地图: (0.5, 0.75) 
     * - 斜角地图: (0.5, 0.5)
     */
    private gridScale: Vec2;

    /** 当前地图包含的图层类型列表 */
    public layerTypes: string[];

    constructor(mapJson: any) {
        // 根据地编方向计算网格缩放系数
        this.gridScale = mapJson.orientation == 'orthogonal' ? v2(1, 1)
            : (mapJson.orientation == 'hexagonal' ? v2(0.5, .75)
                : v2(.5, .5));

        // 初始化基础尺寸
        this.tileSize = new Size(mapJson.tilewidth, mapJson.tileheight);
        this.uv = new Size(mapJson.width, mapJson.height);

        // 计算地图总尺寸（像素单位）
        if (this.gridScale.y == 1 || this.gridScale.y == 0.5) {
            // 正交/斜角地图计算方式
            this.mapSize = new Size(
                this.uv.width * this.tileSize.width,
                this.uv.height * this.tileSize.height * this.gridScale.y
            );
        } else {
            // 六边形地图特殊计算方式
            this.mapSize = new Size(
                (this.uv.width + this.gridScale.x) * this.tileSize.width,
                (this.uv.height - 1) * this.tileSize.height * this.gridScale.y + this.tileSize.height
            );
        }

        // 初始化其他数据
        this.setAnchor(mapJson.renderorder);
        this.setTilesets(mapJson.tilesets);
        this.setLayers(mapJson.layers);
    }

    /**
     * 获取指定类型的图层对象数据
     * @param type 图层类型标识符 
     * @returns 图层数据数组 | null
     * @example
     * // 获取所有地形层数据
     * const terrainLayers = getLayerObjects('terrain');
     * // 返回结构: {1: [...], 2: [...]}
     */
    public getLayerObjects(type: string): any[] {
        return this.layers.has(type) ? this.layers.get(type) : null;
    }

    /**
     * 解析并存储图层数据
     * @param layers 原始图层数据数组
     * @desc 处理流程：
     * 1. 过滤不可见图层
     * 2. 提取图层自定义属性
     * 3. 解析图块数据或对象数据
     * 4. 按类型分类存储
     * @example
     * 输入: [{id:1, name:"地面", properties:[{name:"type",value:"terrain"}], data:[...]}]
     * 输出: layers.set('terrain', {1: [...]})
     */
    private setLayers(layers: any[]): void {
        this.layers = new Map<string, any>();
        this.layerTypes = [];
        let layer: any;
        let p: any;
        let objects: any[];
        let existing: any;
        for (let i = 0, len = layers.length; i < len; i++) {
            layer = layers[i];
            if (!layer.visible) continue;

            // 提取图层属性
            p = this.propertiesOf(layer);
            if (!p) continue;

            // 解析图层数据
            objects = layer.data ? this.getTiles(layer.data) : this.getObjects(layer.objects);

            // 按类型存储
            if (!this.layers.has(p.type)) {
                this.layers.set(p.type, { [layer.id]: objects });
            } else {
                existing = this.layers.get(p.type);
                existing[layer.id] = objects;
                this.layers.set(p.type, existing);
            }

            arrayUtils.addToArray(this.layerTypes, p.type);
        }
    }

    /**
     * 设置图块集数据
     * @param tilesets 图块集配置数组
     * @desc 
     * - 解析并存储所有图块集信息到Map中
     * - 每个图块集包含多个图块定义
     * - 图块键值计算方式：firstgid + tile.id
     * 
     * @example
     * // 输入示例：
     * [{
     *   firstgid: 1,
     *   tileoffset: {x: 0, y: 0},
     *   tiles: [{
     *     id: 0,
     *     image: "../images/tile.png",
     *     imagewidth: 32,
     *     imageheight: 32,
     *     properties: [{name: "walkable", value: true}]
     *   }]
     * }]
     * // 输出结构：
     * Map{
     *   1 => {
     *     image: "tile",
     *     width: 32,
     *     height: 32,
     *     offset: {x:0,y:0},
     *     prop: {walkable: true}
     *   }
     * }
     */
    private setTilesets(tilesets: any[]): void {
        this.tilesets = new Map<number, any>();
        let tileset: any;
        let firstgid: number;
        let offset: any;
        let tile: any;
        let imgpath: string[];
        let a: any;
        let prop: any;
        let p: any;
        // 遍历所有图块集
        for (let i = 0, len = tilesets.length; i < len; i++) {
            tileset = tilesets[i];
            firstgid = tileset.firstgid; // 当前图块集的起始全局ID
            offset = tileset.tileoffset || { x: 0, y: 0 }; // 图块偏移量

            // 处理图块集中的每个图块
            for (let j = 0, len1 = tileset.tiles.length; j < len1; j++) {
                tile = tileset.tiles[j];
                // 清理图片路径：移除相对路径和扩展名，保留纯文件名
                imgpath = tile.image.replace(new RegExp('\\.\\./|\\.png', 'g'), '').replace('\\', '/').split('/');

                // 构建图块信息对象
                a = {
                    image: imgpath.pop(),       // 图片文件名
                    width: tile.imagewidth,     // 图块宽度
                    height: tile.imageheight,   // 图块高度
                    offset: offset              // 图块偏移量
                };

                // 解析图块自定义属性
                if (tile.properties != null) {
                    prop = {};
                    for (let i = 0; i < tile.properties.length; i++) {
                        p = tile.properties[i];
                        prop[p.name] = p.value; // 属性名值对存储
                    }
                    a.prop = prop;
                }

                // 计算全局ID并存入Map
                this.tilesets.set(firstgid + tile.id, a);
            }
        }
    }

    /**
     * 提取对象属性
     * @param d 原始数据对象
     * @returns 属性对象 | null
     * @example
     * // 输入：
     * {properties: [{name: "type", value: "wall"}]}
     * // 输出：
     * {type: "wall"}
     */
    private propertiesOf(d: any): any {
        if (d.properties == null) return null;
        let a: any = new Object();
        let p: any;
        for (let i = 0; i < d.properties.length; i++) {
            p = d.properties[i];
            a[p.name] = p.value;
        }
        return a;
    }

    /**
     * 解析对象层数据
     * @param objects 对象数组
     * @returns 处理后的对象数组
     * @desc
     * - 转换坐标系：Tiled使用左上角坐标系，转换为游戏内的左下角坐标系
     * - 合并图块属性：当对象有gid时合并对应图块属性
     * 
     * @example
     * // 输入对象：
     * {x: 100, y: 200, gid: 1, properties: [{name: "name", value: "tree"}]}
     * // 输出结构：
     * {
     *   x: 100, 
     *   y: mapHeight - 200,
     *   name: "tree",
     *   image: "tile",
     *   width: 32,
     *   ...其他图块属性
     * }
     */
    private getObjects(objects: any[]): any[] {
        if (!objects) return [];
        let arr: any[] = [];
        let obj: any;
        let a: any;
        let tile: any;
        let p: any;
        for (let i = 0, len = objects.length; i < len; i++) {
            obj = objects[i];
            a = {
                x: obj.x,
                y: this.mapSize.height - obj.y, // 坐标系转换
            };

            // 添加对象自定义属性
            if (obj.properties != null)
                for (let i = 0; i < obj.properties.length; i++) {
                    p = obj.properties[i];
                    a[p.name] = p.value;
                }

            // 合并图块属性
            if (obj.gid != null && this.tilesets.has(obj.gid)) {
                tile = this.tilesets.get(obj.gid);
                no.forEach(tile, (key, value) => {
                    a[key] = value;
                    return false;
                })
            }
            arr.push(a);
        }
        return arr;
    }

    /**
     * 解析图块层数据
     * @param data 图块ID数组
     * @returns 图块信息数组
     * @desc
     * - 根据网格尺寸遍历所有图块位置
     * - 计算每个有效图块的世界坐标
     * - 坐标计算考虑网格缩放和偏移量
     * 
     * @example
     * // 当tileSize为32x32，gridScale为0.5时：
     * // 第2行第3列的图块坐标计算：
     * x = 32*(0.5 + 2 + (1-0.5)*(行号%2)) 
     * y = 32*((1-0.5) + 行号*0.5)
     */
    private getTiles(data: number[]): any[] {
        if (!data) return [];
        let arr: any[] = [];
        let id: number;
        let tileInfo: any;
        // 遍历网格的每个位置
        for (let i = 0; i < this.uv.height; i++) {    // 行循环
            for (let j = 0; j < this.uv.width; j++) { // 列循环
                id = data[i * this.uv.width + j];
                if (id == 0) continue; // 跳过空图块
                tileInfo = this.tilesets.get(id);
                if (!tileInfo) continue;

                // 计算图块世界坐标
                arr[arr.length] = {
                    image: tileInfo.image,
                    width: tileInfo.width,
                    height: tileInfo.height,
                    x: this.tileSize.width * (.5 + j + (1 - this.gridScale.x) * (i % 2)) + tileInfo.offset.x,
                    y: this.tileSize.height * ((1 - this.gridScale.y) + i * this.gridScale.y) + tileInfo.offset.y,
                    prop: tileInfo.prop
                };
            }
        }
        return arr;
    }

    /**
     * 设置地图锚点
     * @param renderorder 渲染方向字符串（格式：方向-垂直方向）
     * @desc
     * - 根据Tiled的渲染顺序设置锚点
     * - 支持left/right和up/down组合
     * - 锚点坐标系：左下(0,0) 右上(1,1)
     * 
     * @example
     * // renderorder为"left-up"时：
     * anchor = (1, 0) // 锚点在左上角
     * // renderorder为"right-down"时：
     * anchor = (0, 1) // 锚点在右下角
     */
    private setAnchor(renderorder: string): void {
        this.anchor = v2();
        let dir = renderorder.split('-');
        // 水平方向
        if (dir[0] == 'left') this.anchor.x = 1;   // 左对齐
        else if (dir[0] == 'right') this.anchor.x = 0; // 右对齐
        // 垂直方向
        if (dir[1] == 'up') this.anchor.y = 0;     // 上对齐
        else if (dir[1] == 'down') this.anchor.y = 1; // 下对齐
    }
}
