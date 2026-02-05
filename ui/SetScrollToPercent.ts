
import { ccclass, property, menu, ScrollView, v2, Vec2, UITransform, Size, size } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetScrollToPercent
 * DateTime = Mon Jan 17 2022 14:06:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollToPercent.ts
 * FileBasenameNoExtension = SetScrollToPercent
 * URL = db://assets/Script/common/ui/SetScrollToPercent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * data:number|{per:number, duration: number}
 */

@ccclass('SetScrollToPercent')
@menu('NoUi/ui/SetScrollToPercent(设置scrollView滚动到:number(0-1))')
/**
 * 滚动到指定百分比位置
 * data:number|{per:number, duration: number}
 */
export class SetScrollToPercent extends HackUi {
    /**
     * 目标滚动视图组件
     * @property {ScrollView} scrollView
     * @example 
     * // 在编辑器中拖拽ScrollView节点到该属性
     * this.scrollView = myScrollViewNode.getComponent(ScrollView);
     */
    @property(ScrollView)
    scrollView: ScrollView = null;

    /**
     * 单个元素尺寸
     * @property {Size} itemSize
     * @example
     * // 单个元素尺寸为100x100
     * this.itemSize = size(100, 100);
     */
    @property
    itemSize: Size = size();

    /**
     * 目标位置在可视范围内的相对位置（0-1）
     * @规则：
     * - 0表示目标位置对齐到视口左/下边缘
     * - 1表示对齐到右/上边缘
     * - 0.5表示居中（默认值）
     * @example 
     * // 设置目标位置在视口右1/3处
     * this.at = 0.66;
     */
    @property({ displayName: '目标位置在可视范围内0-1', min: 0, max: 1 })
    at: number = 0.5;

    /**
     * 滚动动画持续时间（秒）
     * @规则：
     * - 0表示立即跳转
     * - 大于0时执行平滑滚动
     * @example
     * // 设置1.5秒的滚动动画
     * this.duration = 1.5;
     */
    @property({ displayName: '滚动动画时长(秒)', min: 0 })
    duration: number = 0;

    /**
     * 执行滚动前的等待时间（秒）
     * @适用场景：
     * - 需要等待布局刷新后执行滚动
     * - 需要延迟触发的滚动需求
     * @example
     * // 延迟0.3秒后执行滚动
     * this.wait = 0.3;
     */
    @property({ displayName: '等待时长(秒)', min: 0 })
    wait: number = 0;

    /**
     * 数据变化处理函数
     * @param data 滚动参数，支持两种格式：
     * - number: 直接设置滚动百分比（0-1）
     * - object: 复杂配置 { per: 0.5, duration: 1 }
     * @example
     * // 滚动到50%位置
     * this.a_setData(0.5);
     * // 滚动到30%位置并使用2秒动画
     * this.a_setData({ per: 0.3, duration: 2 });
     */
    protected onDataChange(data: any) {
        // 使用定时器延迟执行，确保节点布局完成
        this.scheduleOnce(() => {
            if (typeof data == 'number')
                this.a_scrollToPercent(data);
            else this.a_scrollToPercent(data.per, data.duration);
        }, this.wait);
    }

    /**
     * 滚动到指定百分比位置
     * @param per 滚动百分比（0-1）
     * @param duration 可选参数，覆盖默认动画时长
     * @实现说明：
     * 1. 计算内容总尺寸和视口尺寸
     * 2. 根据百分比计算目标偏移量
     * 3. 应用滚动方向限制
     * 4. 执行滚动动画
     * @example
     * // 滚动到75%位置
     * this.a_scrollToPercent(0.75);
     * // 滚动到顶部并使用自定义时长
     * this.a_scrollToPercent(0, 1.5);
     */
    public a_scrollToPercent(per: number, duration?: number) {
        if (!this.scrollView?.isValid) return;
        // 获取内容容器尺寸
        let cs = this.scrollView.content.getComponent(UITransform).getBoundingBox().size;
        // 获取视口尺寸
        let ns = this.scrollView.node.getComponent(UITransform).getBoundingBox().size;
        let at = this.at;


        // 计算per所在位置相对于视口的位置百分比
        let curOffet = this.scrollView.getScrollOffset();
        let targetPos: number;
        if (!this.scrollView.vertical) {
            targetPos = cs.width * per + curOffet.x + this.itemSize.width / 2;
        }
        if (!this.scrollView.horizontal) {
            targetPos = cs.height * per - curOffet.y - this.itemSize.height / 2;
        }
        let targetPer = targetPos / ns.width;

        if (targetPer < 1) {
            if (targetPer < .5) {
                if (at > 0.5)
                    at = 1 - at;
                if (targetPer > at) return;
            } else if (targetPer > .5) {
                if (at < 0.5)
                    at = 1 - at;
                if (targetPer < at) return;
            }
        }

        // 计算目标偏移量（考虑视口相对位置和自定义偏移）
        let offset = v2(
            cs.width * per - ns.width * at + (at < 0.5 ? this.itemSize.width : 0),
            cs.height * per - ns.height * at + (at < 0.5 ? this.itemSize.height : 0)
        );

        // 根据滚动方向重置不需要的轴向偏移
        if (!this.scrollView.vertical) offset.y = 0;
        if (!this.scrollView.horizontal) offset.x = 0;

        // 使用自定义时长或默认时长
        this.scrollToOffset(offset, duration ?? this.duration);
    }

    /**
     * 执行滚动到指定偏移量
     * @param offset 目标偏移量（像素）
     * @param duration 滚动持续时间（秒）
     * @实现说明：
     * 1. 限制偏移量在合法范围内
     * 2. 调用ScrollView原生滚动方法
     * @example
     * // 滚动到(100, 50)位置
     * this.scrollToOffset(v2(100, 50), 1);
     */
    protected scrollToOffset(offset: Vec2, duration = 0) {
        if (!this.scrollView) return;
        //立即停止自动滚动
        this.scrollView.stopAutoScroll();
        // 获取最大允许偏移量
        let maxOffset = this.scrollView.getMaxScrollOffset();
        // 限制X轴偏移范围
        offset.x = Math.max(0, Math.min(offset.x, maxOffset.x));
        // 限制Y轴偏移范围
        offset.y = Math.max(0, Math.min(offset.y, maxOffset.y));
        // 执行滚动
        this.scrollView.scrollToOffset(offset, duration);
        if (duration == 0) {
            this.scrollView.node.emit(ScrollView.EventType.SCROLLING);
        }
    }
}
