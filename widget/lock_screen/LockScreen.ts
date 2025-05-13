import { _decorator } from 'cc';
import { YJPanel } from '../../../common/base/node/YJPanel';
import { panelPrefabPath } from '../../../common/types';
import { no } from '../../../common/no';
const { ccclass, property } = _decorator;

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Aug 10 2023 11:24:08 GMT+0800 (中国标准时间)
 *
 */

@ccclass('LockScreen')
@panelPrefabPath('db://assets/common/widget/lock_screen/lock_screen.prefab')
/**
 * 锁屏面板组件
 * @example
 * // 显示锁屏（防止界面操作）
 * LockScreen.show();
 * 
 * // 隐藏锁屏（通常在异步操作完成后调用）
 * LockScreen.hide();
 * 
 * // 使用示例 - 在加载数据时显示锁屏
 * async loadData() {
 *     LockScreen.show();
 *     const data = await fetchData();
 *     LockScreen.hide();
 *     processData(data);
 * }
 */
export class LockScreen extends YJPanel {
    /** 单例实例 */
    private static _ins: LockScreen;
    /** 显示状态标记（0:隐藏 1:显示中） */
    private static _showing = 0;
    /** 内部状态标记（用于防止重复初始化） */
    private _1 = 0;

    onLoad() {
        super.onLoad();
        // 建立单例引用
        LockScreen._ins = this;
    }

    onDestroy() {
        // 清除单例引用
        LockScreen._ins = null;
    }

    /**
     * 显示锁屏面板
     * @description 创建并显示半透明遮罩层，阻止所有界面交互
     * 使用YJWindowManager创建面板，'mess'参数表示使用消息窗口层级
     */
    public static show() {
        this._showing = 1;
        YJWindowManager.createPanel<LockScreen>(LockScreen, 'mess');
    }

    /**
     * 隐藏锁屏面板（异步方法）
     * @description 先重置显示状态标记，等待面板实例化完成后执行关闭
     * 包含防抖逻辑：如果在隐藏过程中再次调用show()，会取消隐藏操作
     */
    public static async hide() {
        this._showing = 0;
        // 等待直到实例化完成
        if (!this._ins)
            await no.waitFor(() => { return !!this._ins; });
        // 检查是否在等待过程中有新的显示请求
        if (this._showing == 1) return;
        this._ins?.closePanel();
    }
}