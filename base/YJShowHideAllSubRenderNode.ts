
import { ccclass, property, Component, Layers, Node, sys } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJShowHideAllSubRenderNode
 * DateTime = Sun Apr 23 2023 14:23:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowHideAllSubRenderNode.ts
 * FileBasenameNoExtension = YJShowHideAllSubRenderNode
 * URL = db://assets/NoUi3/base/YJShowHideAllSubRenderNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//显示or隐藏所有渲染子节点
@ccclass('YJShowHideAllSubRenderNode')
export class YJShowHideAllSubRenderNode extends Component {
    @property({ readonly: true })
    showSubRenderNodeEvent: string = '_show_sub_render_node';
    @property({ readonly: true })
    hideSubRenderNodeEvent: string = '_hide_sub_render_node';
    @property
    catchFullScreenPanelEvent: boolean = false;

    private isShow: boolean = true;
    private _fullPanels: string[] = [];

    protected onLoad(): void {
        if (this.enabled) {
            no.evn.on(this.showSubRenderNodeEvent, this.onShow, this);
            no.evn.on(this.hideSubRenderNodeEvent, this.onHide, this);
            if (this.catchFullScreenPanelEvent) {
                no.evn.on('_full_screen_panel_open', this.onHide, this);
                no.evn.on('_full_screen_panel_close', this.onShow, this);
            }
        }
    }

    protected onDestroy(): void {
        no.evn.targetOff(this);
        no.unschedule(this);
    }

    private onShow(type: string) {
        no.removeFromArray(this._fullPanels, type);
        if (!this._fullPanels.length) {
            this.showSubRenderNode();
        }
    }

    private onHide(type: string) {
        no.addToArray(this._fullPanels, type);
        this.showSubRenderNode();
    }

    public showSubRenderNode() {
        let v: boolean = !this._fullPanels.length;
        if (v == this.isShow) return;
        this.isShow = v;
        this.changeLayer(this.node, v);
    }

    private changeLayer(node: Node, v: boolean) {
        if (sys.platform == sys.Platform.WECHAT_GAME) return;
        no.visible(node, v);
    }
}
