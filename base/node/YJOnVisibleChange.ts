import { no } from "../../no";
import { Component, ccclass, property } from "../../yj";


@ccclass('YJOnVisibleChange')
/**
 * 节点显隐状态变化监听组件
 * @remarks
 * 功能特性：
 * - 监听节点的显隐状态变化
 * - 支持分别配置可见/不可见时的回调事件
 * @example
 * // 典型应用场景：
 * // 1. UI元素显隐时播放动画效果
 * // 2. 对象池对象回收时重置状态
 * // 3. 3D物体进入视野时加载资源
 */
export class YJOnVisibleChange extends Component {
    /** 
     * 当节点变为可见状态时触发的事件
     * @property {no.EventHandlerInfo[]} onVisible - 显示事件处理器数组
     * @example
     * // 在编辑器中配置：
     * // 1. 拖入响应节点
     * // 2. 选择组件方法，如：AnimationPlayer.playShowAnim
     * // 3. 可配置多个响应不同逻辑的处理器
     */
    @property({ type: no.EventHandlerInfo, displayName: '可见时' })
    onVisible: no.EventHandlerInfo[] = [];

    /** 
     * 当节点变为不可见状态时触发的事件 
     * @property {no.EventHandlerInfo[]} onInVisible - 隐藏事件处理器数组
     * @example
     * // 配置隐藏时停止粒子效果：
     * // 1. 绑定粒子系统的stop()方法
     * // 2. 参数可留空或传递隐藏原因等附加信息
     */
    @property({ type: no.EventHandlerInfo, displayName: '不可见时' })
    onInVisible: no.EventHandlerInfo[] = [];

    /**
     * 显隐状态改变处理方法
     * @param v 新的可见状态 true=可见 false=不可见
     * @remarks
     * 执行逻辑：
     * - 根据状态值触发对应事件处理器
     * - 支持运行时动态调用改变状态
     * @example
     * // 脚本中手动控制显隐：
     * this.getComponent(YJOnVisibleChange).changeVisible(false);
     * 
     * // 配合对象池使用：
     * objectPool.put(item.node);
     * item.getComponent(YJOnVisibleChange).changeVisible(false);
     */
    public changeVisible(v: boolean) {
        if (v) no.EventHandlerInfo.execute(this.onVisible);
        else no.EventHandlerInfo.execute(this.onInVisible);
    }
}


