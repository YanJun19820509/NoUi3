
import { _decorator, Component, Node, easing } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
const { ccclass, property } = _decorator;

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

    private tipList = [];
    private isShowing = false;

    public setTips(tips: string | string[]): void {
        this.tipList = this.tipList.concat(tips);
        if (this.isShowing) return;
        this.isShowing = true;
        this.show();
    }

    private show() {
        if (this.tipList.length == 0) {
            this.isShowing = false;
            return;
        }
        let tip = this.tipList.shift();
        if (!tip) {
            this.show();
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
                        pos: [0, 550, 0]
                    }
                },
                {
                    to: 1,
                    duration: this.stayDuration,
                    props: {
                        pos: [0, 600, 0],
                        opacity: 0
                    },
                    easing: easing.backIn
                }
            ]
        });

        this.scheduleOnce(() => {
            this.show();
        }, this.delay);
    }
}
