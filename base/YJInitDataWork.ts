
import { _decorator, Component, Node, Enum } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
import { SimpleValueType } from '../types';
import { YJDataWork } from './YJDataWork';
const { ccclass, property, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJInitDataWork
 * DateTime = Tue Jan 10 2023 12:44:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJInitDataWork.ts
 * FileBasenameNoExtension = YJInitDataWork
 * URL = db://assets/NoUi3/base/YJInitDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */


@ccclass('InitDataWorkInfo')
export class InitDataWorkInfo {
    @property
    key: string = '';
    @property({ type: Enum(SimpleValueType) })
    type: SimpleValueType = SimpleValueType.String;
    @property
    value: string = '';
}

@ccclass('YJInitDataWork')
@executeInEditMode()
@requireComponent(YJDataWork)
export class YJInitDataWork extends Component {
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    @property({ type: InitDataWorkInfo })
    datas: InitDataWorkInfo[] = [];
    @property
    autoSet: boolean = true;

    onLoad() {
        if (EDITOR) {
            if (!this.dataWork)
                this.dataWork = no.getComponentInParents(this.node, YJDataWork);
            return;
        }
        this.autoSet && this.setData2DataWork();
    }

    private setData2DataWork() {
        let d: any = {};
        this.datas.forEach(info => {
            if (info.key) {
                let v: any;
                switch (info.type) {
                    case SimpleValueType.Boolean:
                        v = Boolean(info.value);
                        break;
                    case SimpleValueType.Number:
                        v = Number(info.value);
                        break;
                    case SimpleValueType.String:
                        v = info.value;
                        break;
                    case SimpleValueType.Array:
                    case SimpleValueType.Object:
                        v = JSON.parse(info.value);
                        break;
                }
                d[info.key] = v;
            }
        });
        this.dataWork.data = d;
    }
}
