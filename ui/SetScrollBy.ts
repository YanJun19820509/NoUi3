
import { ccclass, menu } from '../yj';
import { SetScrollToPercent } from './SetScrollToPercent';

/**
 * Predefined variables
 * Name = SetScrollBy
 * DateTime = Mon Jan 17 2022 14:16:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollBy.ts
 * FileBasenameNoExtension = SetScrollBy
 * URL = db://assets/Script/common/ui/SetScrollBy.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScrollBy')
@menu('NoUi/ui/SetScrollBy(设置scrollView滚动到节点:string)')
/**
 * 滚动到指定距离
 * data:number
 */
export class SetScrollBy extends SetScrollToPercent {

    /**
     * 当数据变化时延迟执行滚动到节点操作
     * @param data 目标节点名称 
     */
    protected onDataChange(data: any) {
        // 使用定时器延迟执行，确保节点布局完成
        this.scheduleOnce(() => {
            this.a_scrollBy(data);
        }, this.wait);
    }

    /**
     * 滚动到指定距离
     * @param v 目标距离
     * @example
     * // 将ScrollView滚动到距离100
     * this.a_scrollBy(100);
     */
    public a_scrollBy(v: number) {
        // 验证ScrollView有效性
        if (!this.scrollView?.isValid) return;
        const offset = this.scrollView.getScrollOffset();

        if (!this.scrollView.vertical) {
            offset.x += v;
        }
        if (!this.scrollView.horizontal) {
            offset.y += v;
        }

        // 执行滚动动画
        this.scrollToOffset(offset, this.duration);
    }
}
