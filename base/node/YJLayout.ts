import { no } from '../../no';
import { Layout, Node, Vec3, ccclass, executeInEditMode, property, v3, macro } from '../../yj';

@ccclass('YJLayout')
@executeInEditMode()
export class YJLayout extends Layout {
    @property({ tooltip: '最大尺寸，超过该尺寸会缩小，0表示不限制' })
    maxSize: number = 0;
    @property({ tooltip: '是否同步尺寸' })
    syncSize: boolean = false;

    onLoad() {
        this.resizeMode = Layout.ResizeMode.CONTAINER;
        this.node.on(Node.EventType.SIZE_CHANGED, this.checkSize, this);
        if (this.syncSize) this.schedule(this.updateSize, 0.1, macro.REPEAT_FOREVER);
    }

    onDestroy() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.checkSize, this);
    }

    private checkSize() {
        if (this.maxSize > 0) {
            const size = no.size(this.node);
            let s = 1;
            if (this.type == Layout.Type.HORIZONTAL) {
                s = size.width / this.maxSize;
            } else if (this.type == Layout.Type.VERTICAL) {
                s = size.height / this.maxSize;
            }
            let scale: Vec3;
            if (s > 1) {
                s = 1 / s;
                scale = v3(s, s, 1);
            } else {
                scale = v3(1, 1, 1);
            }
            no.scale(this.node, scale);
        }
    }

    private updateSize() {
        const size = no.size(this.node);
        let w = 0, h = 0;
        for (let i = 0, n = this.node.children.length; i < n; i++) {
            const child = this.node.children[i];
            const s = no.size(child);
            w = Math.max(w, s.width);
            h = Math.max(h, s.height);
        }
        if (this.type == Layout.Type.HORIZONTAL) {
            if (h == size.height) {
                return;
            }
            size.height = h;
        } else if (this.type == Layout.Type.VERTICAL) {
            if (w == size.width) {
                return;
            }
            size.width = w;
        }
        no.size(this.node, size);
    }
}
