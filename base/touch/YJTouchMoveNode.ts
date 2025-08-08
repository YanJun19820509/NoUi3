import { ccclass, Component, EventTouch, property, Node, Vec2, view } from "../../yj";
import { no } from "../../no";
/**
 * 拖动节点
 * Author mqsy_yj
 * DateTime Wed Jul 09 2025 16:25:18 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJTouchMoveNode')
export class YJTouchMoveNode extends Component {
    @property(Node)
    container: Node = null;
    @property({ displayName: '水平移动' })
    horizontal: boolean = true;
    @property({ displayName: '垂直移动' })
    vertical: boolean = true;
    @property({ type: Node, displayName: '同步节点' })
    syncNode: Node = null;
    @property({ displayName: '是否反向', visible() { return this.syncNode != null; } })
    reverse: boolean = false;
    @property({ displayName: '是否触摸开始时移动' })
    touchStartMove: boolean = false;

    //移动范围
    private _moveRange: { xMin: number, yMin: number, xMax: number, yMax: number };
    //显示范围
    private _rect: { xMin: number, yMin: number, xMax: number, yMax: number };
    private _syncRangeScale: { x: number, y: number };
    private _isTouching: boolean = false;

    protected onDisable(): void {
        this._moveRange = null;
        this._rect = null;
        this._syncRangeScale = null;
    }

    private _tempPos: Vec2 = new Vec2();
    public onTouchStart(event: EventTouch) {
        this._isTouching = true;
        if (this.touchStartMove) {
            const pos = this.node.worldPosition;
            const location = event.getUILocation(this._tempPos);
            this._moveBy(location.x - pos.x, location.y - pos.y);
        }
    }

    public onTouchMove(event: EventTouch) {
        this._moveBy(event.getDeltaX(), event.getDeltaY());
    }

    public onTouchEnd(event: EventTouch) {
        this._isTouching = false;
    }


    private _moveBy(x: number, y: number) {
        this.initMoveRange();
        const pos = this.node.position;
        x = this.horizontal ? no.clamp(x + pos.x, this._moveRange.xMin, this._moveRange.xMax) : pos.x;
        y = this.vertical ? no.clamp(y + pos.y, this._moveRange.yMin, this._moveRange.yMax) : pos.y;
        this.node.setPosition(x, y);
        this._sync(x, y);
    }

    private _sync(x: number, y: number) {
        if (!this.syncNode) return;
        this.initMoveRange();
        if (!this._syncRangeScale) {
            const nsize = no.size(this.syncNode);
            const csize = no.size(this.syncNode.parent);
            const nar = no.anchor(this.syncNode);
            const car = no.anchor(this.syncNode.parent);

            const range = {
                xMin: (1 - car.x) * csize.width - (1 - nar.x) * nsize.width,
                yMin: (1 - car.y) * csize.height - (1 - nar.y) * nsize.height,
                xMax: (1 - nar.x) * nsize.width - (1 - car.x) * csize.width,
                yMax: nar.y * nsize.height - car.y * csize.height
            };

            this._syncRangeScale = {
                x: (range.xMax - range.xMin) / (this._moveRange.xMax - this._moveRange.xMin),
                y: (range.yMax - range.yMin) / (this._moveRange.yMax - this._moveRange.yMin)
            };
        }
        const pos = this.syncNode.position;
        const a = this.reverse ? -1 : 1;
        this.syncNode.setPosition(this.horizontal ? x * this._syncRangeScale.x * a : pos.x, this.vertical ? y * this._syncRangeScale.y * a : pos.y);
    }

    public moveTo(x: number, y: number) {
        if (this._isTouching) return;
        const pos = this.node.position;
        x = this.horizontal ? no.clamp(x, this._moveRange.xMin, this._moveRange.xMax) : pos.x;
        y = this.vertical ? no.clamp(y, this._moveRange.yMin, this._moveRange.yMax) : pos.y;
        this.node.setPosition(x, y);
        this._sync(x, y);
    }

    public sync(x: number, y: number) {
        if (this._isTouching) return;
        this._sync(x, y);
    }

    /**
     * 获取子节点在其内的可移动范围，非该节点可移动范围
     * @returns 移动范围
     */
    public moveRange() {
        return this._rect;
    }

    private initMoveRange() {
        if (!this._moveRange) {
            const nsize = no.size(this.node);
            const csize = no.size(this.container);
            const nar = no.anchor(this.node);
            const car = no.anchor(this.container);

            this._moveRange = {
                xMin: (1 - car.x) * csize.width - (1 - nar.x) * nsize.width,
                yMin: (1 - car.y) * csize.height - (1 - nar.y) * nsize.height,
                xMax: (1 - nar.x) * nsize.width - (1 - car.x) * csize.width,
                yMax: nar.y * nsize.height - car.y * csize.height
            };
            if (nsize.width < csize.width) {
                this._moveRange.xMin *= -1;
                this._moveRange.xMax *= -1;
            }
            if (nsize.height < csize.height) {
                this._moveRange.yMin *= -1;
                this._moveRange.yMax *= -1;
            }
            this._rect = {
                xMin: (0 - nar.x) * nsize.width,
                yMin: (0 - nar.y) * nsize.height,
                xMax: (1 - nar.x) * nsize.width,
                yMax: (1 - nar.y) * nsize.height
            };
        }
    }
}