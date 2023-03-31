
import { Size, v2, Vec2 } from 'cc';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJTiledMapData
 * DateTime = Fri Jan 14 2022 17:33:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTiledMapData.ts
 * FileBasenameNoExtension = YJTiledMapData
 * URL = db://assets/Script/NoUi3/base/tiled/YJTiledMapData.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

export class YJTiledMapData {
    /**地图大小 */
    public mapSize: Size;
    /**单元格大小 */
    public tileSize: Size;
    /**地图锚点 */
    public anchor: Vec2;
    /**图层数据 */
    private layers: Map<string, any>;
    /**图集数据 */
    private tilesets: Map<number, any>;
    private uv: Size;
    private gridScale: number;

    public layerTypes: string[];

    constructor(mapJson: any) {
        this.gridScale = mapJson.orientation == 'orthogonal' ? 1 : 0.5;
        this.tileSize = new Size(mapJson.tilewidth, mapJson.tileheight);
        this.uv = new Size(mapJson.width, mapJson.height);
        this.mapSize = new Size(this.uv.width * this.tileSize.width, this.uv.height * this.tileSize.height * this.gridScale);
        this.setAnchor(mapJson.renderorder);
        this.setTilesets(mapJson.tilesets);
        this.setLayers(mapJson.layers);
    }

    /**
     * 获取图层中自定义对象
     * @param type
     * @returns
     */
    public getLayerObjects(type: string): any[] {
        if (this.layers.has(type))
            return this.layers.get(type);
        return null;
    }

    private setLayers(layers: any[]): void {
        this.layers = new Map<string, any>();
        this.layerTypes = [];
        for (let i = 0, len = layers.length; i < len; i++) {
            let layer = layers[i];
            if (!layer.visible) continue;
            let p = this.propertiesOf(layer);
            if (p == null) continue;
            let objects: any;
            if (layer.data) objects = this.getTiles(layer.data);
            else objects = this.getObjects(layer.objects);

            if (!this.layers.has(p.type))
                this.layers.set(p.type, { [layer.id]: objects });
            else {
                let a = this.layers.get(p.type);
                a[layer.id] = objects;
                this.layers.set(p.type, a);
            }
            no.addToArray(this.layerTypes, p.type);
        }
    }

    private setTilesets(tilesets: any[]): void {
        this.tilesets = new Map<number, any>();
        for (let i = 0, len = tilesets.length; i < len; i++) {
            let tileset = tilesets[i];
            let firstgid = tileset.firstgid;
            const offset = tileset.tileoffset || { x: 0, y: 0 };
            for (let j = 0, len1 = tileset.tiles.length; j < len1; j++) {
                let tile = tileset.tiles[j];
                const imgpath: string[] = tile.image.replace(new RegExp('\\.\\./|\\.png', 'g'), '').replace('\\', '/').split('/');
                let a = {
                    image: imgpath.pop(),
                    width: tile.imagewidth,
                    height: tile.imageheight,
                    offset: offset
                };
                if (tile.properties != null)
                    tile.properties.forEach((p: any) => {
                        a[p.name] = p.value;
                    });
                this.tilesets.set(firstgid + tile.id, a);
            }
        }
    }


    private propertiesOf(d: any): any {
        if (d.properties == null) return null;
        let a: any = new Object();
        d.properties.forEach((p: any) => {
            a[p.name] = p.value;
        });
        return a;
    }

    private getObjects(objects: any[]): any[] {
        if (!objects) return [];
        let arr: any[] = [];
        for (let i = 0, len = objects.length; i < len; i++) {
            let obj = objects[i];
            let a: any = {
                x: (1 - this.anchor.x * 2) * obj.x + this.anchor.x * this.mapSize.width,
                y: (1 - this.anchor.y * 2) * obj.y + this.anchor.y * this.mapSize.height,
            };
            if (obj.properties != null)
                obj.properties.forEach((p: any) => {
                    a[p.name] = p.value;
                });
            if (obj.gid != null && this.tilesets.has(obj.gid)) {
                let tile = this.tilesets.get(obj.gid);
                no.forEachKV(tile, (key, value) => {
                    a[key] = value;
                    return false;
                })
            }
            arr.push(a);
        }
        return arr;
    }

    private getTiles(data: number[]): any[] {
        if (!data) return [];
        let arr: any[] = [];
        for (let i = 0; i < this.uv.height; i++) {
            for (let j = 0; j < this.uv.width; j++) {
                const id = data[i * this.uv.width + j];
                if (id == 0) continue;
                let tileInfo = this.tilesets.get(id);
                if (!tileInfo) continue;
                arr[arr.length] = {
                    image: tileInfo.image,
                    x: this.tileSize.width * (0.5 + j + (1 - this.gridScale) * (i % 2)) + tileInfo.offset.x,
                    y: this.tileSize.height * (0.5 + i * this.gridScale) + tileInfo.offset.y
                };
            }
        }
        return arr;
    }

    private setAnchor(renderorder: string): void {
        this.anchor = v2();
        let dir = renderorder.split('-');
        if (dir[0] == 'left') this.anchor.x = 1;
        else if (dir[0] == 'right') this.anchor.x = 0;
        if (dir[1] == 'up') this.anchor.y = 0;
        else if (dir[1] == 'down') this.anchor.y = 1;
    }
}
