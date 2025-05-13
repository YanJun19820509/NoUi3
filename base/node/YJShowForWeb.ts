
import { JSB, ccclass, Component, Node } from '../../yj';

/**
 * Predefined variables
 * Name = YJShowForWeb
 * DateTime = Tue Aug 09 2022 11:51:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForWeb.ts
 * FileBasenameNoExtension = YJShowForWeb
 * URL = db://assets/common/base/node/YJShowForWeb.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowForWeb')
/**
 * Web平台显示控制组件
 * @remarks
 * - 根据运行环境自动控制节点显示状态
 * - 仅在浏览器环境（DESKTOP_BROWSER）保留节点，原生平台自动销毁
 * - 适用于区分Web和原生应用的场景
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要Web环境控制的节点
 * 2. 运行时在Android/iOS等原生平台会自动销毁节点
 * 
 * // 代码动态创建示例：
 * const webNode = new Node('WebOnly');
 * webNode.addComponent(YJShowForWeb); // 原生环境自动销毁
 */
export class YJShowForWeb extends Component {
    /**
     * 组件初始化时执行环境检测
     * @remarks
     * 执行流程：
     * 1. 检查组件是否启用
     * 2. 判断当前是否原生平台（JSB环境）
     * 3. 原生平台立即销毁节点
     * 
     * @example
     * // 逻辑说明：
     * - JSB=true 表示原生环境（Android/iOS）
     * - sys.Platform.DESKTOP_BROWSER 表示浏览器环境
     * - 组件仅在浏览器环境保持显示
     */
    onLoad() {
        // 组件未启用时直接返回
        if (!this.enabled) return;
        
        // 原生平台（Android/iOS）销毁节点
        JSB && this.node.destroy();
    }
}
