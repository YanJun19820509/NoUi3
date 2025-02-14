import { ccclass, property, view, Node, instantiate, v3, Vec3, ImageAsset, Vec2, v2, Mask, Sprite, Texture2D, size, SpriteFrame } from 'NoUi3/yj';
import { FuckUi } from 'NoUi3/fuckui/FuckUi';
import { no } from 'NoUi3/no';
import { YJDataWork } from 'NoUi3/base/YJDataWork';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Feb 13 2025 15:39:59 GMT+0800 (中国标准时间)
 * data:{
 *  tileSize?:number,//地砖尺寸
 *  startPos?:number[],//起始坐标
 *  tileInfos?:{x:number, y: number,...any}[],//地砖信息,必需有地砖坐标xy数据
 * }
 */

@ccclass('SetDynamicMap')
export class SetDynamicMap extends FuckUi {
    /**
     * 元素模板节点
     * 元素模板内不需要SetPosition组件，也不需要添加设置坐标的逻辑，本组件内会主动按需要修改子元素的坐标
     */
    @property({ type: Node, displayName: '元素模板', tooltip: '元素模板内不需要SetPosition组件，也不需要添加设置坐标的逻辑，本组件内会主动按需要修改子元素的坐标' })
    template: Node = null;
    /**
     * 可见区域的网格行列数[列数,行数]
     */
    private _gridColRow: number[] = [];
    /**
     * 地图数据,key为uv坐标字符串,value为地砖信息
     */
    private _tileMap: Map<string, any> = new Map();
    /**
     * 地砖尺寸
     */
    private _tileSize: number;
    /**
     * 地砖节点映射,key为uv坐标字符串,value为地砖节点
     */
    private _tileNodeMap: Map<string, Node> = new Map();
    /**
     * 临时向量,用于设置位置
     */
    private _tempV3: Vec3 = v3();
    /**
     * 延迟显示的节点列表
     */
    private _lateShowNodes: Node[] = [];

    /**
     * 组件加载时调用
     * 监听节点位置变化
     */
    onLoad() {
        super.onLoad();
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onChange, this);
    }

    /**
     * 组件销毁时调用
     * 移除节点位置变化监听
     */
    onDestroy() {
        this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onChange, this);
    }

    /**
     * 数据变化时调用
     * @param data 新的数据
     */
    protected onDataChange(data: any) {
        const { tileSize, tileInfos, startPos } = data;
        if (tileSize) {
            const s = view.getVisibleSize();
            //以tileSize为单元格长宽，计算可见区域需要格子的行列数
            this._gridColRow = [Math.ceil(s.width / tileSize / 2) + 1, Math.ceil(s.height / tileSize / 2) + 1];
            this._tileSize = tileSize;
        }
        if (tileInfos) {
            for (let i = 0, n = tileInfos.length; i < n; i++) {
                const tileInfo = tileInfos[i];
                const uv = this.xyToUv(tileInfo.x, tileInfo.y);
                this._tileMap.set(`${uv[0]}_${uv[1]}`, tileInfo);
            }
        }
        if (startPos) {
            no.position(this.node, v3(startPos[0], startPos[1]));
            this.setTiles();
        }
    }

    /**
     * 节点位置变化时调用
     * @param type 变化类型
     */
    private onChange(type: any) {
        if (type & Node.TransformBit.POSITION) {
            this.setTiles();
        }
    }

    /**
     * 设置地砖
     * 根据当前位置计算可见区域内的地砖,并创建或移动地砖节点
     */
    private setTiles() {
        const pos = this.node.position;
        //节点坐标与在屏幕中心显示的坐标相反
        const x = -pos.x;
        const y = -pos.y;
        const uv = this.xyToUv(x, y);
        const visibleUv: string[] = [];
        //以当前位置为中心，计算可见区域内的uv坐标
        for (let i = -this._gridColRow[0]; i <= this._gridColRow[0]; i++) {
            for (let j = -this._gridColRow[1]; j <= this._gridColRow[1]; j++) {
                const u = uv[0] + i;
                const v = uv[1] + j;
                visibleUv[visibleUv.length] = `${u}_${v}`;
            }
        }

        if (this._tileNodeMap.size == 0) {
            // 首次创建地砖
            for (let i = 0, n = visibleUv.length; i < n; i++) {
                const key = visibleUv[i];
                const data = this._tileMap.get(key);
                if (data) {
                    const item = instantiate(this.template);
                    this._tileNodeMap.set(key, item);
                    item.parent = this.node;
                    let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                    if (a) {
                        a.initWithData(data);
                    }
                    this._tempV3.set(data.x, data.y, 0);
                    no.position(item, this._tempV3);
                    no.visible(item, true);
                }
            }
        } else {
            // 复用已有地砖节点
            const needMoveTileNode: Node[] = [];
            const entries = Array.from(this._tileNodeMap.entries());
            //遍历子节点，将不可见的节点加入到needMoveTileNode列表中
            for (let i = 0; i < entries.length; i++) {
                const [key, node] = entries[i];
                if (!visibleUv.includes(key)) {
                    needMoveTileNode.push(node);
                    this._tileNodeMap.delete(key);
                    node['_activeInHierarchy'] = false;
                }
            }
            //遍历可见区域，将needMoveTileNode中的节点移动到可见区域
            for (let i = 0, n = visibleUv.length; i < n; i++) {
                const key = visibleUv[i];
                if (this._tileNodeMap.has(key)) continue;
                const data = this._tileMap.get(key);
                if (data) {
                    let item = needMoveTileNode.shift();
                    if (!item) {
                        item = instantiate(this.template);
                        item.parent = this.node;
                        no.visible(item, true);
                    } else {
                        this._lateShowNodes.push(item);
                    }
                    this._tileNodeMap.set(key, item);
                    let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                    if (a) {
                        a.initWithData(data);
                    }
                    this._tempV3.set(data.x, data.y, 0);
                    no.position(item, this._tempV3);
                }
            }
        }
    }

    /**
     * 世界坐标转UV坐标
     * 当格子数据为偶数时，x在[0,128)内u为0，x在[-128,0)内u为-1,可以直接用Math.floor来处理
     * 当格子数据为奇数时，x在(-64,64)内u为0，x在(-192,-64]内u为-1,不能直接用Math.floor来处理
     * @param x x坐标
     * @param y y坐标
     * @returns UV坐标数组[u,v]
     */
    private xyToUv(x: number, y: number) {
        const u = Math.floor(x / this._tileSize),
            v = Math.floor(y / this._tileSize);
        return [u, v];
    }

    /**
     * 每帧更新时调用
     * 处理延迟显示的节点
     * @param dt 帧间隔时间
     */
    protected lateUpdate(dt: number): void {
        if (this._lateShowNodes.length == 0) return;
        for (let i = 0, n = this._lateShowNodes.length; i < n; i++) {
            this._lateShowNodes[i]['_activeInHierarchy'] = true;
        }
        this._lateShowNodes.length = 0;
    }
}
