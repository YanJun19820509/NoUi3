import { _decorator, Component, Node } from 'cc';
import { YJVertexColorTransitionManager } from 'NoUi3/engine/YJVertexColorTransition';
import { YJDataWorkManager } from './YJDataWorkManager';
const { ccclass, property } = _decorator;
/**
 * 延迟更新管理器,用于处理各种管理器的延迟更新
 */
@ccclass('YJLateUpdateManager')
export class YJLateUpdateManager extends Component {
    protected lateUpdate(dt: number): void {
        YJDataWorkManager.ins().lastUpdate();
        YJVertexColorTransitionManager.ins().lateUpdate();
    }
}


