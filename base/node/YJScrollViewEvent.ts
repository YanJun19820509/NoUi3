
/**
 * scrollview的scrollEvents扩展，运行时自动添加滚动事件
 * Author mqsy_yj
 * DateTime Mon Aug 14 2023 12:13:53 GMT+0800 (中国标准时间)
 *
 */

import { no } from "../../no";
import { Component, ScrollView, Vec2, ccclass, property, requireComponent } from "../../yj";

const eventTypeMap = {
    0: 'scroll-to-top',
    1: 'scroll-to-bottom',
    2: 'scroll-to-left',
    3: 'scroll-to-right',
    4: 'scrolling',
    6: 'bounce-bottom',
    7: 'bounce-left',
    8: 'bounce-right',
    5: 'bounce-top',
    9: 'scroll-ended',
    10: 'touch-up',
    11: 'scroll-ended-with-threshold',
    12: 'scroll-began'
};

@ccclass('YJScrollViewEvent')
@requireComponent(ScrollView)
/**
 * 滚动视图事件扩展组件
 * @remarks
 * - 自动为ScrollView添加滚动事件监听
 * - 支持多种滚动边界事件检测（顶部/底部/左侧/右侧）
 * - 提供通用滚动事件和具体边界到达事件分离
 * 
 * @example
 * // 编辑器使用示例：
 * 1. 添加YJScrollViewEvent组件到ScrollView节点
 * 2. 在onToBottom事件面板添加回调：
 *    - 目标节点: 你的脚本组件所在节点
 *    - 组件: 你的脚本组件名
 *    - 方法: 处理到底部时的回调方法
 * 
 * // 代码动态绑定示例：
 * const comp = scrollNode.addComponent(YJScrollViewEvent);
 * comp.onToTop.push(new no.EventHandlerInfo(targetNode, 'MyComponent', 'onReachTop'));
 */
export class YJScrollViewEvent extends Component {
    /** 
     * 通用滚动事件回调 
     * @remarks 可响应事件包括：
     * - scroll-to-top/bottom/left/right
     * - scrolling
     * - bounce-top/bottom/left/right
     * - scroll-ended/touch-up 等
     */
    @property({ type: no.EventHandlerInfo })
    onScroll: no.EventHandlerInfo[] = [];

    /** 精确滚动到顶部时触发（需完全到达顶部边界） */
    @property({ type: no.EventHandlerInfo })
    onToTop: no.EventHandlerInfo[] = [];

    /** 精确滚动到底部时触发（需完全到达底部边界） */
    @property({ type: no.EventHandlerInfo })
    onToBottom: no.EventHandlerInfo[] = [];

    /** 精确滚动到最左侧时触发（需完全到达左边界） */
    @property({ type: no.EventHandlerInfo })
    onToLeft: no.EventHandlerInfo[] = [];

    /** 精确滚动到最右侧时触发（需完全到达右边界） */
    @property({ type: no.EventHandlerInfo })
    onToRight: no.EventHandlerInfo[] = [];

    /** 
     * 事件绑定开关
     * @property {boolean} bind
     * @remarks
     * - 设置为true时自动配置ScrollView的scrollEvents
     * - 使用no.createClickEvent创建标准事件处理器
     * - 注意：需要确保ScrollView组件已存在
     */
    @property
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        this.getComponent(ScrollView).scrollEvents = [no.createClickEvent(
            this.node, 
            'YJScrollViewEvent', 
            'onScrollEvent'
        )];
    }

    /** 
     * 滚动区域最大偏移量缓存 
     * @remarks 用于判断是否到达滚动边界
     * - 通过ScrollView.getMaxScrollOffset()获取
     * - 在首次滚动事件时初始化
     */
    private _maxOffset: Vec2;
    
    /** 
     * 上一次滚动偏移量记录 
     * @remarks 用于：
     * - 检测滚动方向变化
     * - 避免重复触发边界事件
     */
    private _lastOffset: Vec2;

    /**
     * 统一滚动事件处理器
     * @param sv 关联的ScrollView组件实例
     * @param type 滚动事件类型枚举值（对应ScrollView.EventType）
     * 
     * @example
     * // 事件处理流程：
     * 1. 首次触发时初始化_maxOffset
     * 2. 转换事件类型为可读标识
     * 3. 执行通用滚动事件回调
     * 4. 在滚动结束时检测是否到达边界
     * 5. 更新偏移量记录
     */
    private onScrollEvent(sv: ScrollView, type: number) {
        // 初始化最大偏移量（仅在首次需要计算）
        if (!this._maxOffset) this._maxOffset = sv.getMaxScrollOffset();
        
        // 获取当前事件类型和滚动偏移量
        const et = eventTypeMap[type];
        const offset = sv.getScrollOffset();
        
        // 执行通用滚动事件回调
        no.EventHandlerInfo.execute(this.onScroll, et);

        // 初始化记录或更新前次偏移量
        if (!this._lastOffset) {
            this._lastOffset = offset;
            return;
        }

        // 仅在滚动完全结束时触发精确边界检测
        if (et == ScrollView.EventType.SCROLL_ENDED) {
            // 垂直方向边界检测
            if (offset.y == 0 && this._maxOffset.y != 0) {
                no.EventHandlerInfo.execute(this.onToTop); // 触发顶部回调
            } else if (offset.y != 0 && offset.y == this._maxOffset.y) {
                no.EventHandlerInfo.execute(this.onToBottom); // 触发底部回调
            }

            // 水平方向边界检测
            if (offset.x == 0 && this._maxOffset.x != 0) {
                no.EventHandlerInfo.execute(this.onToLeft); // 触发左侧回调
            } else if (offset.x != 0 && offset.x == this._maxOffset.x) {
                no.EventHandlerInfo.execute(this.onToRight); // 触发右侧回调
            }
        }

        // 更新偏移量记录用于下次比较
        this._lastOffset = offset;
    }
}


