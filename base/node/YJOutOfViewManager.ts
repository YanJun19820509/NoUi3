import { ccclass, Component, property, size, Size, Node, Vec3, v3, instantiate } from "NoUi3/yj";
import { YJOutOfViewNode } from "./YJOutOfViewNode";
import { no } from "NoUi3/no";
import { YJFitScreen } from "../YJFitScreen";
import { YJDataWork } from "../YJDataWork";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Oct 30 2024 20:49:13 GMT+0800 (中国标准时间)
 * 超出视野管理器，不渲染超出视野的节点,根据屏幕大小分区管理，不适用于频繁创建销毁的节点
 */

@ccclass('YJOutOfViewManager')
export class YJOutOfViewManager extends Component {
    /** 每个分区的大小 */
    @property({ displayName: '分区大小' })
    areaSize: Size = size(400, 400);
    /** 分区节点模板,仅用于测试时查看分区分布 */
    @property({ type: Node })
    areaTemp: Node;

    /** 分区数据,key为分区坐标(row-col),value包含分区位置和子节点列表 */
    private _areas: { [key: string]: { x: number, y: number, subNodes: YJOutOfViewNode[] } } = {};
    /** 当前中心分区的坐标 */
    private _centerArea: string;
    /** 可见区域向上下扩展的分区数量 */
    private _subr: number = 1;
    /** 可见区域向左右扩展的分区数量 */
    private _subc: number = 1;

    /** 组件启用时注册事件监听 */
    onEnable() {
        //当节点大小改变时，重新设置分区
        this.node.on(Node.EventType.SIZE_CHANGED, this.setAreas, this);
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.setAreas();
    }

    /** 组件禁用时注销事件监听 */
    onDisable() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.setAreas, this);
        this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
    }

    /**
     * 添加需要管理的节点
     * @param node 需要管理的节点
     */
    public addOutOfViewNode(node: YJOutOfViewNode) {
        const key = this.posToAreaKey(node.position());
        const area = this._areas[key];
        if (area) {
            area.subNodes[area.subNodes.length] = node;
            node.setVisible(this.isVisibleArea(key));
        }
    }

    /**
     * 移除管理的节点
     * @param node 需要移除的节点
     */
    public removeOutOfViewNode(node: YJOutOfViewNode) {
        const key = this.posToAreaKey(no.position(node.node));
        const area = this._areas[key];
        if (area) {
            no.removeFromArray(area.subNodes, node, 'uuid');
        }
    }

    /** 节点在层级中的缩放 */
    private _scale: Vec3;
    /** 初始化可见区域的扩展范围 */
    private initSubRC() {
        const scale = no.scaleInHierarchy(this.node);
        if (this._scale?.x == scale.x && this._scale?.y == scale.y) return;
        this._scale = scale;
        const viewSize = YJFitScreen.getVisibleSize();
        this._subr = Math.floor(Math.ceil(viewSize.height / (this.areaSize.height * scale.y)) / 2) + 1;
        this._subc = Math.floor(Math.ceil(viewSize.width / (this.areaSize.width * scale.x)) / 2) + 1;
    }

    /**
     * 节点变换时的回调
     * @param d 变换类型
     */
    private onTransformChanged(d: any) {
        switch (d) {
            case Node.TransformBit.POSITION:
                this.check();
                break;
        }
    }

    /** 检查中心分区是否改变,更新各分区节点的可见性 */
    private check() {
        const viewSize = YJFitScreen.getVisibleSize();
        const centerPos = v3(viewSize.width / 2, viewSize.height / 2, 0);
        no.worldPositionInNode(centerPos, this.node, centerPos);
        const key = this.posToAreaKey(centerPos);
        const centerKey = this._centerArea;
        if (centerKey != key) {
            // console.log('change center area', key);
            this.initSubRC();
            this._centerArea = key;
            const [row, col] = no.stringToNumberArray(key, '-');
            for (let i = row - this._subr; i <= row + this._subr; i++) {
                for (let j = col - this._subc; j <= col + this._subc; j++) {
                    const key = `${i}-${j}`;
                    this.setSubNodesVisibleOfArea(key, true);
                    // console.log('show area', key);
                }
            }
            if (centerKey) {
                const [oldRow, oldCol] = no.stringToNumberArray(centerKey, '-'),
                    r = row - oldRow,
                    c = col - oldCol;
                if (r != 0) {
                    for (let i = 0, n = Math.abs(r); i < n; i++) {
                        const rr = oldRow + (this._subr - i) * (r < 0 ? 1 : -1);
                        if (rr < 0) continue;
                        for (let j1 = oldCol - this._subc; j1 <= oldCol + this._subc; j1++) {
                            const key = `${rr}-${j1}`;
                            this.setSubNodesVisibleOfArea(key, false);
                            // console.log('hide area', key);
                        }
                    }
                }
                if (c != 0) {
                    for (let i = 0, n = Math.abs(c); i < n; i++) {
                        const cc = oldCol + (this._subc - i) * (c < 0 ? 1 : -1);
                        if (cc < 0) continue;
                        for (let j1 = oldRow - this._subr; j1 <= oldRow + this._subr; j1++) {
                            const key = `${j1}-${cc}`;
                            this.setSubNodesVisibleOfArea(key, false);
                            // console.log('hide area', key);
                        }
                    }
                }
            }
        }
    }

    /**
     * 设置指定分区内所有节点的可见性
     * @param key 分区坐标
     * @param visible 是否可见
     */
    private setSubNodesVisibleOfArea(key: string, visible: boolean) {
        const area = this._areas[key];
        if (area) {
            for (let i = 0, n = area.subNodes.length; i < n; i++) {
                area.subNodes[i].setVisible(visible);
            }
        }
    }

    /** 初始化分区数据 */
    private setAreas() {
        const { width, height } = no.size(this.node);
        const anchor = no.anchor(this.node);
        const anchorWidth = width * anchor.x,
            anchorHeight = height * anchor.y;
        const areaWidth = this.areaSize.width,
            halfAreaWidth = areaWidth / 2;
        const areaHeight = this.areaSize.height,
            halfAreaHeight = areaHeight / 2;
        const col = Math.ceil(width / areaWidth);
        const row = Math.ceil(height / areaHeight);
        //从左到右，从下到上
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                const key = `${i}-${j}`,
                    x = halfAreaWidth + areaWidth * j - anchorWidth,
                    y = halfAreaHeight + areaHeight * i - anchorHeight;
                this._areas[key] = { x, y, subNodes: [] };
                this.createAreaNode(i, j, x, y);
            }
        }
        const nodes = this.getComponentsInChildren(YJOutOfViewNode);
        for (let i = 0, n = nodes.length; i < n; i++) {
            const node = nodes[i];
            this.addOutOfViewNode(node);
        }
        this.check();
    }

    /**
     * 将世界坐标转换为分区坐标
     * @param pos 世界坐标
     * @returns 分区坐标(row-col)
     */
    private posToAreaKey(pos: Vec3) {
        const { width, height } = no.size(this.node);
        const anchor = no.anchor(this.node);
        const anchorWidth = width * anchor.x,
            anchorHeight = height * anchor.y;
        const x = pos.x + anchorWidth,
            y = pos.y + anchorHeight,
            col = Math.floor(x / this.areaSize.width),
            row = Math.floor(y / this.areaSize.height);
        return `${row}-${col}`;
    }

    /**
     * 判断指定分区是否在可见范围内
     * @param key 分区坐标
     * @returns 是否可见
     */
    private isVisibleArea(key: string) {
        if (!this._centerArea) return false;
        const [row, col] = no.stringToNumberArray(key, '-');
        const [crow, ccol] = no.stringToNumberArray(this._centerArea, '-');
        return Math.abs(row - crow) <= this._subr && Math.abs(col - ccol) <= this._subc;
    }

    /**
     * 创建分区节点(仅用于测试)
     * @param i 行号
     * @param j 列号  
     * @param x x坐标
     * @param y y坐标
     */
    private createAreaNode(i: number, j: number, x: number, y: number) {
        if (!this.areaTemp) return;
        //仅在测试时查看区域分布使用
        const node = instantiate(this.areaTemp);
        node.setPosition(x, y);
        node.parent = this.node;
        node.active = true;
        node.getComponent(YJDataWork).initWithData({ key: `${i}-${j}` });
    }
}