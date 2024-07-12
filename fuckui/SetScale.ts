
import { Vec3, ccclass, menu, property } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetScale
 * DateTime = Mon Jan 17 2022 14:00:49 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScale.ts
 * FileBasenameNoExtension = SetScale
 * URL = db://assets/Script/NoUi3/fuckui/SetScale.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScale')
@menu('NoUi/ui/SetScale(设置scale:number|[number])')
export class SetScale extends FuckUi {

    @property({ tooltip: '乘以节点原有缩放' })
    isMultiply: boolean = false;

    private oldScale: Vec3 = null;

    protected onDataChange(data: any) {
        if (!this.oldScale)
            this.oldScale = this.node.getScale();
        let temp = this.oldScale.clone();
        if (data instanceof Array)
            if (this.isMultiply) {
                this.node.setScale(temp.multiply3f(data[0], data[1] || data[0], data[2] || 1));
            } else {
                this.node.setScale(data[0], (data[1] || data[0]), data[2]);
            }
        else {
            if (this.isMultiply) {
                this.node.setScale(temp.multiplyScalar(data));
            } else {
                this.node.setScale(data, data, data);
            }
        }
    }
}
