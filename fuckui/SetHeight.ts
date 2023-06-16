
import { ccclass, property, menu, UITransform } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetHeight
 * DateTime = Mon Jan 17 2022 10:49:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetHeight.ts
 * FileBasenameNoExtension = SetHeight
 * URL = db://assets/Script/NoUi3/fuckui/SetHeight.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetHeight')
@menu('NoUi/ui/SetHeight(设置高:number)')
export class SetHeight extends FuckUi {

    @property({ displayName: '是否百分比' })
    percent: boolean = false;
    @property({ displayName: '最大值', visible() { return this.percent; } })
    max: number = 0;

    protected onDataChange(data: any) {
        if (!this.node?.getComponent(UITransform)) return;
        this.node.getComponent(UITransform).height = this.caculate(data);
    }

    protected caculate(data: any): number {
        let h = Number(data);
        if (this.percent) {
            if (h > 1) h = 1;
            h *= this.max;
        }
        return h;
    }
}
