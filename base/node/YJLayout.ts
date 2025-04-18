import { EasingType, EasingTypeName } from 'NoUi3/types';
import { no } from '../../no';
import { Node, ccclass, executeInEditMode, property, Component, Enum, Vec2, v2, Vec3, v3, Size, NodeEventType } from '../../yj';

enum LayoutType {
    X = 1,
    Y = 2,
    XY = 12,
    YX = 21
}

enum LayoutDirection {
    ASC = 0,
    DESC
}
@ccclass('YJLayout')
@executeInEditMode()
/**
 * 布局组件，用于自动排列子节点
 */
export class YJLayout extends Component {
    /** 容器节点，如果不指定则使用当前节点 */
    @property({ type: Node })
    container: Node = null;

    /** 布局类型 */
    @property({ type: Enum(LayoutType), displayName: '布局类型', tooltip: '子节点在哪个/哪几个维度上排列，当有多个维度时，排列顺序为显示的维度顺序，如XZY表示先按X轴排列，再按Z轴排列，最后按Y轴排列' })
    public get type(): LayoutType {
        return this._type;
    }

    public set type(v: LayoutType) {
        this._type = v;
        this.updateLayout();
    }

    /** 是否自动对齐其他维度 */
    @property({ displayName: '自动对齐', tooltip: '当布局类型为某个维度时，自动对齐其他维度' })
    autoAlign: boolean = false;

    /** 子节点之间的间隔 */
    @property({ displayName: '间隔' })
    public get space(): Vec2 {
        return this._space;
    }

    public set space(v: Vec2) {
        this._space = v;
        this.updateLayout();
    }

    /** 容器内边距 */
    @property
    public get padding(): Vec2 {
        return this._padding;
    }

    public set padding(v: Vec2) {
        this._padding = v;
        this.updateLayout();
    }

    /** X轴排列方向 */
    @property({ type: Enum(LayoutDirection), tooltip: '子节点在x轴上的排列方向，ASC为从左到右，DESC为从右到左', visible() { return (this.type + '').includes('1'); } })
    public get xDirection(): LayoutDirection {
        return this._xDirection
    }

    public set xDirection(v: LayoutDirection) {
        this._xDirection = v;
        this.updateLayout();
    }

    /** Y轴排列方向 */
    @property({ type: Enum(LayoutDirection), tooltip: '子节点在y轴上的排列方向，ASC为从下到上，DESC为从上到下', visible() { return (this.type + '').includes('2'); } })
    public get yDirection(): LayoutDirection {
        return this._yDirection
    }

    public set yDirection(v: LayoutDirection) {
        this._yDirection = v;
        this.updateLayout();
    }

    /** X轴固定数量 */
    @property({ min: 1, step: 1, tooltip: 'x轴上的子节点固定数量', visible() { const t = this.type + ''; return t != '1' && t.includes('1') && !t.endsWith('1'); } })
    public get fixedX(): number {
        return this._fixedX;
    }

    public set fixedX(v: number) {
        this._fixedX = v;
        this.updateLayout();
    }

    /** Y轴固定数量 */
    @property({ min: 1, step: 1, tooltip: 'y轴上的子节点固定数量', visible() { const t = this.type + ''; return t != '2' && t.includes('2') && !t.endsWith('2'); } })
    public get fixedY(): number {
        return this._fixedY;
    }

    public set fixedY(v: number) {
        this._fixedY = v;
        this.updateLayout();
    }

    /** 是否启用缓动动画 */
    @property({ displayName: '支持缓动' })
    public get isTween(): boolean {
        return this._isTween;
    }

    public set isTween(v: boolean) {
        this._isTween = v;
    }

    /** 缓动动画时长 */
    @property({ displayName: '缓动时间', visible() { return this.isTween; } })
    public get duration(): number {
        return this._duration;
    }

    public set duration(v: number) {
        this._duration = v;
    }

    /** 缓动类型 */
    @property({ type: Enum(EasingType), visible() { return this.isTween; } })
    public get easing(): EasingType {
        return this._easing;
    }
    public set easing(v: EasingType) {
        this._easing = v;
    }

    /** 序列化属性 */
    @property({ serializable: true })
    _type: LayoutType = LayoutType.X;
    @property({ serializable: true })
    _space: Vec2 = v2();
    @property({ serializable: true })
    _padding: Vec2 = v2();
    @property({ serializable: true })
    _xDirection: LayoutDirection = LayoutDirection.ASC;
    @property({ serializable: true })
    _yDirection: LayoutDirection = LayoutDirection.ASC;
    @property({ serializable: true })
    _fixedX: number = 1;
    @property({ serializable: true })
    _fixedY: number = 1;
    @property({ serializable: true })
    _isTween: boolean = false;
    @property({ serializable: true })
    _duration: number = 1;
    @property({ serializable: true })
    _easing: EasingType = EasingType.LINEAR;

    /** 组件加载时初始化容器节点 */
    onLoad() {
        this.container = this.container || this.node;
    }

    /** 组件启用时注册子节点变化事件 */
    onEnable() {
        this.container.on(Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.container.on(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
        this.updateLayout();
    }

    /** 组件禁用时注销子节点变化事件 */
    onDisable() {
        this.container.off(Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.container.off(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
    }

    /** 添加子节点时的处理 */
    protected async _childAdded(child: Node) {
        await no.sleep(0.1);
        const s1 = no.size(this.container),
            anchar = no.anchor(this.container),
            s2 = no.size(child);
        const p = this.autoAlign ? v3(0, 0, 0) : no.position(child);
        if (this.type == LayoutType.X) {
            if (this.xDirection == LayoutDirection.ASC)
                p.x = s1.width * (1 - anchar.x) + s2.width + this.space.x;
            else
                p.x = -s1.width * anchar.x - s2.width - this.space.x;
        } else if (this.type == LayoutType.Y) {
            if (this.yDirection == LayoutDirection.ASC)
                p.y = s1.height * (1 - anchar.y) + s2.height + this.space.y;
            else
                p.y = -s1.height * anchar.y - s2.height - this.space.y;
        }
        no.position(child, p);
        this.updateLayout();
    }

    /** 移除子节点时的处理 */
    protected _childRemoved(child: Node) {
        this.updateLayout();
    }

    /** 更新布局 */
    private updateLayout() {
        if (this.container.children.length == 0) return;
        switch (this.type) {
            case LayoutType.X:
                this.layoutX();
                break;
            case LayoutType.Y:
                this.layoutY();
                break;
            case LayoutType.XY:
                this.layoutXY();
                break;
            case LayoutType.YX:
                this.layoutYX();
                break;
        }
    }

    /** 更新子节点位置并设置容器大小 */
    private updatePosition(poses: Vec3[], size: Vec2) {
        size.add(this.padding).add(this.padding);
        let containerSize = no.size(this.container);
        const anchor = no.anchor(this.container);
        const containerPos = no.position(this.container);
        no.size(this.container, new Size(size.x, size.y)); //设置容器大小
        if (this.type == LayoutType.X) {
            const ancharX = no.anchorX(this.container),
                sizeX = size.x * ancharX;
            for (let i = 0; i < poses.length; i++) {
                poses[i].x -= sizeX - this.padding.x;
            }
            if (this.xDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].x = -poses[i].x;
                }
            }
            containerPos.y += (anchor.y - 0.5) * (size.y - containerSize.y);
        }
        else if (this.type == LayoutType.Y) {
            const ancharY = no.anchorY(this.container),
                sizeY = size.y * ancharY;
            for (let i = 0; i < poses.length; i++) {
                poses[i].y -= sizeY - this.padding.y;
            }
            if (this.yDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].y = -poses[i].y;
                }
            }
            containerPos.x += (anchor.x - 0.5) * (size.x - containerSize.x);
        }
        else if (this.type == LayoutType.XY || this.type == LayoutType.YX) {
            const ancharX = no.anchorX(this.container),
                ancharY = no.anchorY(this.container),
                sizeX = size.x * ancharX,
                sizeY = size.y * ancharY;
            for (let i = 0; i < poses.length; i++) {
                poses[i].x -= sizeX - this.padding.x;
                poses[i].y -= sizeY - this.padding.y;
            }
            if (this.xDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].x = -poses[i].x;
                }
            }
            if (this.yDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].y = -poses[i].y;
                }
            }
        }

        no.position(this.container, containerPos);
        const children = this.container.children;
        //将poses赋值给children
        if (!this.isTween) {
            for (let i = 0; i < children.length; i++) {
                no.position(children[i], poses[i]);
            }
        } else {
            for (let i = 0; i < children.length; i++) {
                const p = poses[i], diff = this.duration / 2;
                const tween = {
                    duration: this.duration + i * diff,
                    to: 1,
                    props: {
                        pos: [p.x, p.y, p.z]
                    },
                    easing: EasingTypeName[this.easing]
                };
                no.TweenSet.play(no.parseTweenData(tween, children[i]));
            }
        }
    }

    /** 水平布局 */
    private layoutX() {
        const children = this.container.children;
        const poses: Vec3[] = [];
        const s: Vec2 = v2(0, 0);
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = this.autoAlign ? v3(0, 0, 0) : no.position(children[i]);
        }
        let x = 0;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const size = this.getChildSize(child);
            if (i > 0) {
                s.x += this.space.x;
                x += this.space.x;
            }
            x += size.x / 2;
            poses[i].x = x;
            x += size.x / 2;
            s.x += size.x;
            if (size.y > s.y) {
                s.y = size.y;
            }
        }
        this.updatePosition(poses, s);
    }

    /** 垂直布局 */
    private layoutY() {
        const children = this.container.children;
        const poses: Vec3[] = [];
        const s: Vec2 = v2(0, 0);
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = this.autoAlign ? v3(0, 0, 0) : no.position(children[i]);
        }
        let y = 0;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const size = this.getChildSize(child);
            if (i > 0) {
                s.y += this.space.y;
                y += this.space.y;
            }
            y += size.y / 2;
            poses[i].y = y;
            y += size.y / 2;
            s.y += size.y;
            if (size.x > s.x) {
                s.x = size.x;
            }
        }
        this.updatePosition(poses, s);
    }

    /** 先水平后垂直布局 */
    private layoutXY() {
        const children = this.container.children;
        const poses: Vec3[] = [];
        const s: Vec2 = v2();
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = no.position(children[i]);
            poses[i].x = 0;
            poses[i].y = 0;
        }
        let x = 0, w = 0, h = 0;
        for (let i = 0; ; i++) {
            x = 0;
            w = 0;
            h = 0;
            if (i > 0) s.y += this.space.y;
            for (let j = 0; j < this.fixedX; j++) {
                const idx = i * this.fixedX + j;
                if (!poses[idx]) {
                    s.y += h;
                    return this.updatePosition(poses, s);
                }
                const child = children[idx];
                const size = this.getChildSize(child);
                if (size) {
                    if (j > 0) {
                        w += this.space.x;
                        x += this.space.x;
                    }
                    if (i > 0) {
                        poses[idx].y += this.space.y;
                    }
                    x += size.x / 2;
                    poses[idx].x = x;
                    poses[idx].y += size.y / 2;
                    if (poses[idx + this.fixedX])
                        poses[idx + this.fixedX].y += poses[idx].y + size.y / 2;
                    x += size.x / 2;
                    w += size.x;
                    if (size.y > h) {
                        h = size.y;
                    }
                }
            }
            if (w > s.x) {
                s.x = w;
            }
            s.y += h;
        }
    }

    /** 先垂直后水平布局 */
    private layoutYX() {
        const children = this.container.children;
        const poses: Vec3[] = [];
        const s: Vec2 = v2();
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = no.position(children[i]);
            poses[i].x = 0;
            poses[i].y = 0;
        }
        let y = 0, w = 0, h = 0;
        for (let i = 0; ; i++) {
            y = 0;
            w = 0;
            h = 0
            for (let j = 0; j < this.fixedY; j++) {
                const idx = i * this.fixedY + j;
                if (!poses[idx]) {
                    s.x += h;
                    return this.updatePosition(poses, s);
                }
                const child = children[idx];
                const size = this.getChildSize(child);
                if (size) {
                    if (j > 0) {
                        w += this.space.y;
                        y += this.space.y;
                    }
                    if (i > 0) {
                        poses[idx].x += this.space.x;
                    }
                    y += size.y / 2;
                    poses[idx].y = y;
                    poses[idx].x += size.x / 2;
                    if (poses[idx + this.fixedY])
                        poses[idx + this.fixedY].x += poses[idx].x + size.x / 2;
                    y += size.y / 2;
                    w += size.y;
                    if (size.x > h) {
                        h = size.x;
                    }
                }
            }
            if (w > s.y) {
                s.y = w;
            }
            s.x += h;
        }
    }

    /** 获取子节点实际大小(考虑缩放) */
    private getChildSize(child: Node) {
        const size = no.size(child),
            scale = no.scale(child);
        size.x *= scale.x;
        size.y *= scale.y;
        return size;
    }
}
