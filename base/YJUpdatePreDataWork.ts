import { ccclass, Component, EDITOR, executeInEditMode, property } from "NoUi3/yj";
import { YJDataWork } from "./YJDataWork";
import { no } from "NoUi3/no";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Sep 23 2024 14:57:36 GMT+0800 (中国标准时间)
 * 向上更新主dataWork的数据
 */

@ccclass('YJUpdatePreDataWork')
@executeInEditMode()
export class YJUpdatePreDataWork extends Component {
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    @property({ displayName: '绑定数据的keys', tooltip: '用.表示key的层级关系；如果上层数据是数组，那么.后为下标或能找唯一子项的key；仅支持两层。用,分隔多个key' })
    bind_keys: string = '';

    onLoad() {
        if (EDITOR) {
            if (!this.dataWork) this.dataWork = no.getComponentInParents(this.node.parent, YJDataWork);
        }
    }

    public updateData(d: any) {
        const keys = this.bind_keys.split(',');
        for (const key of keys) {
            const ks = key.split('.');
            if (ks.length == 1) {
                this.dataWork.changeValueByUi(ks[0], d);
            } else {
                const data = this.dataWork.getValue(ks[0]);
                if (Array.isArray(data)) {
                    let index = parseInt(ks[1]);
                    if (isNaN(index)) {
                        index = no.indexOfArray(data, d[ks[1]], ks[1]);
                    }
                    data[index] = d;
                }
                this.dataWork.changeValueByUi(ks[0], data);
            }
        }
    }
}