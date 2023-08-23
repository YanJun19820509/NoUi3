import { ccclass, property } from '../../NoUi3/yj';
import { SpriteFrameInfo } from '../editor/YJLoadAssets';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * 根据状态设置不同的spriteframe
 * Author mqsy_yj
 * DateTime Wed Aug 23 2023 12:27:37 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetSpriteFrameWithStateInfo')
export class SetSpriteFrameWithStateInfo {
    @property({ displayName: '条件', tooltip: '多条件用,分隔' })
    condition: string = '';
    @property({ type: SpriteFrameInfo })
    spriteFrame: SpriteFrameInfo = new SpriteFrameInfo();

    private conditions: string[];

    public check(v: string, comp: any) {
        if (!this.conditions) this.conditions = this.condition.split(',');
        let a = this.conditions.indexOf(v) != -1;
        if (a) {
            comp.setData(no.jsonStringify(this.spriteFrame.assetName));
        }
    }
}

@ccclass('SetSpriteFrameWithState')
export class SetSpriteFrameWithState extends FuckUi {
    @property({ type: SetSpriteFrameWithStateInfo })
    stateInfos: SetSpriteFrameWithStateInfo[] = [];

    /**如果没需求可以不实现 */
    // onLoad() {
    //     super.onLoad();
    //     // todo 自己的逻辑
    // }

    protected onDataChange(data: any) {
        const comp = this.getComponent('SetSpriteFrameInSampler2D') || this.getComponent('SetSpriteFrame');
        if (!comp) return;
        this.stateInfos.forEach(info => {
            info.check(String(data), comp);
        });
    }

    /**如果没需求可以不实现 */
    // public a_setEmpty(): void {

    // }
}
