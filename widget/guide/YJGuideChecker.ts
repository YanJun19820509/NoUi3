
import { ccclass, property, Component, CCString } from '../../yj';
import { YJGuideManager } from './YJGuideManager';

/**
 * Predefined variables
 * Name = YJGuideChecker
 * DateTime = Mon May 16 2022 09:22:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGuideChecker.ts
 * FileBasenameNoExtension = YJGuideChecker
 * URL = db://assets/NoUi3/widget/guide/YJGuideChecker.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJGuideChecker')
export class YJGuideChecker extends Component {
    @property({ type: CCString })
    steps: string[] = [];
    @property
    autoCheckonEnable: boolean = true;

    onEnable() {
        this.autoCheckonEnable && this.a_check();
    }

    public a_check(): void {
        for (let i = 0, n = this.steps.length; i < n; i++) {
            if (YJGuideManager.ins.check(this.steps[i])) return;
        }
    }

}
