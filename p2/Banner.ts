import Comm_Platform from "db://assets/myCommon/Comm_Platform";
import { Component, Enum } from "cc";
import { _decorator } from "cc";
import { Widget } from "cc";
import { no } from "../no";
const { ccclass, property } = _decorator;
/**
 * 
 * Author mqsy_yj
 * DateTime Thu Aug 14 2025 11:28:58 GMT+0800 (中国标准时间)
 *
 */
enum BannerPos {
    TOP = 1,
    CENTER = 2,
    BOTTOM = 3
}
const BannerPosType = {
    1: 'top',
    2: 'center',
    3: 'bottom'
}
@ccclass('Banner')
export class Banner extends Component {
    @property
    key: string = 'SRYX';
    @property
    pos: string = 'banner2';
    @property({ type: Enum(BannerPos) })
    verticalAlign: BannerPos = BannerPos.BOTTOM;
    private _y: number;

    onLoad() {
        //节点在设计时的y值，是banner是否显示的阈值
        this._y = no.y(this.node);
        let widget = this.getComponent(Widget) || this.addComponent(Widget);
        widget.isAlignTop = false;
        widget.isAlignVerticalCenter = false;
        widget.isAlignBottom = false;
        if (this.verticalAlign == BannerPos.TOP) {
            widget.isAlignTop = true;
            widget.top = 200;
        } else if (this.verticalAlign == BannerPos.CENTER) {
            widget.isAlignVerticalCenter = true;
            widget.verticalCenter = 0;
        } else if (this.verticalAlign == BannerPos.BOTTOM) {
            widget.isAlignBottom = true;
            widget.bottom = 200;
        }
    }

    onEnable() {
        this.createBanner();
    }

    onDisable(): void {
        this.hideBanner();
    }

    public createBanner() {
        this.scheduleOnce(this._createBannerCb, 2);
    }

    public hideBanner() {
        Comm_Platform.hideBanner();
    }

    private _createBannerCb() {
        const y = no.y(this.node);
        if (this.verticalAlign == BannerPos.TOP) {
            if (this._y > y) return;
        } else if (this.verticalAlign == BannerPos.BOTTOM) {
            if (this._y < y) return;
        }
        // const verticalAlign = BannerPosType[this.verticalAlign] as 'top' | 'center' | 'bottom';
        Comm_Platform.creatBanner(false, this.node, this.key, this.pos)
    }
}