import { YJSliderButton } from "../widget/sliderButton/YJSliderButton";
import { ccclass, requireComponent } from "../yj";
import { FuckUi } from "./FuckUi";
/**
 * Predefined variables
 * Name = SetSliderButtonChecked
 * DateTime = Sat Jul 15 2023 14:14:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSliderButtonChecked.ts
 * FileBasenameNoExtension = SetSliderButtonChecked
 * URL = db://assets/NoUi3/fuckui/SetSliderButtonChecked.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSliderButtonChecked')
@requireComponent(YJSliderButton)
export class SetSliderButtonChecked extends FuckUi {
    protected onDataChange(data: any): void {
        this.getComponent(YJSliderButton).isChecked = Boolean(data);
    }
}
