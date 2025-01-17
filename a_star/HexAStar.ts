import { Hex } from "../hexGrid/HexGrid";

export namespace HexAStar {
    class Node {
        public x: number;
        public y: number;
        public g: number = 0;
        public h: number = 0;
        public f: number = 0;
        public parent: Node | null = null;
        public nodeKey: string = "";
        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.nodeKey = `${this.x},${this.y}`;
        }

        initF(endNode: Node): void {
            const dx = Math.abs(this.x - endNode.x);
            const dy = Math.abs(this.y - endNode.y);
            this.h = dx + dy; // 六边形网格使用曼哈顿距离
            this.f = this.g + this.h;
        }

        getG(): number {
            return 1; // 所有移动的代价均为1
        }

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
            this.wallSet.clear();
            for (let i = 0; i < array.length; i++) {
                const [x, y] = array[i];
                this.wallSet.add(`${x},${y}`);
            }
        }


        addWall(x: number, y: number) {
            this.wallSet.add(`${x},${y}`);
        }

        setEmptyGroundFromArray(array: number[][]) {
            this.emptySet.clear();
            for (let i = 0; i < array.length; i++) {
                const [x, y] = array[i];
                this.emptySet.add(`${x},${y}`);
            }
        }

        addEmptyGround(x: number, y: number) {
            this.emptySet.add(`${x},${y}`);
        }

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
                    this.pathSet.push(this.startNode); // Include start node in path
                    // console.log(this.startNode, this.endNode, this.pathSet);
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