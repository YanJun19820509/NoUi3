import { ccclass, requireComponent } from '@hackUi/yj';
import { HackUi } from '@hackUi/ui/HackUi';
import { LanguageComp } from './LanguageComp';

/**
 * 
 * Author mqsy_yj
 * DateTime Mon Dec 15 2025 15:07:54 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetGuiLabel')
@requireComponent(LanguageComp)
export class SetGuiLabel extends HackUi {

    protected onDataChange(data: any) {
        this.getComponent(LanguageComp).setLabel(data);
    }
}
