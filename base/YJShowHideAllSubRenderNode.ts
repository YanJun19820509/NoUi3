
import { _decorator, Component, Node, Sprite } from 'cc';
import { no } from '../no';
import { SetSpriteFrameInSampler2D } from '../fuckui/SetSpriteFrameInSampler2D';
import { SetSpine } from '../fuckui/SetSpine';
import { SetPlayParticle } from '../fuckui/SetPlayParticle';
const { ccclass, property } = _decorator;

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
    private _count: number = 0;

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
        this._count--;
        if (this._count == 0)
            this.showSubRenderNode();
    }

    private onHide(type: string) {
        this._count++;
        no.scheduleOnce(this.showSubRenderNode, 1, this);
    }

    public showSubRenderNode() {
        let v: boolean = this._count == 0;
        if (v == this.isShow) return;
        this.isShow = v;
        this.getComponentsInChildren(SetSpriteFrameInSampler2D).forEach(c => {
            c.setSpriteEnable(v);
        });
        this.getComponentsInChildren(SetSpine).forEach(c => {
            c.setSpineEnable(v);
        });
        // this.getComponentsInChildren(SetPlayParticle).forEach(c => {
        //     c.setParticleEnable(v);
        // });
    }
}
