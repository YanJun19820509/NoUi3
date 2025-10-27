import DelegateComponent from "@core/gui/DelegateComponent";
import { ccclass, Node, property } from "../yj";
import { GUINodeTree } from "@core/gui/Defines";
import { YJPanel } from "../base/node/YJPanel";
import { no } from "../no";
import { YJDataWork } from "../base/YJDataWork";
import { YJPanelCreated } from "../types";

@ccclass('GuiPanel')
export class GuiPanel extends YJPanel {

    /**
     * 节点添加到层级以后的回调（onLoad之后），在组件内onAdded回调之后执行
     * 执行时序： 组件onLoad-> 组件onAdded -> GUIOptions#onAdded
     *
     * @param node
     * @param params
     * @param nodeTree 节点树对象，可以方便获取添加的预制件的子节点，GUINodeTree内部是懒初始化方式，只有调用get和has方法才会真正生成节点树对象
     * @returns
     */
    onAdded(params: any, nodeTree: GUINodeTree): void {
        this._initData(params);
        this.initPanel().catch(this.onError.bind(this));
    }
    private _initData(params: any) {
        const dataWork: YJDataWork = this['dataWork'];
        if (dataWork) {
            dataWork.clear().initWithData(params);
        }
    }

    /**
     * 注意：调用`gui.delete`或`gui.$delete`才会触发此onBeforeRemove回调，如果`this.node.destroy()`，该回调不会触发。
     * 如果指定onBeforeRemoved，则next必须调用，否则节点不会被正常删除。
     * 比如希望节点做一个FadeOut然后删除，则可以在`onBeforeRemoved`当中播放action动画，动画结束后调用next
     *
     * */
    onBeforeRemove(): void {
        this.closePanel();
    }

    /**
     * 节点删除回调，，在组件内onRemoved回调之后执行，
     * 执行时序： 组件onRemoved -> GUIOptions#onRemoved -> 组件onDestroy
     * 注意：该回调会在onDestroy之前调用
     */
    onRemoved(node: Node, params: any): void {

    }

    /**
     * 节点创建失败的回调
     */
    onError(error: any): void {
        no.err('GuiPanel', error);
    }

    public clear() {
        if (this.status == 'open')
            this.onClosePanel();
        no.setPrototype(this, { [YJPanelCreated]: '0' });
        const dc = this.getComponent(DelegateComponent);
        dc ? dc.removeView() : this.node.destroy();
    }
}