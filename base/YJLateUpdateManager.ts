import { _decorator, Component, Node } from 'cc';
import { YJVertexColorTransitionManager } from '../engine/YJVertexColorTransition';
import { YJDataWorkManager } from './YJDataWorkManager';
const { ccclass, property } = _decorator;
/**
 * 延迟更新管理器,用于处理各种管理器的延迟更新
 */
@ccclass('YJLateUpdateManager')
/**
 * 延迟更新管理器
 * 功能：
 * 1. 在引擎lateUpdate阶段统一处理各管理器的延迟逻辑
 * 2. 确保不同管理器更新顺序的稳定性
 * 3. 避免帧间依赖导致的更新时序问题
 * 
 * 使用示例：
 * // 在需要延迟更新的组件中
 * const lateMgr = this.node.getComponent(YJLateUpdateManager);
 * // 通常由引擎自动调用，特殊情况下可手动触发
 * // lateMgr.lateUpdate(deltaTime);
 */
export class YJLateUpdateManager extends Component {
    /**
     * 引擎延迟更新回调
     * @param dt 距上一帧的增量时间（秒）
     */
    protected lateUpdate(dt: number): void {
        // 数据管理器的最终提交阶段
        YJDataWorkManager.ins().lastUpdate();
        // 顶点颜色过渡的后期处理
        YJVertexColorTransitionManager.ins().lateUpdate();
    }

    // protected update(dt: number): void {
    //     // 数据管理器的最终提交阶段
    //     YJDataWorkManager.ins().lastUpdate();
    //     // 顶点颜色过渡的后期处理
    //     YJVertexColorTransitionManager.ins().lateUpdate();
    // }
}


