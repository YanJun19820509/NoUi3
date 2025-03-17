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
    /** 
     * 容器节点，如果不指定则使用当前节点
     * @example
     * // 将ScrollView的content节点作为布局容器
     * @property container: find('Canvas/ScrollView/content')
     */
    @property({ type: Node })
    container: Node = null;

    /** 
     * 布局类型（使用LayoutType枚举）
     * @remarks 
     * - 1:X轴排列
     * - 2:Y轴排列
     * - 12:先X后Y（网格布局）
     * - 21:先Y后X（垂直列表）
     * @example
     * // 创建水平排列的工具栏
     * type: LayoutType.X
     * // 创建3x3网格布局
     * type: LayoutType.XY
     * fixedX: 3
     * fixedY: 3
     */
    @property({ type: Enum(LayoutType), displayName: '布局类型', tooltip: '子节点在哪个/哪几个维度上排列，当有多个维度时，排列顺序为显示的维度顺序，如XZY表示先按X轴排列，再按Z轴排列，最后按Y轴排列' })
    public get type(): LayoutType {
        return this._type;
    }

    public set type(v: LayoutType) {
        this._type = v;
        this.updateLayout();
    }

    /** 
     * 是否自动对齐其他维度
     * @example
     * // 水平排列时自动垂直居中
     * autoAlign: true
     * // 网格布局时自动居中对齐
     * autoAlign: true
     */
    @property({ displayName: '自动对齐', tooltip: '当布局类型为某个维度时，自动对齐其他维度\n（如水平排列时自动垂直居中）' })
    autoAlign: boolean = false;

    /** 
     * 子节点之间的间隔（Vec2类型，x=水平间隔，y=垂直间隔）
     * @example
     * // 设置水平间隔10，垂直间隔20
     * space: v2(10, 20)
     */
    @property({ displayName: '间隔' })
    public get space(): Vec2 {
        return this._space;
    }

    public set space(v: Vec2) {
        this._space = v;
        this.updateLayout();
    }

    /** 
     * 容器内边距（Vec2类型，x=左右边距，y=上下边距）
     * @example
     * // 设置左右边距20，上下边距10
     * padding: v2(20, 10)
     */
    @property
    public get padding(): Vec2 {
        return this._padding;
    }

    public set padding(v: Vec2) {
        this._padding = v;
        this.updateLayout();
    }

    /** 
     * X轴排列方向（当布局类型包含X轴时可见）
     * @remarks 
     * - ASC: 从左到右（默认）
     * - DESC: 从右到左
     * @example
     * // 阿拉伯语界面从右到左排列
     * xDirection: LayoutDirection.DESC
     */
    @property({ type: Enum(LayoutDirection), tooltip: '子节点在x轴上的排列方向，ASC为从左到右，DESC为从右到左', visible() { return (this.type + '').includes('1'); } })
    public get xDirection(): LayoutDirection {
        return this._xDirection
    }

    public set xDirection(v: LayoutDirection) {
        this._xDirection = v;
        this.updateLayout();
    }

    /** 
     * Y轴排列方向（当布局类型包含Y轴时可见）
     * @remarks 
     * - ASC: 从下到上（默认）
     * - DESC: 从上到下
     * @example
     * // 聊天消息从上到下排列
     * yDirection: LayoutDirection.DESC
     */
    @property({ type: Enum(LayoutDirection), tooltip: '子节点在y轴上的排列方向，ASC为从下到上，DESC为从上到下', visible() { return (this.type + '').includes('2'); } })
    public get yDirection(): LayoutDirection {
        return this._yDirection
    }

    public set yDirection(v: LayoutDirection) {
        this._yDirection = v;
        this.updateLayout();
    }

    /** 
     * X轴固定数量（当布局为多维度且非最后维度时可见）
     * @remarks 用于网格布局时指定每行/列的最大元素数
     * @example
     * // 3列布局
     * fixedX: 3
     */
    @property({ min: 1, step: 1, tooltip: 'x轴上的子节点固定数量', visible() { const t = this.type + ''; return t != '1' && t.includes('1') && !t.endsWith('1'); } })
    public get fixedX(): number {
        return this._fixedX;
    }

    public set fixedX(v: number) {
        this._fixedX = v;
        this.updateLayout();
    }

    /** 
     * Y轴固定数量（当布局为多维度且非最后维度时可见）
     * @example
     * // 4行布局
     * fixedY: 4
     */
    @property({ min: 1, step: 1, tooltip: 'y轴上的子节点固定数量', visible() { const t = this.type + ''; return t != '2' && t.includes('2') && !t.endsWith('2'); } })
    public get fixedY(): number {
        return this._fixedY;
    }

    public set fixedY(v: number) {
        this._fixedY = v;
        this.updateLayout();
    }

    /** 
     * 是否启用缓动动画
     * @example
     * // 启用元素位置变化的缓动效果
     * isTween: true
     * duration: 0.5
     */
    @property({ displayName: '支持缓动' })
    public get isTween(): boolean {
        return this._isTween;
    }

    public set isTween(v: boolean) {
        this._isTween = v;
    }

    /** 
     * 缓动动画时长（秒）
     * @example
     * // 设置0.5秒的缓动时间
     * duration: 0.5
     */
    @property({ displayName: '缓动时间', visible() { return this.isTween; } })
    public get duration(): number {
        return this._duration;
    }

    public set duration(v: number) {
        this._duration = v;
    }

    /** 
     * 缓动类型（使用EasingType枚举）
     * @example
     * // 使用二次缓动效果
     * easing: EasingType.QUADRATIC
     */
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

    /** 
     * 组件加载时初始化容器节点
     * @remarks 当未指定容器时自动使用当前节点
     * @example
     * // 在场景中直接挂载到父节点时：
     * // container属性留空即可自动使用当前节点作为容器
     */
    onLoad() {
        this.container = this.container || this.node;
    }

    /** 
     * 组件启用时注册子节点变化事件
     * @remarks 监听子节点增删事件以实现动态布局
     * @example
     * // 当通过代码动态添加子节点时：
     * this.layoutContainer.addChild(newItem);
     * // 将自动触发布局更新
     */
    onEnable() {
        this.container.on(Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.container.on(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
        this.updateLayout();
    }

    /** 
     * 组件禁用时注销子节点变化事件
     * @remarks 避免组件禁用后仍响应布局变化
     * @example
     * // 当临时禁用布局功能时：
     * this.getComponent(YJLayout).enabled = false;
     * // 后续子节点变化将不再触发布局更新
     */
    onDisable() {
        this.container.off(Node.EventType.CHILD_ADDED, this._childAdded, this);
        this.container.off(Node.EventType.CHILD_REMOVED, this._childRemoved, this);
    }

    /** 
     * 添加子节点时的布局处理
     * @param child 新增的子节点
     * @remarks 核心逻辑：
     * 1. 计算容器和子节点尺寸
     * 2. 根据布局类型和方向计算初始位置
     * 3. 应用自动对齐或保留原始位置
     * 4. 触发完整布局更新
     * @example
     * // 水平布局(ASC方向)时：
     * // 新节点将放置在容器右边缘 + 间隔 + 节点宽度
     * // 公式：容器宽度*(1-anchorX) + 子节点宽度 + 间隔X
     */
    protected _childAdded(child: Node) {
        // 获取容器尺寸和锚点信息
        const s1 = no.size(this.container),
            anchar = no.anchor(this.container),
            s2 = no.size(child);
        
        // 根据自动对齐决定是否重置位置
        const p = this.autoAlign ? v3(0, 0, 0) : no.position(child);

        // 水平布局计算
        if (this.type == LayoutType.X) {
            if (this.xDirection == LayoutDirection.ASC)
                p.x = s1.width * (1 - anchar.x) + s2.width + this.space.x; // 正向排列：右边缘 + 间隔
            else
                p.x = -s1.width * anchar.x - s2.width - this.space.x; // 逆向排列：左边缘 - 间隔
        } 
        // 垂直布局计算
        else if (this.type == LayoutType.Y) {
            if (this.yDirection == LayoutDirection.ASC)
                p.y = s1.height * (1 - anchar.y) + s2.height + this.space.y; // 正向排列：上边缘 + 间隔
            else
                p.y = -s1.height * anchar.y - s2.height - this.space.y; // 逆向排列：下边缘 - 间隔
        }
        
        no.position(child, p);
        this.updateLayout();
    }

    /** 
     * 移除子节点时的布局处理
     * @param child 被移除的子节点 
     * @remarks 触发完整布局更新以重新计算剩余节点位置
     * @example
     * // 当删除中间节点时：
     * child.destroy();
     * // 后续节点将自动前移填补空缺位置
     */
    protected _childRemoved(child: Node) {
        this.updateLayout();
    }

    /** 
     * 更新整体布局
     * @remarks 根据当前布局类型调用对应的布局方法
     * @example
     * // 当子节点数量变化或布局属性修改时：
     * this.updateLayout(); // 触发重新布局
     * 
     * // 切换布局类型时：
     * this.type = LayoutType.Y;
     * this.updateLayout(); // 自动调用layoutY()
     */
    private updateLayout() {
        if (this.container.children.length == 0) return;
        switch (this.type) {
            case LayoutType.X:
                this.layoutX();  // 水平布局（如工具栏图标排列）
                break;
            case LayoutType.Y:
                this.layoutY();  // 垂直布局（如聊天消息列表）
                break;
            case LayoutType.XY:
                this.layoutXY(); // 网格布局-先水平后垂直（如九宫格图库）
                break;
            case LayoutType.YX:
                this.layoutYX(); // 网格布局-先垂直后水平（如瀑布流布局）
                break;
        }
    }

    /** 
     * 更新子节点最终位置并调整容器尺寸
     * @param poses 所有子节点的目标位置数组
     * @param size 计算出的内容区域尺寸（不含padding）
     * @remarks 处理流程：
     * 1. 添加双倍padding（左右/上下边距）
     * 2. 根据布局类型计算锚点偏移量
     * 3. 处理逆向排列时的坐标反转
     * 4. 应用即时位置更新或补间动画
     * @example
     * // 水平布局时：
     * // - 根据容器锚点计算水平起始位置
     * // - DESC方向时反转所有X坐标实现从右到左排列
     * 
     * // 网格布局时：
     * // - 同时处理X/Y轴锚点偏移
     * // - 支持XY/YX两种排列顺序的方向控制
     */
    private updatePosition(poses: Vec3[], size: Vec2) {
        // 添加双向内边距（左右+上下）
        size.add(this.padding).add(this.padding);
        // 设置容器最终尺寸（考虑padding）
        no.size(this.container, new Size(size.x, size.y));

        // 处理不同布局类型的坐标修正
        if (this.type == LayoutType.X) {
            const ancharX = no.anchorX(this.container),
                sizeX = size.x * ancharX; // 计算锚点引起的水平偏移
            // 调整所有子节点X坐标
            for (let i = 0; i < poses.length; i++) {
                poses[i].x -= sizeX - this.padding.x;
            }
            // 处理逆向排列（从右到左）
            if (this.xDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].x = -poses[i].x; // 坐标取反实现镜像效果
                }
            }
        }
        else if (this.type == LayoutType.Y) {
            const ancharY = no.anchorY(this.container),
                sizeY = size.y * ancharY; // 计算锚点引起的垂直偏移
            // 调整所有子节点Y坐标
            for (let i = 0; i < poses.length; i++) {
                poses[i].y -= sizeY - this.padding.y;
            }
            // 处理逆向排列（从下到上）
            if (this.yDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].y = -poses[i].y;
                }
            }
        }
        else if (this.type == LayoutType.XY || this.type == LayoutType.YX) {
            // 网格布局同时处理两个轴向
            const ancharX = no.anchorX(this.container),
                ancharY = no.anchorY(this.container),
                sizeX = size.x * ancharX,
                sizeY = size.y * ancharY;
            // 调整XY坐标
            for (let i = 0; i < poses.length; i++) {
                poses[i].x -= sizeX - this.padding.x;
                poses[i].y -= sizeY - this.padding.y;
            }
            // 处理X轴逆向
            if (this.xDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].x = -poses[i].x;
                }
            }
            // 处理Y轴逆向
            if (this.yDirection == LayoutDirection.DESC) {
                for (let i = 0; i < poses.length; i++) {
                    poses[i].y = -poses[i].y;
                }
            }
        }

        const children = this.container.children;
        // 应用最终位置
        if (!this.isTween) {
            // 直接设置位置（适用于静态布局）
            for (let i = 0; i < children.length; i++) {
                no.position(children[i], poses[i]);
            }
        } else {
            // 使用补间动画过渡（适用于动态效果）
            for (let i = 0; i < children.length; i++) {
                const p = poses[i], diff = this.duration / 2;
                const tween = {
                    duration: this.duration + i * diff, // 递增动画时长产生波浪效果
                    to: 1,
                    props: {
                        pos: [p.x, p.y, p.z] // 三维位置动画
                    },
                    easing: EasingTypeName[this.easing] // 使用预设缓动类型
                };
                // 示例：当新增列表项时，产生依次飞入的动画效果
                no.TweenSet.play(no.parseTweenData(tween, children[i]));
            }
        }
    }

    /** 
     * 水平布局（从左到右排列子节点）
     * 布局逻辑：
     * 1. 根据子节点尺寸和间距计算每个节点的x坐标
     * 2. 自动对齐时会重置所有节点初始位置
     * 3. 记录容器所需最大尺寸用于后续对齐处理
     * 
     * 示例：三个按钮横向排列，间距10像素
     * [按钮1]-(10)-[按钮2]-(10)-[按钮3]
     */
    private layoutX() {
        const children = this.container.children;
        const poses: Vec3[] = []; // 存储每个子节点的目标位置
        const s: Vec2 = v2(0, 0); // 记录容器所需尺寸（自动计算的内容尺寸）

        // 初始化位置数组：自动对齐时重置位置，否则保留原始位置
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = this.autoAlign ? v3(0, 0, 0) : no.position(children[i]);
        }

        let x = 0; // 当前累计的x坐标
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const size = this.getChildSize(child); // 获取子节点尺寸（包含margin）

            // 从第二个元素开始添加间距
            if (i > 0) {
                s.x += this.space.x; // 记录总间距到容器尺寸
                x += this.space.x;   // 累计到当前坐标
            }

            // 计算中心点坐标：当前位置 + 节点宽度的一半
            x += size.x / 2;
            poses[i].x = x;  // 设置节点中心点x坐标
            
            // 移动到下一个节点的起始位置
            x += size.x / 2; // 累计剩余半宽
            s.x += size.x;   // 累计总宽度

            // 记录最大高度（用于垂直方向对齐）
            if (size.y > s.y) {
                s.y = size.y;
            }
        }

        this.updatePosition(poses, s);
    }

    /** 
     * 垂直布局（从上到下排列子节点）
     * 布局逻辑：
     * 1. 根据子节点高度和垂直间距计算y坐标
     * 2. 自动对齐时重置初始位置
     * 3. 记录最大宽度用于水平方向对齐
     * 
     * 示例：聊天消息列表垂直排列，间距5像素
     * [消息1]
     *  (5px)
     * [消息2]
     *  (5px)
     * [消息3]
     */
    private layoutY() {
        const children = this.container.children;
        const poses: Vec3[] = []; // 存储每个子节点的目标位置
        const s: Vec2 = v2(0, 0); // 记录容器所需尺寸

        // 初始化位置数组
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = this.autoAlign ? v3(0, 0, 0) : no.position(children[i]);
        }

        let y = 0; // 当前累计的y坐标
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const size = this.getChildSize(child);

            // 从第二个元素开始添加垂直间距
            if (i > 0) {
                s.y += this.space.y;
                y += this.space.y;
            }

            // 计算垂直中心点坐标
            y += size.y / 2;
            poses[i].y = y;  // 设置节点中心点y坐标
            
            // 移动到下一个节点的起始位置
            y += size.y / 2;
            s.y += size.y;

            // 记录最大宽度（用于水平方向对齐）
            if (size.x > s.x) {
                s.x = size.x;
            }
        }

        this.updatePosition(poses, s);
    }

    /** 
     * 先水平后垂直布局（行优先布局）
     * 布局逻辑：
     * 1. 按行排列，每行固定数量元素（fixedX）
     * 2. 每行内元素水平排列，自动计算行宽和行高
     * 3. 行与行之间添加垂直间距
     * 
     * 示例：相册布局，每行3张图片，水平间距5像素，垂直间距10像素
     * [图1][图2][图3]
     *  (10px)
     * [图4][图5][图6]
     */
    private layoutXY() {
        const children = this.container.children;
        const poses: Vec3[] = []; // 存储所有子节点位置
        const s: Vec2 = v2();     // 容器总尺寸

        // 初始化位置数组（保留原始z坐标）
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = no.position(children[i]);
            poses[i].x = 0; // 重置x坐标
            poses[i].y = 0; // 重置y坐标
        }

        let x = 0, w = 0, h = 0; // 当前行累计x坐标/行宽/行高
        for (let i = 0; ; i++) { // 无限循环，通过内部条件退出
            x = 0; // 新行起始x坐标
            w = 0; // 当前行宽度
            h = 0; // 当前行高度
            
            // 添加行间距（从第二行开始）
            if (i > 0) s.y += this.space.y;

            // 处理单行元素
            for (let j = 0; j < this.fixedX; j++) {
                const idx = i * this.fixedX + j; // 当前元素索引
                
                // 元素不存在时结束布局
                if (!poses[idx]) {
                    s.y += h; // 累加最后一行高度
                    return this.updatePosition(poses, s);
                }

                const child = children[idx];
                const size = this.getChildSize(child);
                if (size) {
                    // 添加元素水平间距（从第二个元素开始）
                    if (j > 0) {
                        w += this.space.x;
                        x += this.space.x;
                    }

                    // 添加行垂直间距（非首行元素）
                    if (i > 0) {
                        poses[idx].y += this.space.y;
                    }

                    // 计算水平中心坐标
                    x += size.x / 2;
                    poses[idx].x = x;      // 设置x坐标为元素中心
                    poses[idx].y += size.y / 2; // 累加垂直方向坐标

                    // 为下一行元素预置垂直坐标
                    if (poses[idx + this.fixedX]) {
                        poses[idx + this.fixedX].y += poses[idx].y + size.y / 2;
                    }

                    x += size.x / 2; // 移动到下一个元素起始位置
                    w += size.x;     // 累加行宽
                    
                    // 记录行高（取最大元素高度）
                    if (size.y > h) {
                        h = size.y;
                    }
                }
            }

            // 更新容器总宽度（取最大行宽）
            if (w > s.x) {
                s.x = w;
            }
            s.y += h; // 累加行高到总高度
        }
    }

    /** 
     * 先垂直后水平布局（列优先布局）
     * 布局逻辑：
     * 1. 按列排列，每列固定数量元素（fixedY）
     * 2. 每列内元素垂直排列，自动计算列宽和列高
     * 3. 列与列之间添加水平间距
     * 
     * 示例：瀑布流布局，每列3个商品卡片，垂直间距5像素，水平间距10像素
     * [卡1] [卡4]
     * [卡2] [卡5]
     * [卡3] [卡6]
     */
    private layoutYX() {
        const children = this.container.children;
        const poses: Vec3[] = []; // 存储所有子节点位置
        const s: Vec2 = v2();     // 容器总尺寸

        // 初始化位置数组（保留原始z坐标）
        for (let i = 0, n = children.length; i < n; i++) {
            poses[i] = no.position(children[i]);
            poses[i].x = 0; // 重置x坐标
            poses[i].y = 0; // 重置y坐标
        }

        let y = 0, w = 0, h = 0; // 当前列累计y坐标/列高/列宽
        for (let i = 0; ; i++) { // 无限循环，通过内部条件退出
            y = 0; // 新列起始y坐标
            w = 0; // 当前列高度
            h = 0; // 当前列宽度

            // 处理单列元素
            for (let j = 0; j < this.fixedY; j++) {
                const idx = i * this.fixedY + j; // 当前元素索引
                
                // 元素不存在时结束布局
                if (!poses[idx]) {
                    s.x += h; // 累加最后一列宽度
                    return this.updatePosition(poses, s);
                }

                const child = children[idx];
                const size = this.getChildSize(child);
                if (size) {
                    // 添加元素垂直间距（从第二个元素开始）
                    if (j > 0) {
                        w += this.space.y;
                        y += this.space.y;
                    }

                    // 添加列水平间距（非首列元素）
                    if (i > 0) {
                        poses[idx].x += this.space.x;
                    }

                    // 计算垂直中心坐标
                    y += size.y / 2;
                    poses[idx].y = y;      // 设置y坐标为元素中心
                    poses[idx].x += size.x / 2; // 累加水平方向坐标

                    // 为下一列元素预置水平坐标
                    if (poses[idx + this.fixedY]) {
                        poses[idx + this.fixedY].x += poses[idx].x + size.x / 2;
                    }

                    y += size.y / 2; // 移动到下一个元素起始位置
                    w += size.y;     // 累加列高
                    
                    // 记录列宽（取最大元素宽度）
                    if (size.x > h) {
                        h = size.x;
                    }
                }
            }

            // 更新容器总高度（取最大列高）
            if (w > s.y) {
                s.y = w;
            }
            s.x += h; // 累加列宽到总宽度
        }
    }

    /** 
     * 获取子节点实际大小（考虑缩放因素）
     * @param child - 需要计算尺寸的子节点
     * @returns 返回包含缩放后的实际尺寸对象
     * 
     * 示例：节点原始尺寸100x50，缩放0.5倍，返回50x25
     */
    private getChildSize(child: Node) {
        const size = no.size(child),
            scale = no.scale(child);
        size.x *= scale.x; // 计算实际宽度
        size.y *= scale.y; // 计算实际高度
        return size;
    }
}
