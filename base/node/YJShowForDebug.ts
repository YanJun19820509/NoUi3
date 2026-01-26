
import { ccclass, menu, Component } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJShowForDebug
 * DateTime = Fri Jan 14 2022 16:35:09 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForDebug.ts
 * FileBasenameNoExtension = YJShowForDebug
 * URL = db://assets/Script/common/base/node/YJShowForDebug.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJShowForDebug')
@menu('NoUi/node/YJShowForDebug(debug模式下显示)')
/**
 * 调试模式显示控制组件
 * @remarks
 * - 根据全局调试标志控制节点显示状态
 * - 监听调试标志变化实时更新显示状态
 * - 适用于开发阶段需要隐藏的调试工具按钮等场景
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要调试控制的节点
 * 2. 确保全局存在 window.show_GM_btn 变量
 * 3. 运行时通过 no.evn.emit('show_GM_btn') 触发状态更新
 * 
 * // 代码动态创建示例：
 * const debugNode = new Node('DebugPanel');
 * debugNode.addComponent(YJShowForDebug);
 */
export class YJShowForDebug extends Component {
    /**
     * 组件初始化时执行
     * @remarks
     * 执行流程：
     * 1. 检查组件是否启用
     * 2. 根据当前调试标志设置初始显示状态
     * 3. 注册调试标志变化监听事件
     */
    onLoad() {
        // 组件未启用时直接返回
        if (!this.enabled) return;

        // // 初始化节点显示状态（根据全局调试标志）
        // this.node.active = window['show_GM_btn'];

        // // 注册调试标志变化监听
        // no.evn.on('show_GM_btn', () => {
        //     // 安全校验：确保节点未被销毁
        //     if (this?.node?.isValid) {
        //         // 同步最新调试标志到节点显示状态
        //         this.node.active = window['show_GM_btn'];
        //     }
        // }, this);

        this.node.active = no.isDebug();
    }

    /**
     * 组件销毁时清理
     * @remarks
     * 移除所有事件监听，防止内存泄漏
     */
    onDestroy() {
        // 移除本组件注册的所有事件监听
        no.evn.targetOff(this);
    }
}
