import { no } from "../../no";
import { Component, ccclass, property } from "../../yj";


@ccclass('YJOnVisibleChange')
export class YJOnVisibleChange extends Component {
    @property({ type: no.EventHandlerInfo })
    onVisible: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onInVisible: no.EventHandlerInfo[] = [];

    public changeVisible(v: boolean) {
        if (v) no.EventHandlerInfo.execute(this.onVisible);
        else no.EventHandlerInfo.execute(this.onInVisible);
    }
}


