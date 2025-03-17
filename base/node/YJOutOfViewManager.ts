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
/**
 * 超出视野管理器，不渲染超出视野的节点,根据屏幕大小分区管理，不适用于频繁创建销毁的节点
 * @remarks
 * 功能特性：
 * - 根据屏幕大小自动分区管理节点
 * - 支持节点显隐状态管理
 * - 提供节点可见性检测方法
 */
export class YJOutOfViewManager extends Component {
    /** 
     * 每个分区的大小（单位：像素）
     * @property {Size} areaSize - 控制空间划分粒度，值越小管理越精细但性能开销越大
     * @example
     * // 不同场景配置建议：
     * // - 大地图场景：size(800, 600)
     * // - 室内场景：size(200, 200)
     * // - 策略游戏：size(500, 500)
     */
    @property({ displayName: '分区大小' })
    areaSize: Size = size(400, 400);

    /** 
     * 分区节点模板（仅用于编辑器调试）
     * @property {Node} areaTemp - 可视化显示分区边界，正式发布时应移除引用
     * @example
     * // 创建调试用分区指示器：
     * // 1. 创建带边框的Sprite节点
     * // 2. 拖拽到该属性栏
     * // 3. 运行时可以看到绿色线框表示的分区
     */
    @property({ type: Node })
    areaTemp: Node;

    /** 
     * 分区数据存储
     * @private {Object} _areas - 使用行列坐标作为键的字典
     * @example
     * // 数据结构示例：
     * // {
     * //   "2-3": {x: 800, y: 600, subNodes: [node1, node2]},
     * //   "2-4": {x: 1200, y: 600, subNodes: [node3]}
     * // }
     */
    private _areas: { [key: string]: { x: number, y: number, subNodes: YJOutOfViewNode[] } } = {};
    
    /** 
     * 当前视口中心所在分区坐标 
     * @private {string} _centerArea - 格式为"行-列"的字符串
     * @example
     * // 当视口在第三行第五列时：
     * // _centerArea = "3-5"
     */
    private _centerArea: string;
    
    /** 
     * 纵向扩展分区数（根据屏幕高度动态计算） 
     * @private {number} _subr - 表示可见区域上下各扩展多少个分区
     * @example
     * // 当屏幕高度为1200px，分区高度400px时：
     * // _subr = Math.floor(1200/(400*scale)/2)+1
     */
    private _subr: number = 1;
    
    /** 
     * 横向扩展分区数（根据屏幕宽度动态计算）
     * @private {number} _subc - 表示可见区域左右各扩展多少个分区
     */
    private _subc: number = 1;

    /** 
     * 组件启用时的初始化
     * @remarks
     * 注册两个关键事件监听：
     * 1. SIZE_CHANGED - 当容器尺寸变化时重新划分分区
     * 2. TRANSFORM_CHANGED - 当容器位置变化时检查可见分区
     * @example
     * // 典型触发场景：
     * // - 屏幕旋转时
     * // - 玩家拖动地图时
     * // - UI布局发生改变时
     */
    onEnable() {
        this.node.on(Node.EventType.SIZE_CHANGED, this.setAreas, this);
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.setAreas();
    }

    /** 
     * 组件禁用时的清理 
     * @remarks
     * 移除所有事件监听防止内存泄漏
     */
    onDisable() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.setAreas, this);
        this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
    }

    /**
     * 添加需管理的动态节点
     * @param node 要添加的YJOutOfViewNode节点
     * @example
     * // 添加新生成的NPC：
     * const npc = instantiate(npcPrefab);
     * npc.getComponent(YJOutOfViewNode).init();
     * this.outOfViewManager.addOutOfViewNode(npc.getComponent(YJOutOfViewNode));
     */
    public addOutOfViewNode(node: YJOutOfViewNode) {
        const key = this.posToAreaKey(node.position());
        const area = this._areas[key];
        if (area) {
            // 使用直接赋值而不是push来避免数组操作开销
            area.subNodes[area.subNodes.length] = node;
            // 立即设置可见性状态
            node.setVisible(this.isVisibleArea(key));
        }
    }

    /**
     * 移除不再需要的节点
     * @param node 要移除的YJOutOfViewNode节点
     * @example
     * // 当NPC被击败时：
     * defeatedNPC.getComponent(YJOutOfViewNode).destroy();
     * this.outOfViewManager.removeOutOfViewNode(defeatedNPC.getComponent(YJOutOfViewNode));
     */
    public removeOutOfViewNode(node: YJOutOfViewNode) {
        const key = this.posToAreaKey(no.position(node.node));
        const area = this._areas[key];
        if (area) {
            // 使用uuid进行快速查找移除
            no.removeFromArray(area.subNodes, node, 'uuid');
        }
    }

    /** 
     * 节点在层级中的缩放值缓存 
     * @example
     * // 当父节点缩放为(0.5, 1)时：
     * // 实际可视区域的计算需要考虑这个缩放值
     */
    private _scale: Vec3;
    
    /** 
     * 初始化可见区域的扩展范围（缓冲区域行列数）
     * @remarks
     * 计算逻辑：
     * 1. 获取节点在层级中的实际缩放值
     * 2. 根据屏幕可视区域和缩放后的分区尺寸计算需要预加载的行列数
     * 3. 公式：缓冲行数 = 屏幕高度/(分区高度*Y轴缩放)/2 + 1
     *          缓冲列数 = 屏幕宽度/(分区宽度*X轴缩放)/2 + 1
     * @example
     * // 当屏幕尺寸为1136x640，分区尺寸200x200，缩放为1时：
     * // 缓冲行数 = 640/(200*1)/2 +1 ≈ 3行
     * // 缓冲列数 = 1136/(200*1)/2 +1 ≈ 4列
     */
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
     * @param d 变换类型标记
     * @remarks
     * 处理逻辑：
     * - 仅响应位置变化(POSITION)
     * - 当节点位置变化时触发可见性检查
     * @example
     * // 当管理节点跟随玩家移动时：
     * // 每次位置变化都会触发新的可见性计算
     */
    private onTransformChanged(d: any) {
        switch (d) {
            case Node.TransformBit.POSITION:
                this.check();
                break;
        }
    }

    /** 
     * 检查中心分区是否改变并更新各分区节点的可见性
     * @remarks
     * 核心逻辑：
     * 1. 计算当前屏幕中心点在管理节点坐标系中的位置
     * 2. 转换为对应的分区坐标key（row-col）
     * 3. 如果中心分区发生变化：
     *    a. 计算需要显示的新缓冲区域（中心分区±缓冲行列数）
     *    b. 隐藏移出缓冲区域的旧分区
     *    c. 显示新进入缓冲区域的分区
     * @example
     * // 当向右移动跨越分区边界时：
     * // 1. 隐藏左侧超出缓冲区域的分区
     * // 2. 显示右侧新进入缓冲区域的分区
     */
    private check() {
        const viewSize = YJFitScreen.getVisibleSize();
        const centerPos = v3(viewSize.width / 2, viewSize.height / 2, 0);
        no.worldPositionInNode(centerPos, this.node, centerPos);
        const key = this.posToAreaKey(centerPos);
        const centerKey = this._centerArea;
        if (centerKey != key) {
            this.initSubRC();
            this._centerArea = key;
            const [row, col] = no.stringToNumberArray(key, '-');
            
            // 显示新中心区域及缓冲区域
            for (let i = row - this._subr; i <= row + this._subr; i++) {
                for (let j = col - this._subc; j <= col + this._subc; j++) {
                    this.setSubNodesVisibleOfArea(`${i}-${j}`, true);
                }
            }

            // 隐藏移出缓冲区域的旧区域
            if (centerKey) {
                const [oldRow, oldCol] = no.stringToNumberArray(centerKey, '-'),
                    r = row - oldRow,
                    c = col - oldCol;

                // 处理行方向移动
                if (r != 0) {
                    for (let i = 0, n = Math.abs(r); i < n; i++) {
                        const rr = oldRow + (this._subr - i) * (r < 0 ? 1 : -1);
                        if (rr < 0) continue;
                        for (let j1 = oldCol - this._subc; j1 <= oldCol + this._subc; j1++) {
                            this.setSubNodesVisibleOfArea(`${rr}-${j1}`, false);
                        }
                    }
                }

                // 处理列方向移动
                if (c != 0) {
                    for (let i = 0, n = Math.abs(c); i < n; i++) {
                        const cc = oldCol + (this._subc - i) * (c < 0 ? 1 : -1);
                        if (cc < 0) continue;
                        for (let j1 = oldRow - this._subr; j1 <= oldRow + this._subr; j1++) {
                            this.setSubNodesVisibleOfArea(`${j1}-${cc}`, false);
                        }
                    }
                }
            }
        }
    }

    /**
     * 设置指定分区内所有节点的可见性
     * @param key 分区坐标（格式为"行-列"的字符串，如"2-3"表示第2行第3列）
     * @param visible 是否可见
     * @example
     * // 设置第2行第3列分区内的所有节点可见：
     * this.setSubNodesVisibleOfArea('2-3', true);
     * 
     * // 隐藏第1行第0列分区的所有节点：
     * this.setSubNodesVisibleOfArea('1-0', false);
     */
    private setSubNodesVisibleOfArea(key: string, visible: boolean) {
        const area = this._areas[key];
        if (area) {
            for (let i = 0, n = area.subNodes.length; i < n; i++) {
                area.subNodes[i].setVisible(visible);
            }
        }
    }

    /** 
     * 初始化分区数据
     * @remarks
     * 执行流程：
     * 1. 计算节点总尺寸和锚点偏移
     * 2. 根据分区尺寸计算行列数
     * 3. 从左到右、从下到上创建分区
     * 4. 收集所有YJOutOfViewNode节点并分配到对应分区
     * 
     * @example
     * // 假设节点尺寸为1200x800，分区尺寸400x400：
     * // 将创建3行（800/400=2 => 向上取整）+1缓冲行
     * // 3列（1200/400=3）共9个分区
     */
    private setAreas() {
        // 获取节点尺寸和锚点信息
        const { width, height } = no.size(this.node);
        const anchor = no.anchor(this.node);
        // 计算锚点导致的偏移量（将锚点坐标系转换为左下角原点）
        const anchorWidth = width * anchor.x,
            anchorHeight = height * anchor.y;
        // 分区尺寸计算
        const areaWidth = this.areaSize.width,
            halfAreaWidth = areaWidth / 2;  // 分区中心点X偏移
        const areaHeight = this.areaSize.height,
            halfAreaHeight = areaHeight / 2; // 分区中心点Y偏移
        // 计算总行列数（向上取整保证覆盖整个区域）
        const col = Math.ceil(width / areaWidth);
        const row = Math.ceil(height / areaHeight);
        
        // 从左到右，从下到上创建分区
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                // 计算分区中心坐标（相对于节点坐标系）
                const key = `${i}-${j}`,
                    x = halfAreaWidth + areaWidth * j - anchorWidth,
                    y = halfAreaHeight + areaHeight * i - anchorHeight;
                // 存储分区数据
                this._areas[key] = { x, y, subNodes: [] };
                // 创建调试用分区显示节点
                this.createAreaNode(i, j, x, y);
            }
        }
        
        // 收集并分配所有子节点到对应分区
        const nodes = this.getComponentsInChildren(YJOutOfViewNode);
        for (let i = 0, n = nodes.length; i < n; i++) {
            const node = nodes[i];
            this.addOutOfViewNode(node);
        }
        this.check();
    }

    /**
     * 将世界坐标转换为分区坐标
     * @param pos 世界坐标系下的位置（Vec3类型）
     * @returns 分区坐标字符串（格式"行-列"）
     * @example
     * // 假设节点锚点在中心，尺寸1200x800，分区尺寸400x400：
     * // 世界坐标(200, 300) -> 节点坐标(200+600, 300+400)=(800,700)
     * // 计算结果：行=700/400=1.75取整1，列=800/400=2 → "1-2"
     */
    private posToAreaKey(pos: Vec3) {
        const { width, height } = no.size(this.node);
        const anchor = no.anchor(this.node);
        // 转换为以节点左下角为原点的坐标系
        const anchorWidth = width * anchor.x,
            anchorHeight = height * anchor.y;
        const x = pos.x + anchorWidth,  // 消除锚点偏移
            y = pos.y + anchorHeight,
            col = Math.floor(x / this.areaSize.width),  // 计算列索引
            row = Math.floor(y / this.areaSize.height); // 计算行索引
        return `${row}-${col}`;
    }

    /**
     * 判断指定分区是否在可见范围内
     * @param key 分区坐标字符串（格式"行-列"，如"2-3"）
     * @returns 是否可见（true=在缓冲区域内，false=超出可视范围）
     * @example
     * // 假设当前中心分区是"5-5"，_subr=2，_subc=3：
     * isVisibleArea("5-5") → true   // 中心分区自身
     * isVisibleArea("4-5") → true   // 上方1行
     * isVisibleArea("7-3") → false  // 下方2行且左2列超出缓冲
     * isVisibleArea("5-8") → true   // 右侧3列
     * 
     * @remarks
     * 计算逻辑：
     * 1. 将当前中心分区和待检测分区转换为行列数字
     * 2. 比较行差是否在_subr范围内，列差是否在_subc范围内
     * 3. 同时满足行列条件才视为可见
     */
    private isVisibleArea(key: string) {
        if (!this._centerArea) return false;
        // 解析目标分区行列（示例：key="3-5" → row=3, col=5）
        const [row, col] = no.stringToNumberArray(key, '-');
        // 解析当前中心分区行列
        const [crow, ccol] = no.stringToNumberArray(this._centerArea, '-');
        // 计算行列差值是否在缓冲范围内
        return Math.abs(row - crow) <= this._subr && Math.abs(col - ccol) <= this._subc;
    }

    /**
     * 创建分区节点（仅用于编辑器调试）
     * @param i 行号（从0开始自下而上）
     * @param j 列号（从0开始自左而右） 
     * @param x 分区中心点的X坐标（相对于节点坐标系）
     * @param y 分区中心点的Y坐标（相对于节点坐标系）
     * @example
     * // 创建第2行第3列的分区节点：
     * createAreaNode(2, 3, 600, 400)
     * // 生成节点位置为(600,400)，附加数据{key: "2-3"}
     * 
     * @remarks
     * 实现细节：
     * - 使用areaTemp模板实例化调试节点
     * - 设置节点位置到对应分区中心
     * - 通过YJDataWork组件注入分区标识数据
     * - 正式发布时应移除areaTemp引用避免资源浪费
     */
    private createAreaNode(i: number, j: number, x: number, y: number) {
        if (!this.areaTemp) return;
        // 实例化调试用分区指示器节点
        const node = instantiate(this.areaTemp);
        // 定位到分区中心点
        node.setPosition(x, y);
        // 挂载到管理节点下
        node.parent = this.node;
        // 默认激活（可通过模板控制初始状态）
        node.active = true;
        // 注入分区标识数据（用于调试面板显示）
        node.getComponent(YJDataWork).initWithData({ key: `${i}-${j}` });
    }
}