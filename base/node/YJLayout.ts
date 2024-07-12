
import { no } from '../../no';
import { Layout, Node, Vec3, ccclass, executeInEditMode, property, v3 } from '../../yj';

@ccclass('YJLayout')
@executeInEditMode()
export class YJLayout extends Layout {
    @property
    maxSize: number = 100;

    onLoad() {
        this.resizeMode = Layout.ResizeMode.CONTAINER;
        this.node.on(Node.EventType.SIZE_CHANGED, this.checkSize, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.checkSize, this);
    }

    private checkSize() {
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
