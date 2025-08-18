import { no } from "../no";
import { ccclass, Component, property, setDisplayStats } from "../yj";

@ccclass('YJShowFPS')
export class YJShowFPS extends Component {
    @property
    show: boolean = false;

    protected onLoad(): void {
        setDisplayStats(no.isDebug() && this.show)
    }
}