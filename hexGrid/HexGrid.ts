/**
 * 
 * Author mqsy_yj
 * DateTime Tue Aug 29 2023 14:45:32 GMT+0800 (中国标准时间)
 *
 */

// Generated code -- CC0 -- No Rights Reserved -- http://www.redblobgames.com/grids/hexagons/

export class Point {
    constructor(public x: number, public y: number) { }
}

/**
 * 六边形网格坐标类（轴向坐标系）
 * @remarks
 * - 使用q, r, s三个坐标轴，满足 q + r + s = 0
 * - 提供六边形网格的各种运算和转换方法
 * 
 * @example
 * // 创建六边形坐标：
 * const hex1 = Hex.new(1, 2);       // 通过q,r坐标创建
 * const hex2 = Hex.new([3, 4]);     // 通过数组创建
 * const hex3 = Hex.newFromString("5,6"); // 通过字符串创建
 */
export class Hex {
    /** 整数化后的q,r坐标缓存（用于精确计算） */
    private int_qr: { q: number, r: number } = { q: 0, r: 0 };

    /**
     * 创建六边形坐标（多态方法）
     * @overload
     */
    public static new(): Hex;
    public static new(arr: number[]): Hex;
    public static new(q: number, r: number): Hex;
    public static new(q?: number | number[], r?: number): Hex {
        if (q instanceof Array) {
            return Hex.new(q[0], q[1]);
        }
        q = q || 0;
        r = r || 0;
        return new Hex(q, r, -q - r);
    }

    /**
     * 通过字符串创建Hex
     * @param str 格式为'q,r'的字符串
     * @example
     * const hex = Hex.newFromString("2,3"); // q=2, r=3
     */
    public static newFromString(str: string): Hex {
        let arr = str.split(',');
        return Hex.new(parseInt(arr[0]), parseInt(arr[1]));
    }

    /**
     * @param q 轴向坐标q（东/西方向）
     * @param r 轴向坐标r（东北/西南方向）
     * @param s 轴向坐标s（西北/东南方向）
     * @throws 当q + r + s ≠ 0时抛出错误
     */
    constructor(public q: number, public r: number, public s: number) {
        if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0";
        this.int_qr = { q: Math.round(q), r: Math.round(r) };
    }

    /** 创建当前坐标的副本 */
    public clone(): Hex {
        return new Hex(this.q, this.r, this.s);
    }

    /**
     * 六边形坐标加法
     * @param b 要相加的六边形坐标
     * @returns 新的六边形坐标
     * @example
     * const a = Hex.new(1, 2);
     * const b = Hex.new(3, 4);
     * const c = a.add(b); // q=4, r=6
     */
    public add(b: Hex): Hex {
        return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
    }

    /**
     * 六边形坐标减法
     * @param b 要减去的六边形坐标
     * @returns 新的六边形坐标
     */
    public subtract(b: Hex): Hex {
        return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
    }

    /**
     * 缩放六边形坐标
     * @param k 缩放系数
     * @returns 缩放后的新坐标
     * @example
     * const a = Hex.new(2, 3);
     * const b = a.scale(0.5); // q=1, r=1.5
     */
    public scale(k: number): Hex {
        return new Hex(this.q * k, this.r * k, this.s * k);
    }

    /** 向左旋转60度（逆时针） */
    public rotateLeft(): Hex {
        return new Hex(-this.s, -this.q, -this.r);
    }

    /** 向右旋转60度（顺时针） */
    public rotateRight(): Hex {
        return new Hex(-this.r, -this.s, -this.q);
    }

    /** 六个基本方向向量 */
    public static directions: Hex[] = [
        new Hex(1, 0, -1),  // 东
        new Hex(1, -1, 0),  // 东北
        new Hex(0, -1, 1),  // 西北
        new Hex(-1, 0, 1),  // 西
        new Hex(-1, 1, 0),  // 西南
        new Hex(0, 1, -1)   // 东南
    ];

    /**
     * 获取指定方向的单位向量
     * @param direction 方向索引（0-5）
     */
    public static direction(direction: number): Hex {
        return Hex.directions[direction];
    }

    /**
     * 获取相邻六边形坐标
     * @param direction 方向索引（0-5）
     * @example
     * const center = Hex.new(0, 0);
     * const eastNeighbor = center.neighbor(0); // (1, 0)
     */
    public neighbor(direction: number): Hex {
        return this.add(Hex.direction(direction));
    }

    /** 获取所有六个相邻坐标 */
    public allNeighbors(): Hex[] {
        const results: Hex[] = [];
        for (var i = 0; i < 6; i++) {
            results.push(this.neighbor(i));
        }
        return results;
    }

    /** 六个对角线方向向量 */
    public static diagonals: Hex[] = [
        new Hex(2, -1, -1),  // 东-东北
        new Hex(1, -2, 1),   // 东北-西北
        new Hex(-1, -1, 2),  // 西北-西
        new Hex(-2, 1, 1),   // 西-西南
        new Hex(-1, 2, -1),  // 西南-东南
        new Hex(1, 1, -2)    // 东南-东
    ];

    /**
     * 获取对角线方向相邻坐标
     * @param direction 对角线方向索引（0-5）
     */
    public diagonalNeighbor(direction: number): Hex {
        return this.add(Hex.diagonals[direction]);
    }

    /**
     * 获取到目标坐标的方向
     * @param b 目标坐标
     * @returns 方向索引（0-5），找不到时返回-1
     * @example
     * const a = Hex.new(0, 0);
     * const b = Hex.new(1, 0);
     * const dir = a.directionTo(b); // 0（东方向）
     */
    public directionTo(b: Hex): number {
        const a = b.subtract(this).simple();
        for (let i = 0; i < 6; i++) {
            if (a.equal(Hex.directions[i])) return i;
        }
        return -1;
    }

    /**
     * 单位化坐标（转换为方向向量）
     * @returns 单位化后的新坐标
     * @example
     * new Hex(3, -2, -1).simple(); // 返回 (1, -1, 0)
     */
    public simple(): Hex {
        let b = this.clone();
        b.q /= Math.abs(b.q || 1);
        b.r /= Math.abs(b.r || 1);
        b.s /= Math.abs(b.s || 1);
        return b;
    }

    /** 计算到原点的距离（六边形半径） */
    public len(): number {
        return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
    }

    /**
     * 计算到另一个六边形的距离
     * @param b 目标六边形
     * @example
     * new Hex(3, -2).distance(new Hex(1, 1)); // 返回 3
     */
    public distance(b: Hex): number {
        return this.subtract(b).len();
    }

    /**
     * 四舍五入到最近的整数坐标
     * @description 使用三舍入算法保证结果满足q + r + s = 0
     * @example
     * new Hex(0.8, -1.3, 0.5).round(); // 返回 (1, -1, 0)
     */
    public round(): Hex {
        var qi: number = Math.round(this.q);
        var ri: number = Math.round(this.r);
        var si: number = Math.round(this.s);
        var q_diff: number = Math.abs(qi - this.q);
        var r_diff: number = Math.abs(ri - this.r);
        var s_diff: number = Math.abs(si - this.s);
        if (q_diff > r_diff && q_diff > s_diff) {
            qi = -ri - si;
        }
        else
            if (r_diff > s_diff) {
                ri = -qi - si;
            }
            else {
                si = -qi - ri;
            }
        return new Hex(qi, ri, si);
    }

    /**
     * 线性插值
     * @param b 目标坐标
     * @param t 插值系数（0-1）
     * @example
     * Hex.new(0,0).lerp(Hex.new(3,0), 0.5); // 返回 (1.5, 0)
     */
    public lerp(b: Hex, t: number): Hex {
        return new Hex(this.q * (1.0 - t) + b.q * t, this.r * (1.0 - t) + b.r * t, this.s * (1.0 - t) + b.s * t);
    }

    /**
     * 生成两点间的直线路径
     * @param b 终点坐标
     * @returns 路径上的所有六边形坐标
     * @example
     * Hex.new(0,0).linedraw(Hex.new(3,0)); 
     * // 返回 [(0,0), (1,0), (2,0), (3,0)]
     */
    public linedraw(b: Hex): Hex[] {
        var N: number = this.distance(b);
        var a_nudge: Hex = new Hex(this.q + 1e-06, this.r + 1e-06, this.s - 2e-06);
        var b_nudge: Hex = new Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
        var results: Hex[] = [];
        var step: number = 1.0 / Math.max(N, 1);
        for (var i = 0; i <= N; i++) {
            results.push(a_nudge.lerp(b_nudge, step * i).round());
        }
        return results;
    }

    /** 转换为q,r字符串（保留小数） */
    public toString(): string {
        return `${this.q},${this.r}`;
    }

    /** 转换为[q, r]数组 */
    public toNumbers(): number[] {
        return [this.q, this.r];
    }

    /** 转换为整数q,r字符串 */
    public toIntString(): string {
        return `${this.int_qr.q},${this.int_qr.r}`;
    }

    /** 转换为整数[q, r]数组 */
    public toIntNumbers(): number[] {
        return [this.int_qr.q, this.int_qr.r];
    }

    /**
     * 判断坐标是否相等
     * @param b 比较对象
     * @example
     * Hex.new(1,2).equal(Hex.new(1,2)); // true
     */
    public equal(b: Hex): boolean {
        if (this.q === b.q && this.s === b.s && this.r === b.r) {
            return true;
        }
        return false;
    }
}

/**
 * 偏移坐标类（用于处理偶/奇行或列偏移的坐标转换）
 * @remarks
 * - 支持两种偏移模式：偶数列偏移(EVEN)和奇数列偏移(ODD)
 * - 提供立方体坐标(q,r,s)与偏移坐标(col,row)之间的转换方法
 * 
 * @example
 * // 创建偏移坐标：
 * const oc = new OffsetCoord(3, 5);
 */
export class OffsetCoord {
    /**
     * @param col 列坐标（水平方向）
     * @param row 行坐标（垂直方向）
     */
    constructor(public col: number, public row: number) { }
    
    /** 偶数列偏移模式常量 */
    public static EVEN: number = 1;
    /** 奇数列偏移模式常量 */
    public static ODD: number = -1;

    /**
     * 从立方体坐标转换为列偏移坐标（适用于列对齐布局）
     * @param offset 偏移模式（EVEN 或 ODD）
     * @param h 立方体坐标系下的六边形坐标
     * @returns 列偏移坐标
     * @example
     * Hex(1, -2, 1) 转换为偶数列偏移坐标：
     * OffsetCoord.qoffsetFromCube(OffsetCoord.EVEN, new Hex(1, -2, 1)) → (1, -1)
     */
    public static qoffsetFromCube(offset: number, h: Hex): OffsetCoord {
        var col: number = h.q;
        var row: number = h.r + (h.q + offset * (h.q & 1)) / 2;
        if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
            throw "offset must be EVEN (+1) or ODD (-1)";
        }
        return new OffsetCoord(col, row);
    }

    /**
     * 将列偏移坐标转换回立方体坐标（逆向转换）
     * @param offset 偏移模式（EVEN 或 ODD）
     * @param h 列偏移坐标系下的坐标
     * @returns 立方体坐标系下的六边形坐标
     * @example
     * 列偏移坐标(3, 2) 奇数列模式转换：
     * OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(3, 2)) → Hex(3, 0, -3)
     */
    public static qoffsetToCube(offset: number, h: OffsetCoord): Hex {
        var q: number = h.col;
        var r: number = h.row - (h.col + offset * (h.col & 1)) / 2;
        var s: number = -q - r;
        if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
            throw "offset must be EVEN (+1) or ODD (-1)";
        }
        return new Hex(q, r, s);
    }

    /**
     * 从立方体坐标转换为行偏移坐标（适用于行对齐布局）
     * @param offset 偏移模式（EVEN 或 ODD）
     * @param h 立方体坐标系下的六边形坐标
     * @returns 行偏移坐标
     * @example
     * Hex(2, -1, -1) 转换为奇数行偏移坐标：
     * OffsetCoord.roffsetFromCube(OffsetCoord.ODD, new Hex(2, -1, -1)) → (2, -1)
     */
    public static roffsetFromCube(offset: number, h: Hex): OffsetCoord {
        var col: number = h.q + (h.r + offset * (h.r & 1)) / 2;
        var row: number = h.r;
        if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
            throw "offset must be EVEN (+1) or ODD (-1)";
        }
        return new OffsetCoord(col, row);
    }

    /**
     * 将行偏移坐标转换回立方体坐标（逆向转换）
     * @param offset 偏移模式（EVEN 或 ODD）
     * @param h 行偏移坐标系下的坐标
     * @returns 立方体坐标系下的六边形坐标
     * @example
     * 行偏移坐标(4, 3) 偶数行模式转换：
     * OffsetCoord.roffsetToCube(OffsetCoord.EVEN, new OffsetCoord(4, 3)) → Hex(3, 3, -6)
     */
    public static roffsetToCube(offset: number, h: OffsetCoord): Hex {
        var q: number = h.col - (h.row + offset * (h.row & 1)) / 2;
        var r: number = h.row;
        var s: number = -q - r;
        if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
            throw "offset must be EVEN (+1) or ODD (-1)";
        }
        return new Hex(q, r, s);
    }
}

/**
 * 双倍坐标系（用于消除奇偶偏移的坐标系统）
 * @remarks
 * - 通过将坐标分量加倍来避免分数坐标
 * - 提供两种双倍坐标系：q双倍和r双倍
 * - 适用于需要整数坐标存储的场景
 * 
 * @example
 * // 创建双倍坐标：
 * const doubledQ = DoubledCoord.qdoubledFromCube(new Hex(2, -1, -1));
 * const doubledR = DoubledCoord.rdoubledFromCube(new Hex(3, 0, -3));
 */
export class DoubledCoord {
    constructor(public col: number, public row: number) { }

    /**
     * 从立方体坐标转换为q双倍坐标
     * @param h 立方体坐标系下的六边形坐标
     * @returns q双倍坐标系实例
     * @example 
     * Hex(3, -2, -1) → (3, 2*-2 +3) = (3, -1)
     * DoubledCoord.qdoubledFromCube(new Hex(3, -2, -1)) → (3, -1)
     */
    public static qdoubledFromCube(h: Hex): DoubledCoord {
        var col: number = h.q;
        var row: number = 2 * h.r + h.q;
        return new DoubledCoord(col, row);
    }

    /**
     * 将q双倍坐标转换回立方体坐标
     * @returns 立方体坐标系下的六边形坐标
     * @example
     * DoubledCoord(5, 3) → 
     * q = 5, r = (3 -5)/2 = -1 → Hex(5, -1, -4)
     */
    public qdoubledToCube(): Hex {
        var q: number = this.col;
        var r: number = (this.row - this.col) / 2;
        var s: number = -q - r;
        return new Hex(q, r, s);
    }

    /**
     * 从立方体坐标转换为r双倍坐标
     * @param h 立方体坐标系下的六边形坐标
     * @returns r双倍坐标系实例
     * @example
     * Hex(2, 3, -5) → (2*2 +3, 3) = (7, 3)
     * DoubledCoord.rdoubledFromCube(new Hex(2, 3, -5)) → (7, 3)
     */
    public static rdoubledFromCube(h: Hex): DoubledCoord {
        var col: number = 2 * h.q + h.r;
        var row: number = h.r;
        return new DoubledCoord(col, row);
    }

    /**
     * 将r双倍坐标转换回立方体坐标
     * @returns 立方体坐标系下的六边形坐标
     * @example
     * DoubledCoord(4, 2) →
     * q = (4 -2)/2 = 1, r = 2 → Hex(1, 2, -3)
     */
    public rdoubledToCube(): Hex {
        var q: number = (this.col - this.row) / 2;
        var r: number = this.row;
        var s: number = -q - r;
        return new Hex(q, r, s);
    }
}

export class Orientation {
    constructor(public f0: number, public f1: number, public f2: number, public f3: number, public b0: number, public b1: number, public b2: number, public b3: number, public start_angle: number) { }
}

/**
 * 六边形布局类（用于坐标转换）
 * @remarks
 * - 处理六边形网格与屏幕像素坐标之间的相互转换
 * - 支持pointy-top（尖顶）和flat-top（平顶）两种朝向
 * - 包含六边形轮廓生成方法
 * 
 * @example
 * // 创建平顶布局：
 * const layout = HexLayout.new(HexLayout.flat, new Point(100, 100), 50, 50);
 */
export class HexLayout {
    /**
     * 工厂方法创建布局实例
     * @param orientation 朝向配置（使用预定义的flat/pointy）
     * @param origin 网格原点坐标（通常为屏幕中心点）
     * @param width 六边形宽度（单位：像素）
     * @param height 六边形高度（单位：像素）
     * @example
     * // 创建尖顶布局，原点在(0,0)，六边形宽高60x40：
     * HexLayout.new(HexLayout.pointy, new Point(0,0), 60, 40);
     */
    public static new(orientation: Orientation, origin: Point, width: number, height: number) {
        let size: Point;
        // 根据朝向计算实际尺寸（考虑六边形几何特性）
        if (orientation == this.flat) size = new Point(width / 2, height / Math.sqrt(3));      // 平顶布局尺寸计算
        else if (orientation == this.pointy) size = new Point(width / Math.sqrt(3), height / 2); // 尖顶布局尺寸计算
        return new HexLayout(orientation, size, origin);
    }

    constructor(
        public orientation: Orientation, // 朝向配置对象
        public size: Point,              // 六边形实际尺寸（经过朝向计算的）
        public origin: Point             // 网格原点偏移量
    ) { }

    /** 预定义的尖顶朝向配置（用于纵向六边形） */
    public static pointy: Orientation = new Orientation(
        Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0,  // 前向矩阵系数
        Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0,      // 反向矩阵系数
        0.5                                                    // 起始角度偏移
    );

    /** 预定义的平顶朝向配置（用于横向六边形） */
    public static flat: Orientation = new Orientation(
        3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0),  // 前向矩阵系数
        2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0,      // 反向矩阵系数
        0.0                                                     // 起始角度偏移
    );

    /**
     * 六边形坐标转像素坐标
     * @param h 六边形坐标
     * @returns 对应的像素坐标中心点
     * @example
     * // 当size为(30,40)，origin为(100,100)时：
     * hexToPixel(Hex.new(1, 0)) → Point(130, 100)
     */
    public hexToPixel(h: Hex): Point {
        var M: Orientation = this.orientation;
        var size: Point = this.size;
        var origin: Point = this.origin;
        // 应用朝向矩阵进行坐标变换
        var x: number = (M.f0 * h.q + M.f1 * h.r) * size.x;
        var y: number = (M.f2 * h.q + M.f3 * h.r) * size.y;
        return new Point(x + origin.x, y + origin.y);
    }

    /**
     * 像素坐标转六边形坐标
     * @param p 像素坐标
     * @returns 对应的六边形坐标（需四舍五入取整）
     * @example
     * // 当size为(30,40)，origin为(100,100)时：
     * pixelToHex(Point(115, 95)) → Hex(0.5, -0.25) → 四舍五入为Hex(1, 0)
     */
    public pixelToHex(p: Point): Hex {
        var M: Orientation = this.orientation;
        var size: Point = this.size;
        var origin: Point = this.origin;
        // 归一化到布局空间
        var pt: Point = new Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
        // 应用反向矩阵计算六边形坐标
        var q: number = M.b0 * pt.x + M.b1 * pt.y;
        var r: number = M.b2 * pt.x + M.b3 * pt.y;
        return new Hex(q, r, -q - r);
    }

    /**
     * 计算单个顶点的偏移量
     * @param corner 顶点序号（0-5，0为右上角顶点，顺时针方向）
     * @returns 该顶点相对于中心点的偏移量
     * @example
     * hexCornerOffset(0) → 计算右上角顶点位置
     */
    public hexCornerOffset(corner: number): Point {
        var M: Orientation = this.orientation;
        var size: Point = this.size;
        // 计算对应角度的弧度值（考虑起始角度偏移）
        var angle: number = 2.0 * Math.PI * (M.start_angle - corner) / 6.0;
        return new Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
    }

    /**
     * 生成六边形的六个顶点坐标
     * @param h 六边形坐标
     * @returns 六个顶点像素坐标数组（顺时针顺序）
     * @example
     * polygonCorners(Hex.zero) → 
     * [Point(100+30,100), Point(100+15,100+20), ...] // 中心点(100,100)，size(30,40)
     */
    public polygonCorners(h: Hex): Point[] {
        var corners: Point[] = [];
        var center: Point = this.hexToPixel(h);
        // 遍历六个顶点计算实际位置
        for (var i = 0; i < 6; i++) {
            var offset: Point = this.hexCornerOffset(i);
            corners.push(new Point(center.x + offset.x, center.y + offset.y));
        }
        return corners;
    }
}

/**test

class Tests {
    constructor() { }

    public static equalHex(name: String, a: Hex, b: Hex): void {
        if (!(a.q === b.q && a.s === b.s && a.r === b.r)) {
            complain(name);
        }
    }


    public static equalOffsetcoord(name: String, a: OffsetCoord, b: OffsetCoord): void {
        if (!(a.col === b.col && a.row === b.row)) {
            complain(name);
        }
    }


    public static equalDoubledcoord(name: String, a: DoubledCoord, b: DoubledCoord): void {
        if (!(a.col === b.col && a.row === b.row)) {
            complain(name);
        }
    }


    public static equalInt(name: String, a: number, b: number): void {
        if (!(a === b)) {
            complain(name);
        }
    }


    public static equalHexArray(name: String, a: Hex[], b: Hex[]): void {
        Tests.equalInt(name, a.length, b.length);
        for (var i = 0; i < a.length; i++) {
            Tests.equalHex(name, a[i], b[i]);
        }
    }


    public static testHexArithmetic(): void {
        Tests.equalHex("hex_add", new Hex(4, -10, 6), new Hex(1, -3, 2).add(new Hex(3, -7, 4)));
        Tests.equalHex("hex_subtract", new Hex(-2, 4, -2), new Hex(1, -3, 2).subtract(new Hex(3, -7, 4)));
    }


    public static testHexDirection(): void {
        Tests.equalHex("hex_direction", new Hex(0, -1, 1), Hex.direction(2));
    }


    public static testHexNeighbor(): void {
        Tests.equalHex("hex_neighbor", new Hex(1, -3, 2), new Hex(1, -2, 1).neighbor(2));
    }


    public static testHexDiagonal(): void {
        Tests.equalHex("hex_diagonal", new Hex(-1, -1, 2), new Hex(1, -2, 1).diagonalNeighbor(3));
    }


    public static testHexDistance(): void {
        Tests.equalInt("hex_distance", 7, new Hex(3, -7, 4).distance(new Hex(0, 0, 0)));
    }


    public static testHexRotateRight(): void {
        Tests.equalHex("hex_rotate_right", new Hex(1, -3, 2).rotateRight(), new Hex(3, -2, -1));
    }


    public static testHexRotateLeft(): void {
        Tests.equalHex("hex_rotate_left", new Hex(1, -3, 2).rotateLeft(), new Hex(-2, -1, 3));
    }


    public static testHexRound(): void {
        var a: Hex = new Hex(0.0, 0.0, 0.0);
        var b: Hex = new Hex(1.0, -1.0, 0.0);
        var c: Hex = new Hex(0.0, -1.0, 1.0);
        Tests.equalHex("hex_round 1", new Hex(5, -10, 5), new Hex(0.0, 0.0, 0.0).lerp(new Hex(10.0, -20.0, 10.0), 0.5).round());
        Tests.equalHex("hex_round 2", a.round(), a.lerp(b, 0.499).round());
        Tests.equalHex("hex_round 3", b.round(), a.lerp(b, 0.501).round());
        Tests.equalHex("hex_round 4", a.round(), new Hex(a.q * 0.4 + b.q * 0.3 + c.q * 0.3, a.r * 0.4 + b.r * 0.3 + c.r * 0.3, a.s * 0.4 + b.s * 0.3 + c.s * 0.3).round());
        Tests.equalHex("hex_round 5", c.round(), new Hex(a.q * 0.3 + b.q * 0.3 + c.q * 0.4, a.r * 0.3 + b.r * 0.3 + c.r * 0.4, a.s * 0.3 + b.s * 0.3 + c.s * 0.4).round());
    }


    public static testHexLinedraw(): void {
        Tests.equalHexArray("hex_linedraw", [new Hex(0, 0, 0), new Hex(0, -1, 1), new Hex(0, -2, 2), new Hex(1, -3, 2), new Hex(1, -4, 3), new Hex(1, -5, 4)], new Hex(0, 0, 0).linedraw(new Hex(1, -5, 4)));
    }


    public static testLayout(): void {
        var h: Hex = new Hex(3, 4, -7);
        var flat: Layout = new Layout(Layout.flat, new Point(10.0, 15.0), new Point(35.0, 71.0));
        Tests.equalHex("layout", h, flat.pixelToHex(flat.hexToPixel(h)).round());
        var pointy: Layout = new Layout(Layout.pointy, new Point(10.0, 15.0), new Point(35.0, 71.0));
        Tests.equalHex("layout", h, pointy.pixelToHex(pointy.hexToPixel(h)).round());
    }


    public static testOffsetRoundtrip(): void {
        var a: Hex = new Hex(3, 4, -7);
        var b: OffsetCoord = new OffsetCoord(1, -3);
        Tests.equalHex("conversion_roundtrip even-q", a, OffsetCoord.qoffsetToCube(OffsetCoord.EVEN, OffsetCoord.qoffsetFromCube(OffsetCoord.EVEN, a)));
        Tests.equalOffsetcoord("conversion_roundtrip even-q", b, OffsetCoord.qoffsetFromCube(OffsetCoord.EVEN, OffsetCoord.qoffsetToCube(OffsetCoord.EVEN, b)));
        Tests.equalHex("conversion_roundtrip odd-q", a, OffsetCoord.qoffsetToCube(OffsetCoord.ODD, OffsetCoord.qoffsetFromCube(OffsetCoord.ODD, a)));
        Tests.equalOffsetcoord("conversion_roundtrip odd-q", b, OffsetCoord.qoffsetFromCube(OffsetCoord.ODD, OffsetCoord.qoffsetToCube(OffsetCoord.ODD, b)));
        Tests.equalHex("conversion_roundtrip even-r", a, OffsetCoord.roffsetToCube(OffsetCoord.EVEN, OffsetCoord.roffsetFromCube(OffsetCoord.EVEN, a)));
        Tests.equalOffsetcoord("conversion_roundtrip even-r", b, OffsetCoord.roffsetFromCube(OffsetCoord.EVEN, OffsetCoord.roffsetToCube(OffsetCoord.EVEN, b)));
        Tests.equalHex("conversion_roundtrip odd-r", a, OffsetCoord.roffsetToCube(OffsetCoord.ODD, OffsetCoord.roffsetFromCube(OffsetCoord.ODD, a)));
        Tests.equalOffsetcoord("conversion_roundtrip odd-r", b, OffsetCoord.roffsetFromCube(OffsetCoord.ODD, OffsetCoord.roffsetToCube(OffsetCoord.ODD, b)));
    }


    public static testOffsetFromCube(): void {
        Tests.equalOffsetcoord("offset_from_cube even-q", new OffsetCoord(1, 3), OffsetCoord.qoffsetFromCube(OffsetCoord.EVEN, new Hex(1, 2, -3)));
        Tests.equalOffsetcoord("offset_from_cube odd-q", new OffsetCoord(1, 2), OffsetCoord.qoffsetFromCube(OffsetCoord.ODD, new Hex(1, 2, -3)));
    }


    public static testOffsetToCube(): void {
        Tests.equalHex("offset_to_cube even-", new Hex(1, 2, -3), OffsetCoord.qoffsetToCube(OffsetCoord.EVEN, new OffsetCoord(1, 3)));
        Tests.equalHex("offset_to_cube odd-q", new Hex(1, 2, -3), OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(1, 2)));
    }


    public static testDoubledRoundtrip(): void {
        var a: Hex = new Hex(3, 4, -7);
        var b: DoubledCoord = new DoubledCoord(1, -3);
        Tests.equalHex("conversion_roundtrip doubled-q", a, DoubledCoord.qdoubledFromCube(a).qdoubledToCube());
        Tests.equalDoubledcoord("conversion_roundtrip doubled-q", b, DoubledCoord.qdoubledFromCube(b.qdoubledToCube()));
        Tests.equalHex("conversion_roundtrip doubled-r", a, DoubledCoord.rdoubledFromCube(a).rdoubledToCube());
        Tests.equalDoubledcoord("conversion_roundtrip doubled-r", b, DoubledCoord.rdoubledFromCube(b.rdoubledToCube()));
    }


    public static testDoubledFromCube(): void {
        Tests.equalDoubledcoord("doubled_from_cube doubled-q", new DoubledCoord(1, 5), DoubledCoord.qdoubledFromCube(new Hex(1, 2, -3)));
        Tests.equalDoubledcoord("doubled_from_cube doubled-r", new DoubledCoord(4, 2), DoubledCoord.rdoubledFromCube(new Hex(1, 2, -3)));
    }


    public static testDoubledToCube(): void {
        Tests.equalHex("doubled_to_cube doubled-q", new Hex(1, 2, -3), new DoubledCoord(1, 5).qdoubledToCube());
        Tests.equalHex("doubled_to_cube doubled-r", new Hex(1, 2, -3), new DoubledCoord(4, 2).rdoubledToCube());
    }


    public static testAll(): void {
        Tests.testHexArithmetic();
        Tests.testHexDirection();
        Tests.testHexNeighbor();
        Tests.testHexDiagonal();
        Tests.testHexDistance();
        Tests.testHexRotateRight();
        Tests.testHexRotateLeft();
        Tests.testHexRound();
        Tests.testHexLinedraw();
        Tests.testLayout();
        Tests.testOffsetRoundtrip();
        Tests.testOffsetFromCube();
        Tests.testOffsetToCube();
        Tests.testDoubledRoundtrip();
        Tests.testDoubledFromCube();
        Tests.testDoubledToCube();
    }

}


function complain(name) { console.log("FAIL", name); }
Tests.testAll();
 */

