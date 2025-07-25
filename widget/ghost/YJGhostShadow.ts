import { ccclass, Component, EDITOR, executeInEditMode, Node, property, requireComponent, Sprite, UIOpacity } from "../../../common/yj";
import { no } from "../../no";
/**
 * 残影
 * Author mqsy_yj
 * DateTime Fri Jul 25 2025 18:03:07 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJGhostShadow')
@requireComponent(Sprite)
@executeInEditMode()
export class YJGhostShadow extends Component {
    @property(Node)
    container: Node = null;
    @property({ displayName: '残影数量' })
    num: number = 5;

    @property({ displayName: '残影间隔' })
    interval: number = 0.1;

    @property({ displayName: '残影透明度[0,1]', step: 0.01, min: 0, max: 1 })
    opacity: number = 0.8;

    @property
    get preview(): boolean {
        return this._preview;
    }
    set preview(v: boolean) {
        this._preview = v;
        if (!v) {
            this._shadows.forEach(shadow => {
                shadow.destroy();
            });
            this._shadows.length = 0;
        }
    }

    // @property({ displayName: '残影缩放' })
    // scale: number = 1;

    // @property({ displayName: '残影旋转' })
    // rotation: number = 0;
    private _preview: boolean = false;
    private _sprite: Sprite = null;
    private _shadows: Node[] = [];
    private _poses: Map<number, number[]> = new Map();
    private _isMoving: boolean = false;
    private _intervalFrame: number = 0;
    private _frameNum: number = 0;

    onLoad() {
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this._sprite = this.getComponent(Sprite);
        this._intervalFrame = Math.floor(this.interval * 60);
        this._poses.clear();
        this._frameNum = 0;
    }

    onDestroy() {
        this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        for (let i = this._shadows.length - 1; i >= 0; i--) {
            this._shadows[i].destroy();
        }
    }

    private onTransformChanged(type: number) {
        if (type & Node.TransformBit.POSITION) {
            this._isMoving = true;
        }
    }

    private createShadow() {
        const subOpacity = this.opacity / this.num;
        const spriteFrame = this._sprite.spriteFrame;
        const size = no.size(this.node);
        const shadow = no.newNode('shadow', [Sprite, UIOpacity]);
        shadow.parent = this.container;
        shadow.setPosition(0, 0, 0);
        // shadow.setScale(this.scale, this.scale, this.scale);
        // shadow.angle = this.rotation;
        shadow.getComponent(UIOpacity).opacity = (this.opacity - subOpacity * this._shadows.length) * 255;
        shadow.getComponent(Sprite).spriteFrame = spriteFrame;
        no.size(shadow, size);
        this._shadows.push(shadow);
    }

    private shadowFollow() {
        for (let i = 0; i < this.num; i++) {
            const shadow = this._shadows[i];
            if (!shadow) break;
            const index = this._frameNum - this._intervalFrame * (i + 1);
            if (index < 0 || !this._poses.has(index)) continue;
            const [x, y, angle] = this._poses.get(index);
            shadow.setPosition(x, y, 0);
            shadow.angle = angle;
            if (i === this.num - 1) {
                this._poses.delete(index - 1);
            }
        }
    }

    lateUpdate(dt: number): void {
        if (EDITOR && !this._preview) return;
        if (!this._isMoving) return;
        if (this._shadows.length < this.num) {
            const index = Math.floor(this._frameNum / this._intervalFrame) - 1;
            if (index >= 0 && !this._shadows[index]) {
                this.createShadow();
            }
        }
        const { x, y } = this.node.position;
        const angle = this.node.angle;
        this._poses.set(this._frameNum++, [x, y, angle]);
        if (this._frameNum >= this._intervalFrame) {
            this.shadowFollow();
        }
    }
}