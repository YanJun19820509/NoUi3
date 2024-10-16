
import { ccclass, property, easing } from '../../yj';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
import { EasingTypeName } from 'NoUi3/types';

/**
 * Predefined variables
 * Name = YJFloatTips
 * DateTime = Tue Apr 19 2022 09:26:13 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJFloatTips.ts
 * FileBasenameNoExtension = YJFloatTips
 * URL = db://assets/NoUi3/widget/floatTips/YJFloatTips.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJFloatTips')
export class YJFloatTips extends YJDataWork {
    @property({ step: 0.1, min: 0.1, displayName: '间隔时长(s)' })
    delay: number = 0.1;
    @property({ step: 0.1, min: 0.1, displayName: '上升时长(s)' })
    upDuration: number = 0.5;
    @property({ step: 0.1, min: 0.1, displayName: '停留时长(s)' })
    stayDuration: number = 1;
    @property({ step: 1, min: 1 })
    maxHeight: number = 100;

    private tipList = [];
    private isShowing = false;

    public setTips(tips: string | string[]): void {
        this.tipList = this.tipList.concat(tips);
        if (this.isShowing) return;
        this.isShowing = true;
        this.show();
    }

    private async show() {
        await no.waitFor(() => { return this.enabledInHierarchy; }, this);
        let tip = this.tipList.shift();
        if (!tip) {
            this.isShowing = false;
            return;
        }

        this.setValue('tip', {
            txt: tip,
            move: [
                {
                    set: 1,
                    props: {
                        pos: [0, 0, 0],
                        opacity: 255
                    }
                },
                {
                    to: 1,
                    duration: this.upDuration,
                    props: {
                        pos: [0, this.maxHeight - 50, 0]
                    }
                },
                {
                    to: 1,
                    duration: this.stayDuration,
                    props: {
                        pos: [0, this.maxHeight, 0],
                        opacity: 0
                    },
                    easing: EasingTypeName.BackIn
                }
            ]
        });

        if (this.tipList.length == 0) {
            this.isShowing = false;
            return;
        }
        this.scheduleOnce(() => {
            this.show();
        }, this.delay);
    }
}
