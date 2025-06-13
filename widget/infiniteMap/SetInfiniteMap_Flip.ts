import { YJDataWork } from "../../base/YJDataWork";
import { no } from "../../no";
import { HackUi } from "../../ui/HackUi";
import { ccclass, instantiate, property, v3, Vec3, view, Node } from "../../yj";

/**
 * 无限地图组件，用于实现地图的无限滚动效果，该组件适用于一张图左右翻转来实现无限连接
 */
@ccclass('SetInfiniteMap_Flip')
export class SetInfiniteMap_Flip extends HackUi {
    @property({ type: Node, displayName: '元素模板', tooltip: '元素模板内不需要SetPosition组件，也不需要添加设置坐标的逻辑，本组件内会主动按需要修改子元素的坐标' })
    template: Node = null;

    @property({ displayName: '是否水平翻转', tooltip: '如果为true，则水平翻转,否则垂直翻转' })
    isHorizontalFlip: boolean = true;

    @property({ displayName: '是否全屏' })
    isFullScreen: boolean = true;

    /**
     * 可见区域的网格行列数[列数,行数]
     * @description 根据视口尺寸和地砖尺寸计算得出，用于确定需要渲染的网格范围
     * @example 当视口为 1280x720，地砖尺寸为 64 时，计算结果为 [12, 8] 表示横向12列，纵向8行
     */
    private _gridColRow: number[] = [];

    /**
     * 地图数据集合，使用UV坐标作为键值
     * @key UV坐标字符串，格式："u_v"（如："3_5"）
     * @value 地砖信息对象，包含坐标、类型等自定义属性
     * @example 
     * new Map([
     *   ["2_3", {x: 2, y: 3, type: "grass"}],
     *   ["2_4", {x: 2, y: 4, type: "water"}]
     * ])
     */
    private _tileMap: Map<number, any> = new Map();

    /**
     * 单个地砖的尺寸（单位：像素）
     * @description 用于计算坐标转换和布局
     * @example 64 表示 64x64 像素的地砖
     */
    private _tileSize: number[];

    /**
     * 地砖节点映射表，用于快速查找指定坐标的节点
     * @key UV坐标字符串，格式同_tileMap
     * @value 对应的节点实例
     * @example 
     * 当需要获取(2,3)坐标的地砖节点时：
     * const node = this._tileNodeMap.get("2_3");
     */
    private _tileNodeMap: Map<string, Node> = new Map();

    /**
     * 临时三维向量，用于优化位置计算（避免频繁创建新对象）
     * @example 计算(3,5)坐标的位置：
     * this._tempV3.set(3 * tileSize, 5 * tileSize, 0);
     */
    private _tempV3: Vec3 = v3();

    /**
     * 延迟显示的节点队列，用于优化批量操作时的性能
     * @description 在完成所有位置计算后统一显示节点，避免中间态渲染
     * @example 当地图移动时，先将新节点加入此队列，移动结束后统一显示
     */
    private _lateShowNodes: Node[] = [];

    /**
     * 地砖节点对象池，用于复用已创建的地砖节点
     * @description 存储所有已创建的地砖节点，当地图移动时重复利用不可见区域的节点
     * @example 当地图向右移动时，左侧移出视口的节点会被回收并用于右侧新区域
     */
    private _tileNodes: Node[] = [];

    /**
     * 当前地图视口的中心位置（世界坐标）
     * @description 用于计算视口范围内的地砖坐标
     * @example v3(120, 80, 0) 表示视口中心位于世界坐标(120,80)的位置
     */
    private _curPos: Vec3;

    protected onDataChange(data: any) {
        const { tileSize, tileInfos, startPos, moveBy } = data;

        // 处理地砖尺寸变更（通常只在初始化时设置）
        if (tileSize) {
            const s = this.isFullScreen ? view.getVisibleSize() : no.size(this.node);
            // 计算可见区域网格行列数：横向列数 = 可见宽度/(tileSize*2) + 缓冲列
            // 例如：tileSize=64，屏幕宽1280 => 1280/(64*2)=10，+2缓冲 => 总12列
            this._gridColRow = [Math.ceil(s.width / tileSize[0] / 2) + Math.floor(s.width / tileSize[0]), Math.ceil(s.height / tileSize[1] / 2) + Math.floor(s.height / tileSize[1])];
            this._tileSize = tileSize;
            this.clearDataValue(`${this.bind_keys}.tileSize`);
        }

        // 全量地砖数据更新（通常用于地图初始化或重置）
        if (tileInfos) {
            // 清空现有数据
            this._tileNodeMap.clear();
            this._tileMap.clear();

            // 停用所有现有节点（后续会复用）
            for (let i = 0, n = this._tileNodes.length; i < n; i++) {
                const item = this._tileNodes[i];
                item['_activeInHierarchy'] = false; // 优化性能的隐藏方式
            }

            // 构建新的地砖数据映射表
            for (let i = 0, n = tileInfos.length; i < n; i++) {
                const tileInfo = tileInfos[i];
                this._tileMap.set(i, tileInfo);
            }
            this.clearDataValue(`${this.bind_keys}.tileInfos`);
        }

        // 初始位置设置（通常用于地图初始化或重置位置）
        if (startPos) {
            if (!this._curPos) this._curPos = v3(); // 初始化位置对象
            this._curPos.set(startPos[0], startPos[1], 0); // 设置Z轴为0（2D场景）
            no.position(this.node, this._curPos); // 应用节点位置
            this.setTiles(); // 触发地砖布局
            this.clearDataValue(`${this.bind_keys}.startPos`);
        }

        // 相对移动处理（适用于平滑滚动效果）
        if (moveBy) {
            if (!this._curPos) return;
            this._curPos.add3f(moveBy[0], moveBy[1], 0); // 累加偏移量
            no.position(this.node, this._curPos); // 更新节点位置
            this.setTiles(); // 重新计算可见地砖
            this.clearDataValue(`${this.bind_keys}.moveBy`);
        }
    }

    private getDataByUvKey(uvKey: string) {
        const uv = uvKey.split('_').map(Number);
        const xy = this.uvToXy(uv[0], uv[1]);
        const k = Math.abs(this.isHorizontalFlip ? uv[0] : uv[1]) % 2;
        const data = this._tileMap.get(k);
        return { ...data, x: xy[0], y: xy[1] };
    }

    /**
     * 设置地砖
     * 根据当前位置计算可见区域内的地砖,并创建或移动地砖节点
     */
    /**
     * 设置动态地图瓦片
     * @description 根据当前节点位置计算可见区域，创建或复用瓦片节点
     * 实现逻辑：
     * 1. 计算以当前位置为中心的可见区域UV坐标
     * 2. 首次运行创建所有可见瓦片节点
     * 3. 后续运行复用不可见区域节点到新位置（对象池模式）
     * 
     * @example 可见区域计算示例：
     * 当_gridColRow为[2,3]时，可见范围：
     * u方向：当前u-2 到 u+2
     * v方向：当前v-3 到 v+3
     * 共生成 (2*2+1)*(2*3+1) = 5*7=35 个UV坐标
     */
    private setTiles() {
        if (!this._gridColRow.length) return;

        // 获取节点位置并转换为世界坐标（取反处理）
        const pos = this.node.position;
        const x = -pos.x; // 转换为世界坐标系X
        const y = -pos.y; // 转换为世界坐标系Y
        const uv = this.xyToUv(x, y); // 计算中心点UV坐标
        const visibleUv: string[] = []; // 存储可见区域的UV键值

        // 生成可见区域UV坐标集合
        for (let i = -this._gridColRow[0]; i <= this._gridColRow[0]; i++) {
            for (let j = -this._gridColRow[1]; j <= this._gridColRow[1]; j++) {
                const u = uv[0] + i;  // 横向扩展网格
                const v = uv[1] + j;  // 纵向扩展网格
                visibleUv.push(`${u}_${v}`); // 生成UV键格式如"1_-2"
            }
        }

        // 首次创建流程
        if (this._tileNodeMap.size == 0) {
            for (let i = 0, n = visibleUv.length; i < n; i++) {
                const key = visibleUv[i];
                const data = this.getDataByUvKey(key);
                if (data) {
                    // 使用对象池获取或创建节点
                    let item = this._tileNodes[i] || instantiate(this.template);
                    if (!item.parent) {
                        item.parent = this.node;
                        no.visible(item, true);
                        this._tileNodes.push(item);
                    }

                    // 初始化节点数据
                    this._tileNodeMap.set(key, item);
                    const dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                    if (dataWork) {
                        dataWork.initWithData(data); // 示例数据格式：{x: 100, y: 200, type: 'grass'}
                    }

                    // 设置节点位置并标记延迟显示
                    this._tempV3.set(data.x, data.y, 0);
                    no.position(item, this._tempV3);
                    this._lateShowNodes.push(item);
                }
            }
        }
        // 节点复用流程
        else {
            const needMoveTileNode: Node[] = [];
            const entries = Array.from(this._tileNodeMap.entries());
            //遍历子节点，将不可见的节点加入到needMoveTileNode列表中
            for (let i = 0; i < entries.length; i++) {
                const [key, node] = entries[i];
                if (!visibleUv.includes(key)) {
                    needMoveTileNode.push(node);
                    this._tileNodeMap.delete(key);
                    node['_activeInHierarchy'] = false; // 标记节点为可复用状态
                }
            }
            //遍历可见区域，将needMoveTileNode中的节点移动到可见区域
            for (let i = 0, n = visibleUv.length; i < n; i++) {
                const key = visibleUv[i];
                if (this._tileNodeMap.has(key)) continue;
                const data = this.getDataByUvKey(key);
                if (data) {
                    // 优先使用回收的节点，没有则创建新节点
                    let item = needMoveTileNode.shift() || instantiate(this.template);
                    if (!item.parent) {
                        item.parent = this.node;
                        no.visible(item, true);
                        this._tileNodes.push(item);
                    }

                    // 更新节点数据和位置
                    this._tileNodeMap.set(key, item);
                    const dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                    if (dataWork) {
                        dataWork.initWithData(data);
                    }
                    this._tempV3.set(data.x, data.y, 0);
                    no.position(item, this._tempV3);
                    this._lateShowNodes.push(item); // 新节点需要延迟激活
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
        const u = Math.floor(x / this._tileSize[0]),
            v = Math.floor(y / this._tileSize[1]);
        return [u, v];
    }

    private uvToXy(u: number, v: number) {
        return [u * this._tileSize[0], v * this._tileSize[1]];
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

