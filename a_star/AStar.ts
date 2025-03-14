
/**
 * 寻路A星算法
 * 使用说明
let task = new AStar.Task(); //新建寻路任务
task.setStart(40,0); //设置起点
task.setEnd(40,80); //设置终点

//设置障碍/墙
task.setWallFromArray([
[39,40],
[40,40],
[41,40],
]);
或设置空地/无障碍
task.setEmptyGroundFromArray([
[39,40],
[40,40],
[41,40],
]);

task.findPath(); //找到路径
console.log(task.pathSet); //输出路径结果
 */

export namespace AStar {
    /**
     * A*算法节点类（表示网格中的一个可通行点）
     * @example
     * // 创建两个相邻节点
     * const nodeA = new AStar.Node(10, 20);
     * const nodeB = new AStar.Node(11, 20);
     * 
     * // 设置父子节点关系
     * nodeB.parent = nodeA;
     */
    export class Node {
        /** 网格X坐标 */
        public x: number;
        /** 网格Y坐标 */
        public y: number;
        /** 从起点到当前节点的移动成本 */
        public g: number;
        /** 启发式估算到终点的成本 */
        public h: number;
        /** 总成本（g + h） */
        public f: number;
        /** 路径中的父节点（用于回溯路径） */
        public parent: any;

        /**
         * @param x 网格X坐标
         * @param y 网格Y坐标
         * @example
         * // 创建位于(5,5)的节点
         * const node = new AStar.Node(5, 5);
         */
        constructor(x, y) {
            this.x = x;
            this.y = y;

            this.g = 0;
            this.h = 0;
            this.f = 0;
            this.parent = null;
        }

        /**
         * 计算总成本（需先设置父节点）
         * @param endNode 目标终点节点
         * @example
         * // 计算从父节点到当前节点的成本
         * currentNode.parent = previousNode;
         * currentNode.initF(targetNode);
         */
        initF(endNode) {
            let g0 = this.getG(this, this.parent);
            this.g = this.parent.g + g0;

            // 使用对角距离启发式算法
            let dx = Math.abs(this.x - endNode.x);
            let dy = Math.abs(this.y - endNode.y);
            let maxD = Math.max(dx, dy);
            let minD = Math.min(dx, dy);
            this.h = Math.SQRT2 * minD + (maxD - minD);

            this.f = this.g + this.h;
        }

        /**
         * 计算两个相邻节点间的移动成本
         * @param n1 起始节点
         * @param n2 目标节点
         * @returns 移动成本（直线1，斜线√2）
         * @example
         * // 水平相邻节点返回1
         * getG(new Node(0,0), new Node(1,0)); // -> 1
         * 
         * // 斜对角节点返回√2
         * getG(new Node(0,0), new Node(1,1)); // -> 1.414
         */
        getG(n1, n2) {
            let g0 = Math.SQRT2;
            if (n1.x === n2.x || n1.y === n2.y) {
                g0 = 1;
            }
            return g0;
        }

        /**
         * 判断节点位置是否相同
         * @param node 要比较的节点
         * @returns 是否在同一网格位置
         * @example
         * new Node(2,3).equals(new Node(2,3)); // true
         * new Node(2,3).equals(new Node(3,2)); // false
         */
        equals(node) {
            if (node.x === this.x && node.y === this.y) {
                return true;
            }
            return false;
        }
    }

    /**
     * A*寻路任务处理类
     * @example
     * // 基本使用示例
     * const task = new Task();
     * task.setStart(0, 0);          // 设置起点坐标
     * task.setEnd([10, 10]);        // 设置终点坐标
     * task.setWallFromArray([[5,5],[6,6]]); // 批量设置障碍物
     * const path = task.findPath(); // 执行寻路算法
     */
    export class Task {
        /** 最终路径集合 */
        private pathSet: Node[];
        /** 起始节点 */
        public startNode: Node;
        /** 目标节点 */
        private endNode: Node;
        /** 开放列表（待探索节点） */
        private openSet: Node[];
        /** 关闭列表（已探索节点） */
        private closeSet: Node[];
        /** 障碍物节点集合 */
        private wallSet: Node[];
        /** 可行走区域节点集合 */
        private emptySet: Node[];

        constructor() {
            this.pathSet = [];
            this.startNode = null;
            this.endNode = null;
            this.openSet = [];
            this.closeSet = [];
            this.wallSet = [];
        }

        /**
         * 设置起始点坐标
         * @param x X坐标或坐标数组[x,y]
         * @param y Y坐标（当第一个参数为number时有效）
         * @example
         * // 数组形式设置
         * task.setStart([5, 5]);
         * // 坐标形式设置
         * task.setStart(5, 5);
         */
        setStart(x: number | number[], y?: number) {
            if (x instanceof Array)
                this.startNode = new Node(x[0], x[1]);
            else this.startNode = new Node(x, y);
        }

        /**
         * 设置目标点坐标
         * @param x X坐标或坐标数组[x,y]
         * @param y Y坐标（当第一个参数为number时有效）
         * @example
         * // 数组形式设置终点
         * task.setEnd([10, 15]);
         */
        setEnd(x: number | number[], y?: number) {
            if (x instanceof Array)
                this.endNode = new Node(x[0], x[1]);
            else
                this.endNode = new Node(x, y);
        }

        /**
         * 通过二维数组批量设置障碍物坐标
         * @param array 障碍物坐标数组 [[x1,y1],[x2,y2],...]
         * @example
         * // 设置多个障碍点
         * task.setWallFromArray([[5,5], [6,6], [7,7]]);
         */
        setWallFromArray(array: number[][]) {
            this.wallSet = [];
            for (let i = 0; i < array.length; i++) {
                this.wallSet.push(new Node(array[i][0], array[i][1]));
            }
        }

        /**
         * 通过二维数组批量设置可行走区域
         * @param array 可行走坐标数组 [[x1,y1],[x2,y2],...]
         * @example
         * // 限制可行走区域
         * task.setEmptyGroundFromArray([[0,0], [1,0], [0,1]]);
         */
        setEmptyGroundFromArray(array: number[][]) {
            this.emptySet = [];
            for (let i = 0; i < array.length; i++) {
                this.emptySet.push(new Node(array[i][0], array[i][1]));
            }
        }

        /**
         * 添加单个障碍物坐标
         * @param x X坐标
         * @param y Y坐标
         * @example
         * // 添加障碍点
         * task.addWall(5, 5);
         */
        addWall(x, y) {
            let node = new Node(x, y);
            if (!this.findNode(this.wallSet, node)) {
                this.wallSet.push(node);
            }
        }

        /**
         * 添加单个可行走坐标
         * @param x X坐标
         * @param y Y坐标
         * @example
         * // 添加可行走点
         * task.addEmptyGround(2, 3);
         */
        addEmptyGround(x, y) {
            let node = new Node(x, y);
            if (!this.findNode(this.emptySet, node)) {
                this.emptySet.push(node);
            }
        }

        /**
         * 重置所有寻路数据
         * @example
         * // 重置任务状态
         * task.reSet();
         */
        reSet() {
            this.pathSet = [];
            this.startNode = null;
            this.endNode = null;
            this.openSet = [];
            this.closeSet = [];
            this.wallSet = [];
            this.emptySet = [];
        }

        /**
         * 执行A*寻路算法查找路径
         * @returns {Node[]} 找到的路径节点数组（按顺序从起点到终点），若未找到返回空数组
         * @example
         * // 基本使用
         * const task = new AStarTask();
         * task.setStart(0, 0);
         * task.setEnd(5, 5);
         * const path = task.findPath();
         * if(path.length > 0) {
         *   console.log('找到路径:', path.map(p => `(${p.x},${p.y})`).join('->'));
         * } else {
         *   console.warn('路径不存在');
         * }
         */
        findPath() {
            this.pathSet = []; // 最终路径集合
            this.closeSet = []; // 已探索节点集合

            // 前置条件校验
            if (!this.startNode) {
                console.log('未设置起点');
                return;
            }
            if (!this.endNode) {
                console.log('未设置终点');
                return;
            }
            if (this.findNode(this.wallSet, this.endNode)) {
                console.log('终点在墙里！');
                return;
            }

            this.openSet = [this.startNode]; // 初始化待探索节点集合

            // 主算法循环
            while (this.openSet.length > 0) {
                // 按评估值排序获取最优节点
                this.openSet.sort(this.sortNode);
                let n = this.openSet[0];

                // 节点状态转移
                this.removeNode(this.openSet, n);
                this.addNode(this.closeSet, n);

                // 终点到达判断
                if (n.equals(this.endNode)) {
                    // 回溯构建路径
                    let cur = n;
                    while (cur.parent) {
                        this.pathSet.unshift(cur); // 逆序插入保证起点在前
                        cur = cur.parent;
                    }
                    console.log('最终路径节点序列:', this.pathSet);
                    break;
                }

                // 八方向邻接节点探索
                for (let x = n.x - 1; x <= n.x + 1; x++) {
                    for (let y = n.y - 1; y <= n.y + 1; y++) {
                        let m = new Node(x, y);
                        
                        // 节点过滤条件（自身/障碍物/非可行走区域/已探索节点）
                        if (m.equals(n) || this.findNode(this.wallSet, m) || 
                            !this.findNode(this.emptySet, m) || this.findNode(this.closeSet, m)) {
                            continue;
                        }

                        // 计算新路径代价
                        if (this.findNode(this.openSet, m)) {
                            let newG = n.g + n.getG(m, n); // 计算新路径的G值
                            if (newG < m.g) { // 发现更优路径
                                m.g = newG;
                                m.f = m.g + m.h; // 更新评估值
                                m.parent = n; // 重置父节点
                            }
                        } else {
                            // 新发现节点初始化
                            m.parent = n;
                            m.initF(this.endNode); // 计算F=G+H
                            this.addNode(this.openSet, m); // 加入待探索集合
                        }
                    }
                }
            }

            if (this.pathSet.length === 0) {
                console.log('无法找到路径');
            }
            return this.pathSet;
        }

        /**
         * 节点排序比较函数（按总成本升序排列）
         * @param a 待比较节点A
         * @param b 待比较节点B
         * @returns 排序顺序值
         * @example
         * // 对开放列表进行排序
         * openSet.sort(sortNode);
         */
        sortNode(a, b) {
            return a.f - b.f;
        }

        /**
         * 从指定集合中移除节点
         * @param set 目标集合（开放列表/关闭列表）
         * @param node 要移除的节点
         * @returns 被移除的节点（如果存在）
         * @example
         * // 从关闭列表移除指定节点
         * task.removeNode(closeSet, currentNode);
         */
        removeNode(set, node) {
            for (let i = 0; i < set.length; i++) {
                if (set[i].x === node.x && set[i].y === node.y) {
                    let n = set[i];
                    set.splice(i, 1);
                    return n;
                }
            }
        }

        /**
         * 添加节点到指定集合
         * @param set 目标集合（开放列表/关闭列表）
         * @param node 要添加的节点
         * @example
         * // 将新节点加入开放列表
         * task.addNode(openSet, neighborNode);
         */
        addNode(set, node) {
            set.push(node);
        }

        /**
         * 在集合中查找节点是否存在
         * @param set 目标集合（障碍物集合/开放列表等）
         * @param node 要查找的节点
         * @returns 是否存在该节点
         * @example
         * // 检查节点是否在障碍物集合中
         * if (task.findNode(wallSet, currentNode)) {
         *   // 处理障碍物逻辑
         * }
         */
        findNode(set, node) {
            for (let i = 0; i < set.length; i++) {
                if (set[i].x === node.x && set[i].y === node.y) {
                    return true;
                }
            }
            return false;
        }
    }
}