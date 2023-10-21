import { YJTouchListener } from "../../base/touch/YJTouchListener";
import { no } from "../../no";
import { EventTouch, Vec2, ccclass, property, Node, instantiate, v2, Vec4, v4, Vec3, v3 } from "../../yj";
import { YJWideAreaDelegate3D } from "./YJWideAreaDelegate3D";


/**
 * 广域
 */
@ccclass('YJWideArea3D')
export class YJWideArea3D extends YJTouchListener {
    @property({ displayName: '网格大小', tooltip: '整个地面将按该大小分为无数个网格，每个网格有其对应的网格坐标UV，原点处网格坐标为(0,0)', min: 0, max: 1 })
    meshSize: number = 0.03125;
    @property({ displayName: '使用视图块' })
    useBlock: boolean = true;
    @property({ displayName: '视图块大小', visible() { return this.useBlock; }, tooltip: '整个屏幕将按视图块大小分割成多个正方形，在移动的过程中移出屏幕外的视图块将填充到即将移入屏幕内的区域位置', min: 0, max: 1 })
    blocksSize: number = .125;
    @property({ type: Node, displayName: '视图块模板', visible() { return this.useBlock; } })
    blockTemp: Node = null;
    @property({ type: Node, displayName: '视图块层', visible() { return this.useBlock; } })
    blockLayer: Node = null;
    @property({ tooltip: '每秒移动距离' })
    speed: number = 10;
    @property({ displayName: '自动移动', tooltip: '滑动屏幕会改变移动方向，手指抬起后点自动按该方向移动' })
    autoMove: boolean = true;
    @property({ displayName: '开启阶梯增速', tooltip: '根据触摸滑动的距离长短增减speed' })
    stepSpeed: boolean = true;
    @property({ displayName: '阶梯增速的阶段长度', tooltip: '每当增加或减少该长度，speed相应增减0.5倍', visible() { return this.stepSpeed; } })
    stepSpeedLen: number = 20;
    @property({ displayName: '显示罗盘' })
    showCompass: boolean = true;
    @property({ type: YJWideAreaDelegate3D })
    delegate: YJWideAreaDelegate3D = null;

    /**第一次点击坐标 */
    private startTouchPos: Vec2;
    /**广阔相对于无限空间的当前坐标 */
    private _curPos: Vec2;
    /**速度倍率 */
    private _speedMultipel: number = 1;

    private _dir: { angle: number, radian: number };

    private _isMoving: boolean = false;

    private _range: Vec4;

    private _blockGroupSize: Vec2;

    private _sameRowInfo: { [y: number]: Node[] };

    start() {
        //每次加载广阔相对于无限空间的当前坐标都为(0,0)
        this._curPos = v2();
        this._isMoving = false;
        if (this.autoMove) {
            this._isMoving = true;
            this._dir = { angle: 90, radian: 1.57 };
        }
        this.createBlocks();
    }

    update(dt: number) {
        if (!this._isMoving) return;
        this.move(dt);
    }

    public onStart(e: EventTouch): boolean {
        this.startTouchPos = this.touchUILocationAR(e);
        this.delegate?.onStart(this._curPos.clone());
        return true;
    }

    public onMove(e: EventTouch): boolean {
        const pos = this.touchUILocationAR(e),
            // step = e.getDelta(),//步进值
            dis = Vec2.distance(this.startTouchPos, pos);//与第一次点击坐标的距离
        //计算阶梯增速
        if (this.stepSpeed) {
            this._speedMultipel = Math.floor(dis / this.stepSpeedLen) * 0.5 + 1;
        }
        //与第一次点击坐标的夹角
        this._dir = no.angleTo(this.startTouchPos, pos);
        this._isMoving = true;
        return true;
    }


    public onEnd(e: EventTouch): boolean {
        if (!this.autoMove) {
            this._isMoving = false;
            this._speedMultipel = 1;
        }
        this.delegate?.onEnd(this._curPos.clone());
        return true;
    }

    /**行数 */
    private getRowNumber(): number {
        let n: number = Math.ceil(1 / this.blocksSize) + 1;
        //保证行列数为偶数
        if (n % 2 == 1) n++;
        return n;
    }
    /**列数 */
    private getColumnNumber(): number {
        let n: number = Math.ceil(1 / this.blocksSize) + 1;
        //保证行列数为偶数
        if (n % 2 == 1) n++;
        return n;
    }

    private createBlocks() {
        if (!this.useBlock || !this.blockTemp || !this.blockLayer) return;
        //根据屏幕宽高计算视图块行数和列数
        let x = this.getColumnNumber(),
            y = this.getRowNumber();
        let w = this.blocksSize * x,
            h = this.blocksSize * y,
            w1 = (1 + this.blocksSize) / 2,
            h1 = -(1 + this.blocksSize) / 2,
            h2 = -h1;
        this._range = v4(-w1, h1, w1, h2);
        this._blockGroupSize = v2(x, y);
        this.clearSameRowInfo();
        for (let i = 0; i < y; i++) {
            for (let j = 0; j < x; j++) {
                this.createBlock(j, i, w, h);
            }
        }
        this.delegate?.onBlocksInit(this.blockLayer.children);
    }

    private createBlock(x: number, y: number, width: number, height: number) {
        const node = instantiate(this.blockTemp);
        node.parent = this.blockLayer;
        node.active = true;
        let pos: Vec3 = v3(-width / 2 + this.blocksSize * x + this.blocksSize / 2, -height / 2 + this.blocksSize * y + this.blocksSize / 2);
        no.position(node, pos);
    }

    private move(dt: number) {
        const len = this.speed * this._speedMultipel * dt,
            x = len * Math.cos(this._dir.radian) / 1000,
            y = len * Math.sin(this._dir.radian) / 1000;
        this._curPos.add2f(x, y);
        this.delegate?.onMove(this._curPos.clone(), this._dir.angle);
        this.moveBlocks(x, y);
    }

    private moveBlocks(x: number, y: number) {
        if (!this.blockLayer) return;
        this.clearSameRowInfo();
        this.blockLayer.children.forEach(block => {
            this.setBlockPos(block, x, y);
        });
    }

    private setBlockPos(block: Node, x: number, y: number) {
        let pos = no.position(block),
            isSwitch = false;
        pos.x -= x;
        pos.y -= y;
        if (pos.x < this._range.x && x > 0) {
            pos.x += this._blockGroupSize.x * this.blocksSize;
            isSwitch = true;
        } else if (pos.x > this._range.z && x < 0) {
            pos.x -= this._blockGroupSize.x * this.blocksSize;
            isSwitch = true;
        }
        if (pos.y < this._range.y && y > 0) {
            pos.y += this._blockGroupSize.y * this.blocksSize;
            isSwitch = true;
        } else if (pos.y > this._range.w && y < 0) {
            pos.y -= this._blockGroupSize.y * this.blocksSize;
            isSwitch = true;
        }
        no.position(block, pos);
        if (isSwitch)
            this.delegate?.onBlockSwitch(block, pos);
        this.delegate?.onBlockMove(block, pos);
    }

    private clearSameRowInfo() {
        this._sameRowInfo = {};
    }

    private setSameRow(node: Node, pos: Vec3) {
        node['_origin_pos_'] = pos;
        let nodes = this._sameRowInfo[pos.y] || [];
        nodes[nodes.length] = node;
        this._sameRowInfo[pos.y] = nodes;
    }

    private xy2uv(xy: Vec2): Vec2 {
        const a = xy.x < 0 ? -1 : 1,
            b = xy.y < 0 ? -1 : 1;
        const u = Math.ceil(xy.x * a / this.meshSize) * a,
            v = Math.ceil(xy.y * b / this.meshSize) * b;
        return v2(u, v);
    }

    private touchUILocationAR(e: EventTouch): Vec2 {
        let p = e.getUILocation();
        // let pos = math.v3(p.x, p.y);
        // let ut = this.node.getComponent(UITransform);
        // let size = ut.contentSize.clone();
        // let ar = ut.anchorPoint;
        // pos.subtract3f(size.width * ar.x, size.height * ar.y, 0);
        // ut.convertToWorldSpaceAR(pos, pos);
        // let vsize = YJFitScreen.getVisibleSize();
        // pos.subtract3f((vsize.width - size.width), (vsize.height - size.height), 0);
        // this.content.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        // return math.v2(pos.x, pos.y);
        return p;
    }

    public get curPos(): Vec2 {
        return this._curPos;
    }

    public set curPos(v: Vec2) {
        if (v.equals(this._curPos)) return;
        this._curPos = v;
        //todo 更新标尺、罗盘
    }
}
