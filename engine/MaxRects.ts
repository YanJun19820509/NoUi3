import { math, Vec2 } from "cc";


//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
let _padding: number;
/**
 * 矩形区域封装类
 * @description 用于处理矩形区域的创建、切割、比较等操作，支持带间距的布局计算
 * @example
 * // 创建矩形并切割
 * const rect = new Rect(0, 0, 100, 100);
 * const fragments = rect.cut(30, 30, 40, 40); // 在(30,30)位置切割40x40区域
 */
class Rect {
    /** 基础矩形对象 */
    public rect: math.Rect;
    /** 唯一标识符（格式:x_y_w_h） */
    public id: string;

    /**
     * 构造函数
     * @param x 矩形左上角X坐标
     * @param y 矩形左上角Y坐标
     * @param w 矩形宽度
     * @param h 矩形高度
     */
    constructor(x: number, y: number, w: number, h: number) {
        this.set(x, y, w, h);
    }

    /**
     * 静态工厂方法创建新矩形
     * @example
     * const rect = Rect.new(10, 10, 80, 80);
     */
    public static new(x: number, y: number, w: number, h: number): Rect {
        return new Rect(x, y, w, h);
    }

    /**
     * 设置矩形参数并生成唯一ID
     * @param x 新X坐标
     * @param y 新Y坐标
     * @param w 新宽度
     * @param h 新高度
     */
    public set(x: number, y: number, w: number, h: number) {
        this.rect = math.rect(x, y, w, h);
        this.id = `${x}_${y}_${w}_${h}`;
    }

    /**
     * 切割当前矩形为多个子矩形
     * @param x 切割起始点X坐标
     * @param y 切割起始点Y坐标
     * @param w 切割区域宽度
     * @param h 切割区域高度
     * @returns 切割后剩余的可用矩形数组
     * @example
     * // 原始矩形100x100，在(20,20)切割40x40区域后：
     * // 将生成左侧20-padding宽区域和下方剩余区域
     */
    public cut(x: number, y: number, w: number, h: number): Rect[] {
        let r = this.rect;
        let a: Rect[] = [];

        // 处理左侧/上方的剩余空间
        if (x > r.x + _padding)
            a[a.length] = Rect.new(r.x, r.y, x - r.x - _padding, r.height);
        else if (y > r.y + _padding)
            a[a.length] = Rect.new(r.x, r.y, r.width, y - r.y - _padding);

        // 生成下方和右侧的剩余区域
        let r1 = Rect.new(r.x, y + h + _padding, r.width, r.height - h + r.y - y - _padding); // 下方剩余区域
        let r2 = Rect.new(x + w + _padding, r.y, r.width - w + r.x - x - _padding, r.height); // 右侧剩余区域

        // 过滤无效矩形
        if (r1.rect.width > 0 && r1.rect.height > 0) a[a.length] = r1;
        if (r2.rect.width > 0 && r2.rect.height > 0) a[a.length] = r2;
        return a;
    }

    /**
     * 判断是否与指定参数相同
     * @param x 比较X坐标
     * @param y 比较Y坐标
     * @param w 比较宽度
     * @param h 比较高度
     */
    public isEqual(x: number, y: number, w: number, h: number): boolean {
        return this.id == `${x}_${y}_${w}_${h}`;
    }

    /**
     * 判断是否与另一个矩形相同
     * @param r 比较的矩形对象
     */
    public equalTo(r: Rect): boolean {
        if (!r) return false;
        return this.id == r.id;
    }

    /**
     * 判断是否能容纳指定尺寸
     * @param w 需要容纳的宽度
     * @param h 需要容纳的高度
     */
    public includes(w: number, h: number): boolean {
        return this.rect.width >= w && this.rect.height >= h;
    }

    /**
     * 判断是否完全包含另一个矩形
     * @param r 被检查的矩形对象
     */
    public contains(r: Rect): boolean {
        if (!r) return false;
        return this.rect.containsRect(r.rect);
    }

    /**
     * 检查是否保存指定原点坐标
     * @param origin 要检查的原点坐标
     * @returns 原点是否匹配
     */
    public saveOrigin(origin: Vec2): boolean {
        return this.rect.origin.equals(origin);
    }
}

/**
 * 最大矩形算法实现（用于2D空间布局优化）
 * @description 实现基于MaxRects算法的空间管理，支持动态添加/移除矩形区域
 * @example
 * // 创建1024x1024画布，默认2像素间距
 * const packer = new MaxRects(1024, 1024);
 * 
 * // 查找适合200x300的放置位置
 * const pos = packer.find(200, 300);
 * if (pos) {
 *   console.log(`可放置位置：${pos.x},${pos.y}`);
 * }
 * 
 * // 释放一个已使用的区域
 * packer.reuseRect(50, 50, 200, 300);
 */
export class MaxRects {
    // 存储所有可用矩形区域
    private _rects: Rect[] = [];

    /**
     * 构造函数初始化画布空间
     * @param width 画布总宽度
     * @param height 画布总高度
     * @param padding 矩形之间的最小间隔（默认2像素）
     */
    constructor(width: number, height: number, padding = 2) {
        _padding = padding;
        // 初始化时添加可用区域（扣除padding后的实际可用区域）
        this._addRect(_padding, _padding, width - _padding * 2, height - _padding * 2);
    }

    /**
     * 获取当前所有空闲区域的副本
     * @returns 数学矩形对象数组
     */
    public get lastRects(): math.Rect[] {
        let a: math.Rect[] = [];
        for (let i = 0; i < this._rects.length; i++) {
            a[a.length] = this._rects[i].rect;
        }
        return a;
    }

    /**
     * 查找适合指定尺寸的放置位置
     * @param w 需要放置的矩形宽度
     * @param h 需要放置的矩形高度
     * @returns 可用位置的左上角坐标，若无合适位置返回null
     */
    public find(w: number, h: number): Vec2 {
        // 按面积升序->Y坐标升序->X坐标升序排序
        this._rects.sort((a, b) => {
            return (a.rect.width * a.rect.height - b.rect.width * b.rect.height) || (a.rect.y - b.rect.y) || (a.rect.x - b.rect.x);
        });

        // 寻找第一个能容纳目标尺寸的矩形
        let idx = -1;
        for (let i = 0, n = this._rects.length; i < n; i++) {
            if (this._rects[i].includes(w, h)) {
                idx = i;
                break;
            }
        }
        if (idx == -1) return null;

        // 取出并使用该矩形区域
        let use = this._rects.splice(idx, 1)[0];
        // 检查是否存在更优的原点匹配
        let r = this._getRectByOrigin(use.rect.origin);
        if (r && r.includes(use.rect.width, use.rect.height)) {
            use = r;
        }

        // 切割已使用的区域
        let cuts = use.cut(use.rect.x, use.rect.y, w, h);
        let a = this._createRect(use.rect.origin.x, use.rect.origin.y, w, h);

        // 处理重叠区域
        for (let i = this._rects.length - 1; i >= 0; i--) {
            if (a.contains(this._rects[i])) {
                this._rects.splice(i, 1);
            } else if (this._rects[i].rect.intersects(a.rect)) {
                let b = this._rects.splice(i, 1)[0];
                let c = b.cut(a.rect.x, a.rect.y, a.rect.width, a.rect.height);
                cuts = this._mergeRects(c, cuts);
            }
        }

        // 合并剩余区域
        this._rects = this._mergeRects(cuts, this._rects);
        return use.rect.origin;
    }

    /**
     * 重新使用已释放的矩形区域
     * @param x 释放区域的X坐标
     * @param y 释放区域的Y坐标
     * @param w 释放区域的宽度
     * @param h 释放区域的高度
     * @example
     * // 释放一个200x300的区域
     * packer.reuseRect(50, 50, 200, 300);
     */
    public reuseRect(x: number, y: number, w: number, h: number): void {
        let r = Rect.new(x, y, w, h);
        this._rects = this._joinRects(r, this._rects);
    }

    /**
     * 根据原点查找并移除矩形
     * @param origin 要查找的原点坐标
     * @param remove 是否移除找到的矩形（默认true）
     * @returns 找到的矩形对象或undefined
     */
    private _getRectByOrigin(origin: Vec2, remove = true): Rect {
        for (let i = 0, n = this._rects.length; i < n; i++) {
            if (this._rects[i].saveOrigin(origin)) {
                return remove ? this._rects.splice(i, 1)[0] : this._rects[i];
            }
        }
    }

    /**
     * 创建新的矩形对象
     * @param x 起始X坐标
     * @param y 起始Y坐标
     * @param w 矩形宽度
     * @param h 矩形高度
     * @returns 新矩形对象或null（无效尺寸时）
     */
    private _createRect(x: number, y: number, w: number, h: number): Rect {
        return w >= 0 && h >= 0 ? Rect.new(x, y, w, h) : null;
    }

    /**
     * 添加新矩形到管理列表
     * @param x 起始X坐标
     * @param y 起始Y坐标
     * @param w 矩形宽度
     * @param h 矩形高度
     */
    private _addRect(x: number, y: number, w: number, h: number) {
        const r = this._createRect(x, y, w, h);
        r && this._rects.push(r);
    }

    /**
     * 合并两个矩形数组（去重+消除包含关系）
     * @param arr 需要合并的新矩形数组
     * @param target 目标数组
     * @returns 合并后的新数组
     */
    private _mergeRects(arr: Rect[], target: Rect[]): Rect[] {
        // 双向消除包含关系
        for (let i = arr.length - 1; i >= 0; i--) {
            for (let j = target.length - 1; j >= 0; j--) {
                if (target[j].rect.containsRect(arr[i].rect)) {
                    arr.splice(i, 1);
                    break;
                } else if (arr[i].rect.containsRect(target[j].rect)) {
                    target.splice(j, 1);
                } else if (arr[i].id === target[j].id) {
                    arr.splice(i, 1);
                    break;
                }
            }
        }
        return target.concat(arr);
    }

    /**
     * 连接相邻矩形（自动合并相邻区域）
     * @param r 要连接的矩形
     * @param target 目标数组
     * @returns 合并后的新数组
     */
    private _joinRects(r: Rect, target: Rect[]): Rect[] {
        let b: Rect;
        for (let j = target.length - 1; j >= 0; j--) {
            b = target[j];
            // 垂直方向相邻检测
            if (b.rect.x === r.rect.x && b.rect.width === r.rect.width) {
                if (this._tryMergeVertical(r, b)) {
                    return this._joinRects(b, target.filter(item => item !== b));
                }
            }
            // 水平方向相邻检测
            else if (b.rect.y === r.rect.y && b.rect.height === r.rect.height) {
                if (this._tryMergeHorizontal(r, b)) {
                    return this._joinRects(b, target.filter(item => item !== b));
                }
            }
        }
        target.push(r);
        return target;
    }

    /** 尝试垂直合并 */
    private _tryMergeVertical(a: Rect, b: Rect): boolean {
        const padding = _padding;
        if (b.rect.y === a.rect.y + a.rect.height + padding) {
            b.rect.y = a.rect.y;
            b.rect.height += a.rect.height + padding;
            return true;
        } else if (a.rect.y === b.rect.y + b.rect.height + padding) {
            b.rect.height += a.rect.height + padding;
            return true;
        }
        return false;
    }

    /** 尝试水平合并 */
    private _tryMergeHorizontal(a: Rect, b: Rect): boolean {
        const padding = _padding;
        if (b.rect.x === a.rect.x + a.rect.width + padding) {
            b.rect.x = a.rect.x;
            b.rect.width += a.rect.width + padding;
            return true;
        } else if (a.rect.x === b.rect.x + b.rect.width + padding) {
            b.rect.width += a.rect.width + padding;
            return true;
        }
        return false;
    }
}
