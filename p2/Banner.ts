import Comm_Platform from "db://assets/myCommon/Comm_Platform";
import { Component, Enum } from "cc";
import { _decorator } from "cc";
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
    onEnable() {
        this.createBanner();
    }

    public createBanner() {
        const verticalAlign = BannerPosType[this.verticalAlign] as 'top' | 'center' | 'bottom';
        this.scheduleOnce(() => {
            Comm_Platform.creatBanner(false, this.node, this.key, this.pos, false, verticalAlign)
        }, 2);
    }
}