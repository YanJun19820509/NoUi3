
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
    class Node {
        public x: number;
        public y: number;
        public g: number;
        public h: number;
        public f: number;
        public parent: any;
        constructor(x, y) {
            this.x = x;
            this.y = y;

            this.g = 0;
            this.h = 0;
            this.f = 0;
            this.parent = null;

        }

        initF(endNode) {

            let g0 = this.getG(this, this.parent);
            this.g = this.parent.g + g0;

            //对角距离
            let dx = Math.abs(this.x - endNode.x);
            let dy = Math.abs(this.y - endNode.y);
            let maxD = Math.max(dx, dy);
            let minD = Math.min(dx, dy);
            this.h = Math.SQRT2 * minD + (maxD - minD);

            // this.h = Math.sqrt(dx*dx + dy*dy);

            this.f = this.g + this.h;
        }

        getG(n1, n2) {
            let g0 = Math.SQRT2;
            if (n1.x === n2.x || n1.y === n2.y) {
                g0 = 1;
            }
            return g0;
        }

        equals(node) {
            if (node.x === this.x && node.y === this.y) {
                return true;
            }
            return false;
        }

    }

    export class Task {
        private pathSet: Node[];
        private startNode: Node;
        private endNode: Node;
        private openSet: Node[];
        private closeSet: Node[];
        private wallSet: Node[];
        private emptySet: Node[];

        constructor() {
            this.pathSet = [];
            this.startNode = null;
            this.endNode = null;

            this.openSet = [];
            this.closeSet = [];
            this.wallSet = [];
        }

        setStart(x: number | number[], y?: number) {
            if (x instanceof Array)
                this.startNode = new Node(x[0], x[1]);
            else this.startNode = new Node(x, y);
        }

        setEnd(x: number | number[], y?: number) {
            if (x instanceof Array)
                this.endNode = new Node(x[0], x[1]);
            else
                this.endNode = new Node(x, y);
        }

        setWallFromArray(array: number[][]) {
            this.wallSet = [];
            for (let i = 0; i < array.length; i += 2) {
                this.wallSet.push(new Node(array[i][0], array[i][1]));
            }
        }

        setEmptyGroundFromArray(array: number[][]) {
            this.emptySet = [];
            for (let i = 0; i < array.length; i += 2) {
                this.emptySet.push(new Node(array[i][0], array[i][1]));
            }
        }

        addWall(x, y) {
            let node = new Node(x, y);
            if (!this.findNode(this.wallSet, node)) {
                this.wallSet.push(node);
            }
        }

        addEmptyGround(x, y) {
            let node = new Node(x, y);
            if (!this.findNode(this.emptySet, node)) {
                this.emptySet.push(node);
            }
        }

        reSet() {
            this.pathSet = [];
            this.startNode = null;
            this.endNode = null;

            this.openSet = [];
            this.closeSet = [];
            this.wallSet = [];
            this.emptySet = [];
        }

        findPath() {
            this.pathSet = [];
            this.closeSet = [];

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

            this.openSet = [this.startNode];


            while (this.openSet.length > 0) {
                this.openSet.sort(this.sortNode);
                let n = this.openSet[0];

                this.removeNode(this.openSet, n);
                this.addNode(this.closeSet, n);

                if (n.equals(this.endNode)) {
                    //找到终点
                    let cur = n;
                    while (cur.parent) {
                        this.pathSet.unshift(cur);
                        cur = cur.parent;
                    }
                    console.log(this.pathSet);
                    break;
                }

                for (let x = n.x - 1; x <= n.x + 1; x++) {
                    for (let y = n.y - 1; y <= n.y + 1; y++) {
                        let m = new Node(x, y);
                        if (m.equals(n) || this.findNode(this.wallSet, m) || !this.findNode(this.emptySet, m) || this.findNode(this.closeSet, m)) {
                            continue;
                        }
                        if (this.findNode(this.openSet, m)) {
                            let newG = n.g + n.getG(m, n);
                            if (newG < m.g) {
                                m.g = newG;
                                m.f = m.g + m.h;
                                m.parent = n;
                            }
                        } else {
                            m.parent = n;
                            m.initF(this.endNode);
                            this.addNode(this.openSet, m);
                        }

                    }
                }

            }
            if (this.pathSet.length === 0) {
                console.log('无法找到路径');
            }
            return this.pathSet;
        }

        sortNode(a, b) {
            return a.f - b.f;
        }

        removeNode(set, node) {
            for (let i = 0; i < set.length; i++) {
                if (set[i].x === node.x && set[i].y === node.y) {
                    let n = set[i];
                    set.splice(i, 1);
                    return n;
                }
            }
        }

        addNode(set, node) {
            set.push(node);
        }

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