
import { ccclass, Component, Vec3 } from '../yj';
import { _SetMoveAlongWithPath } from '../types';

/**
 * Predefined variables
 * Name = SetMoveAlongWithPath
 * DateTime = Mon Jan 17 2022 11:49:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetMoveAlongWithPath.ts
 * FileBasenameNoExtension = SetMoveAlongWithPath
 * URL = db://assets/Script/NoUi3/fuckui/SetMoveAlongWithPath.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* 沿路线移动的代理
*/
@ccclass('YJMoveAlongWithPathDelegate')
export class YJMoveAlongWithPathDelegate extends Component {
    /**
     * 移动开始时
     * @param m
     */
    public onStart(m: _SetMoveAlongWithPath) { }
    /**
     * 改变方向时
     * @param from
     * @param to
     */
    public onChangeDirection(from: Vec3, to: Vec3, vector: Vec3): void { }
    /**
     * 移动中
     * @param m
     */
    public onMoving(m: _SetMoveAlongWithPath): void { }
    /**
     * 移动结束
     */
    public onEnd() { }
    /**
     * 移动暂停
     */
    public onPause() { }
    /**
     * 移动继续
     */
    public onResume() { }
    /**
     * 移动过程中的特殊时刻
     * @param d
     * @returns
     */
    public onSpecialStep(d: any): boolean {
        return false;
    }
    /**
     * 抵达某个点位时
     * @param d 
     */
    public onReach(d: any) { }

}