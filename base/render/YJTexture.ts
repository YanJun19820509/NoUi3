import { ccclass, Color, executeInEditMode, Node } from 'NoUi3/yj';
import { YJRenderBase } from './YJRenderBase';
import { no } from 'NoUi3/no';
/**
 * 纹理组件
 */
@ccclass('YJTexture')
@executeInEditMode()
export class YJTexture extends YJRenderBase {

    onLoad() {
        this.node.on(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    onDestroy(): void {
        super.onDestroy();
        this.node.off(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    onEnable(): void {
        super.onEnable();
        this.renderable = true;
        this.initRenderData(1, 4);
        this.setDefaultRenderData();
        this._assembler.fillBuffers(this);
    }

    protected onSizeChanged() {
        console.log('onSizeChanged', no.size(this.node));
        this.setRenderData({ xy: this.getDefaultXY() });
        this.markForUpdateRenderData();
    }
}


