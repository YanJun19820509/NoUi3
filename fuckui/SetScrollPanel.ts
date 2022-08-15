
import { _decorator, Component, Node, math } from 'cc';
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
 *     scale?: number
 * }
 */
@ccclass('SetScrollPanel')
@requireComponent(YJScrollPanel)
export class SetScrollPanel extends FuckUi {
    protected onDataChange(data: any) {
        let { pos, target, scale }: { pos: number[], target: string, scale: number } = data;
        let sp = this.getComponent(YJScrollPanel);

        if (pos) {
            if (scale) sp.scrollToAndScale(math.v3(pos[0], pos[1]), scale);
            else sp.scrollTo(math.v3(pos[0], pos[1]));
        } else if (target) {
            if (scale) sp.scrollToTargetAndScale(target, scale);
            else sp.scrollToTarget(target);
        } else if (scale) sp.scaleTo(scale);
    }
}
