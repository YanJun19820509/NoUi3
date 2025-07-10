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

    private _moveRange: { xMin: number, yMin: number, xMax: number, yMax: number };
    private _syncRangeScale: { x: number, y: number };

    public onTouchStart(event: EventTouch) {
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
        }
    }

    public onTouchMove(event: EventTouch) {
        const pos = this.node.position;
        const x = this.horizontal ? no.clamp(event.getDeltaX() + pos.x, this._moveRange.xMin, this._moveRange.xMax) : pos.x;
        const y = this.vertical ? no.clamp(event.getDeltaY() + pos.y, this._moveRange.yMin, this._moveRange.yMax) : pos.y;
        this.node.setPosition(x, y);
        this.sync(x, y);
    }

    private sync(x: number, y: number) {
        if (!this.syncNode) return;
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
}