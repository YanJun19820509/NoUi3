import { no } from "../../no";
import { Component, ccclass, property } from "../../yj";


@ccclass('YJOnVisibleChange')
export class YJOnVisibleChange extends Component {
    @property({ type: no.EventHandlerInfo, displayName: '可见时' })
    onVisible: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '不可见时' })
    onInVisible: no.EventHandlerInfo[] = [];

    public changeVisible(v: boolean) {
        if (v) no.EventHandlerInfo.execute(this.onVisible);
        else no.EventHandlerInfo.execute(this.onInVisible);
    }
}


