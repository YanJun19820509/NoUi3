
import { _decorator, Component, Node, math } from 'cc';
import { no } from '../no';
import { YJScrollPanel } from '../widget/scrollPanel/YJScrollPanel';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetScrollPanel
 * DateTime = Mon Aug 15 2022 09:57:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollPanel.ts
 * FileBasenameNoExtension = SetScrollPanel
 * URL = db://assets/NoUi3/fuckui/SetScrollPanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 设置YJScrollPanel
 * data:{
 *     pos?: [x,y],
 *     target?: string,
 *     scale?: number,
 *     offset?: number[],
 *     duration?: number
 * }
 */
@ccclass('SetScrollPanel')
@requireComponent(YJScrollPanel)
export class SetScrollPanel extends FuckUi {
    protected onDataChange(data: any) {
        let { pos, target, scale, offset, duration }: { pos?: number[], target?: string, scale?: number, offset?: number[], duration?: number } = data;
        let sp = this.getComponent(YJScrollPanel);
        let os = offset ? math.v2(offset[0], offset[1]) : null;
        if (pos) {
            let p = math.v3(pos[0], pos[1]);
            if (scale) sp.scrollToAndScale(p, scale, os, duration);
            else sp.scrollTo(p, os, duration);
        } else if (target) {
            if (scale) sp.scrollToTargetAndScale(target, scale, os, duration);
            else sp.scrollToTarget(target, os, duration);
        } else if (scale) sp.scaleTo(scale, duration);
    }
}
