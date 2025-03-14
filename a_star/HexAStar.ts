import { Hex } from "../hexGrid/HexGrid";

export namespace HexAStar {
    /**
     * 六边形网格A*节点类
     * @example
     * // 创建两个相邻六边形节点
     * const nodeA = new HexAStar.Node(0, 0);
     * const nodeB = new HexAStar.Node(1, -1);
     * 
     * // 设置父子节点关系
     * nodeB.parent = nodeA;
     */
    class Node {
        /** 六边形网格X坐标 */
        public x: number;
        /** 六边形网格Y坐标 */
        public y: number;
        /** 从起点到当前节点的移动成本 */
        public g: number = 0;
        /** 启发式估算到终点的成本 */
        public h: number = 0;
        /** 总成本（g + h） */
        public f: number = 0;
        /** 路径中的父节点（用于回溯路径） */
        public parent: Node | null = null;
        /** 节点唯一标识符（用于快速查找） */
        public nodeKey: string = "";

        /**
         * @param x 六边形网格X坐标
         * @param y 六边形网格Y坐标
         * @example
         * // 创建位于(2,-1)的节点
         * const node = new HexAStar.Node(2, -1);
         */
        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.nodeKey = `${this.x},${this.y}`;
        }

        /**
         * 初始化总成本（需先设置父节点）
         * @param endNode 目标终点节点
         * @example
         * // 计算从父节点到当前节点的成本
         * currentNode.parent = previousNode;
         * currentNode.initF(targetNode);
         */
        initF(endNode: Node): void {
            const dx = Math.abs(this.x - endNode.x);
            const dy = Math.abs(this.y - endNode.y);
            this.h = dx + dy; // 六边形网格使用轴向坐标曼哈顿距离
            this.f = this.g + this.h;
        }

        /**
         * 获取移动成本（六边形网格固定为1）
         * @returns 固定移动成本1
         * @example
         * // 任意相邻节点移动成本都是1
         * node.getG(); // -> 1
         */
        getG(): number {
            return 1; // 六边形网格所有相邻移动代价相同
        }

        /**
         * 判断节点位置是否相同
         * @param node 要比较的节点
         * @returns 是否在同一网格位置
         * @example
         * new Node(2,-1).equals(new Node(2,-1)); // true
         * new Node(2,-1).equals(new Node(-1,2)); // false
         */
        equals(node: Node): boolean {
            return this.x === node.x && this.y === node.y;
        }
    }

    export class Task {
        private pathSet: Node[] = [];
        private startNode: Node | null = null;
        private endNode: Node | null = null;
        private openSet: Map<string, Node> = new Map();
        private closeSet: Map<string, Node> = new Map();
        private wallSet: Set<string> = new Set();
        private emptySet: Set<string> = new Set();

        /**
         * 设置起始点坐标
         * @param x X坐标或坐标数组[x,y]
         * @param y Y坐标（当第一个参数为number时有效）
         * @example
         * // 数组形式设置
         * task.setStart([5, -3]);
         * // 坐标形式设置
         * task.setStart(5, -3);
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
         * task.setEnd([10, -5]);
         */
        setEnd(x: number | number[], y?: number) {
            if (x instanceof Array)
                this.endNode = new Node(x[0], x[1]);
            else
                this.endNode = new Node(x, y);
        }

        /**
         * 批量设置障碍物坐标
         * @param array 二维数组格式的坐标集合
         * @example
         * task.setWallFromArray([[5,-3],[6,-4],[7,-5]]);
         */
        setWallFromArray(array: number[][]) {
            this.wallSet.clear();
            for (let i = 0; i < array.length; i++) {
                const [x, y] = array[i];
                this.wallSet.add(`${x},${y}`);
            }
        }

        /**
         * 添加单个障碍物坐标
         * @param x X坐标
         * @param y Y坐标
         * @example
         * task.addWall(5, -3);
         */
        addWall(x: number, y: number) {
            this.wallSet.add(`${x},${y}`);
        }

        /**
         * 批量设置可行走区域坐标（覆盖原有设置）
         * @param array 二维数组格式的坐标集合
         * @example
         * task.setEmptyGroundFromArray([[5,-3],[6,-4],[7,-5]]);
         */
        setEmptyGroundFromArray(array: number[][]) {
            this.emptySet.clear();
            for (let i = 0; i < array.length; i++) {
                const [x, y] = array[i];
                this.emptySet.add(`${x},${y}`);
            }
        }

        /**
         * 添加单个可行走坐标
         * @param x X坐标
         * @param y Y坐标
         * @example
         * task.addEmptyGround(5, -3);
         */
        addEmptyGround(x: number, y: number) {
            this.emptySet.add(`${x},${y}`);
        }

        /**
         * 执行六边形网格A*寻路算法
         * @returns 路径节点数组（从起点到终点），若未找到返回空数组
         * @example
         * const task = new HexAStar.Task();
         * task.setStart(0, 0);
         * task.setEnd(5, -3);
         * task.setWallFromArray([[1,0],[2,-1]]);
         * const path = task.findPath();
         */
        findPath(): Node[] {
            if (!this.startNode || !this.endNode || this.wallSet.has(this.endNode.nodeKey)) {
                console.log('起点或终点设置错误，或终点在墙中');
                return [];
            }
            this.openSet.clear();
            this.closeSet.clear();
            this.pathSet.length = 0;
            this.openSet.set(this.startNode.nodeKey, this.startNode);

            while (this.openSet.size > 0) {
                let current = Array.from(this.openSet.values()).sort((a, b) => a.f - b.f)[0];
                this.openSet.delete(current.nodeKey);
                this.closeSet.set(current.nodeKey, current);

                if (current.equals(this.endNode)) {
                    let temp = current;
                    while (temp.parent) {
                        this.pathSet.push(temp);
                        temp = temp.parent;
                    }
                    this.pathSet.push(this.startNode);
                    return this.pathSet.reverse();
                }

                let neighbors = this.generateNeighbors(current);
                for (let i = 0; i < neighbors.length; i++) {
                    const neighbor = neighbors[i];
                    if (this.closeSet.has(neighbor.nodeKey) || this.wallSet.has(neighbor.nodeKey) || !this.emptySet.has(neighbor.nodeKey)) {
                        continue;
                    }

                    let tentative_gScore = current.g + current.getG();
                    let neighborKey = neighbor.nodeKey;
                    if (!this.openSet.has(neighborKey)) {
                        neighbor.g = tentative_gScore;
                        neighbor.initF(this.endNode);
                        neighbor.parent = current;
                        this.openSet.set(neighborKey, neighbor);
                    } else if (tentative_gScore < this.openSet.get(neighborKey)!.g) {
                        let updatingNeighbor = this.openSet.get(neighborKey)!;
                        updatingNeighbor.g = tentative_gScore;
                        updatingNeighbor.initF(this.endNode);
                        updatingNeighbor.parent = current;
                    }
                }
            }
            console.log('没有找到路径');
            return [];
        }

        /**
         * 生成当前节点的六边形相邻节点
         * @param node 当前节点
         * @returns 相邻节点数组（已过滤不可行走节点）
         */
        private generateNeighbors(node: Node): Node[] {
            let neighbors: Node[] = [];
            let directions = Hex.directions;
            for (let i = 0, n = directions.length; i < n; i++) {
                let dir = directions[i];
                let neighbor = new Node(node.x + dir.q, node.y + dir.r);
                if (!this.wallSet.has(neighbor.nodeKey) || this.emptySet.has(neighbor.nodeKey)) {
                    neighbors.push(neighbor);
                }
            }
            return neighbors;
        }
    }

}