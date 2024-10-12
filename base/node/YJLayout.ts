import { EasingType, EasingTypeName } from 'NoUi3/types';
import { no } from '../../no';
import { Node, ccclass, executeInEditMode, property, Component, Enum, Vec2, v2, Vec3, v3, Size, NodeEventType } from '../../yj';

enum LayoutType {
    X = 1,
    Y = 2,
}

enum LayoutDirection {
    ASC = 0,
    DESC
}
@ccclass('YJLayout')
@executeInEditMode()
export class YJLayout extends Component {
    @property({ type: Node })
    container: Node = null;
    @property({ type: Enum(LayoutType), displayName: '布局类型', tooltip: '子节点在哪个/哪几个维度上排列，当有多个维度时，排列顺序为显示的维度顺序，如XZY表示先按X轴排列，再按Z轴排列，最后按Y轴排列' })
    public get type(): LayoutType {
        return this._type;
    }

    public set type(v: LayoutType) {
        this._type = v;
        this.updateLayout();
    }
    @property({ displayName: '自动对齐', tooltip: '当布局类型为某个维度时，自动对齐其他维度' })
    autoAlign: boolean = false;
    @property({ displayName: '间隔' })
    public get space(): Vec2 {
        return this._space;
    }

    public set space(v: Vec2) {
        this._space = v;
        this.updateLayout();
    }
    @property
    public get padding(): number {
        return this._padding;
    }

    public set padding(v: number) {
        this._padding = v;
        this.updateLayout();
    }
    @property({ type: Enum(LayoutDirection), tooltip: '子节点在x轴上的排列方向，ASC为从左到右，DESC为从右到左', visible() { return (this.type + '').includes('1'); } })
    public get xDirection(): LayoutDirection {
        return this._xDirection
    }

    public set xDirection(v: LayoutDirection) {
        this._xDirection = v;
        this.updateLayout();
    }
    @property({ type: Enum(LayoutDirection), tooltip: '子节点在y轴上的排列方向，ASC为从下到上，DESC为从上到下', visible() { return (this.type + '').includes('2'); } })
    public get yDirection(): LayoutDirection {
        return this._yDirection
    }

    public set yDirection(v: LayoutDirection) {
        this._yDirection = v;
        this.updateLayout();
    }
    @property({ min: 1, step: 1, tooltip: 'x轴上的子节点固定数量', visible() { const t = this.type + ''; return t != '1' && t.includes('1') && !t.endsWith('1'); } })
    public get fixedX(): number {
        return this._fixedX;
    }

    public set fixedX(v: number) {
        this._fixedX = v;
        this.updateLayout();
    }
    @property({ min: 1, step: 1, tooltip: 'y轴上的子节点固定数量', visible() { const t = this.type + ''; return t != '2' && t.includes('2') && !t.endsWith('2'); } })
    public get fixedY(): number {
        return this._fixedY;
    }

    public set fixedY(v: number) {
        this._fixedY = v;
        this.updateLayout();
    }

    @property({ displayName: '支持缓动' })
    public get isTween(): boolean {
        return this._isTween;
    }

    public set isTween(v: boolean) {
        this._isTween = v;
    }
    @property({ displayName: '缓动时间', visible() { return this.isTween; } })
    public get duration(): number {
        return this._duration;
    }

    public set duration(v: number) {
        this._duration = v;
    }
    @property({ type: Enum(EasingType), visible() { return this.isTween; } })
    public get easing(): EasingType {
        return this._easing;
    }
    public set easing(v: EasingType) {
        this._easing = v;
    }


    @property({ serializable: true })
    _type: LayoutType = LayoutType.X;
    @property({ serializable: true })
    _space: Vec2 = v2();
    @property({ serializable: true })
    _padding: number = 0;
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


    onLoad() {
        this.container = this.container || this.node;
    }

    onEnable() {
        this.container.on(Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.container.on(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
        this.updateLayout();
    }

    onDisable() {
        this.container.off(Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.container.off(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
    }

    protected _childAdded(child: Node) {
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

    protected _childRemoved(child: Node) {
        this.updateLayout();
    }

    private updateLayout() {
        if (this.container.children.length == 0) return;
        switch (this.type) {
            case LayoutType.X:
                this.layoutX();
                break;
            case LayoutType.Y:
                this.layoutY();
                break;
        }
    }

    private updatePosition(poses: Vec3[], size: Vec2) {
        no.size(this.container, new Size(size.x, size.y)); //设置容器大小
        if (this.type == LayoutType.X) {
            const ancharX = no.anchorX(this.container),
                sizeX = size.x * ancharX;
            for (let i = 0; i < poses.length; i++) {
                poses[i].x -= sizeX;
            }
            if (this.xDirection == LayoutDirection.DESC)
                no.sortArray(poses, (a, b) => b.x - a.x);
        }
        else if (this.type == LayoutType.Y) {
            const ancharY = no.anchorY(this.container),
                sizeY = size.y * ancharY;
            for (let i = 0; i < poses.length; i++) {
                poses[i].y -= sizeY;
            }
            if (this.yDirection == LayoutDirection.DESC)
                no.sortArray(poses, (a, b) => b.y - a.y);
        }

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

    private layoutX() {
        const children = this.container.children;
        const poses: Vec3[] = [];
        const s: Vec2 = v2();
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = this.autoAlign ? v3(0, 0, 0) : no.position(children[i]);
        }
        let x = this.padding;
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

    private layoutY() {
        const children = this.container.children;
        const poses: Vec3[] = [];
        const s: Vec2 = v2();
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = this.autoAlign ? v3(0, 0, 0) : no.position(children[i]);
        }
        let y = this.padding;
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

    private getChildSize(child: Node) {
        const size = no.size(child),
            scale = no.scale(child);
        size.x *= scale.x;
        size.y *= scale.y;
        return size;
    }
}
