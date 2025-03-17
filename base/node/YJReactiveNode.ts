import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
/**
 * 适用于解决当YJShowHideAllSubRenderNode显示所有节点时，部分节点显示异常的情况，配合YJOnVisibleChange来使用
 */
/**
 * 响应式节点激活组件
 * @remarks 
 * 用于强制刷新节点渲染状态，解决某些情况下节点显示异常的问题。
 * 通过先禁用再立即启用的方式触发渲染组件的重新初始化。
 * 需要配合 YJOnVisibleChange 组件使用以实现可见性变化监听。
 */
@ccclass('YJReactiveNode')
export class YJReactiveNode extends Component {
    /**
     * 激活刷新节点方法
     * @remarks
     * 执行流程：
     * 1. 临时设置节点为不可见状态
     * 2. 立即恢复节点可见状态
     * 3. 触发渲染组件的重新初始化
     * 
     * @example
     * // 定时刷新节点：
     * setInterval(() => {
     *     this.reactiveNode.a_reactive();
     * }, 5000);
     */
    public a_reactive() {
        // 通过状态切换强制刷新渲染
        this.node.active = false; // 触发禁用状态
        this.node.active = true;  // 立即重新激活
    }
}


