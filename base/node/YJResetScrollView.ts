
import { ccclass, property, requireComponent, Component, Node, ScrollView } from '../../yj';

/**
 * Predefined variables
 * Name = YJResetScrollView
 * DateTime = Sat May 07 2022 16:25:24 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJResetScrollView.ts
 * FileBasenameNoExtension = YJResetScrollView
 * URL = db://assets/NoUi3/base/node/YJResetScrollView.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJResetScrollView')
@requireComponent(ScrollView)
/**
 * 滚动视图重置组件
 * @remarks
 * - 提供滚动视图自动复位功能
 * - 支持水平和垂直双方向滚动容器
 * - 可配置复位位置和动画时长
 * 
 * @example
 * // 在列表更新后自动复位滚动位置：
 * listUpdateCallback = () => {
 *     this.dataList.push(newItem);
 *     this.resetScrollView.a_reset();
 * }
 * 
 * // 通过事件触发复位：
 * no.evn.on('RESET_SCROLL', () => {
 *     this.getComponent(YJResetScrollView)?.a_reset();
 * });
 */
export class YJResetScrollView extends Component {
    /**
     * 复位方向控制
     * @property {boolean} topLeft=true
     * @remarks
     * - 当滚动视图为水平方向时：true=滚动到最左侧，false=滚动到最右侧
     * - 当滚动视图为垂直方向时：true=滚动到顶部，false=滚动到底部
     * @example
     * // 聊天窗口场景：新消息到达时自动滚动到底部
     * @property({ tooltip: '滚动到底部' })
     * topLeft = false;
     */
    @property({ tooltip: 'topLeft滚动到顶部或左边，否则滚动到底部或右边，根据滚动的方向来判断' })
    topLeft: boolean = true;

    /**
     * 复位动画时长
     * @property {number} duration=0.1
     * @remarks
     * - 单位：秒
     * - 设置为0时无过渡动画
     * - 建议值范围：0-1秒
     * @example
     * // 快速复位无动画：
     * @property({ min: 0, step: 0.1, displayName: '动效时长(s)' })
     * duration = 0;
     */
    @property({ min: 0, step: 0.1, displayName: '动效时长(s)' })
    duration: number = 0.1;

    /**
     * 组件启用时自动调度复位
     * @remarks
     * - 延迟到下一帧执行避免布局未完成
     * - 使用scheduleOnce保证只执行一次
     */
    onEnable() {
        this.scheduleOnce(this.a_reset);
    }

    /**
     * 执行滚动复位操作
     * @remarks
     * 执行流程：
     * 1. 获取ScrollView组件
     * 2. 根据当前滚动方向判断复位位置
     * 3. 执行带动画的滚动操作
     * 
     * @example
     * // 手动调用复位：
     * buttonNode.on(Node.EventType.TOUCH_END, () => {
     *     this.getComponent(YJResetScrollView)?.a_reset();
     * });
     */
    public a_reset(): void {
        const sv = this.getComponent(ScrollView);
        if (!sv) return;
        
        // 水平方向处理：0=最左侧，1=最右侧
        if (sv.horizontal) {
            sv.scrollToPercentHorizontal(this.topLeft ? 0 : 1, this.duration, true);
        }
        
        // 垂直方向处理：0=底部，1=顶部（注意坐标系方向）
        if (sv.vertical) {
            sv.scrollToPercentVertical(this.topLeft ? 1 : 0, this.duration, true);
        }
    }
}
