
import { JSB, ccclass, Component, Node } from '../../yj';

/**
 * Predefined variables
 * Name = YJShowForJSB
 * DateTime = Wed Aug 17 2022 18:33:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForJSB.ts
 * FileBasenameNoExtension = YJShowForJSB
 * URL = db://assets/NoUi3/base/node/YJShowForJSB.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowForJSB')
/**
 * JSB环境显示控制组件
 * @remarks
 * - 根据运行环境自动控制节点销毁
 * - 仅在原生平台（JSB环境）保留节点，其他环境自动销毁
 * - 适用于区分原生应用和Web环境的场景
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要原生环境控制的节点
 * 2. 运行时在浏览器等非JSB环境会自动销毁节点
 * 
 * // 代码动态创建示例：
 * const node = new Node('NativeOnly');
 * node.addComponent(YJShowForJSB); // 非原生环境自动销毁
 */
export class YJShowForJSB extends Component {
    /**
     * 组件初始化时执行环境检测
     * @remarks
     * 执行流程：
     * 1. 检查组件是否启用
     * 2. 判断当前是否JSB环境（原生平台）
     * 3. 非JSB环境立即销毁节点
     * 
     * @example
     * // 逻辑说明：
     * - 在Android/iOS原生应用保留节点
     * - 在浏览器/微信小游戏等环境销毁节点
     * - 编辑器模式下不会立即销毁，保持设计时可见
     */
    onLoad() {
        // 组件未启用时直接返回
        if (!this.enabled) return;
        
        // 非JSB环境（浏览器/小程序等）销毁节点
        !JSB && this.node.destroy();
    }
}
