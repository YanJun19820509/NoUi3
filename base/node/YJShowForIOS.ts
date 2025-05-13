
import { ccclass, Component, property, sys } from '../../yj';

/**
 * Predefined variables
 * Name = YJShowForIOS
 * DateTime = Wed Aug 17 2022 18:33:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForIOS.ts
 * FileBasenameNoExtension = YJShowForIOS
 * URL = db://assets/common/base/node/YJShowForIOS.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowForIOS')
/**
 * iOS平台显示控制组件
 * @remarks
 * - 根据运行平台自动控制节点销毁
 * - 支持反向逻辑配置（reverse=true时iOS平台销毁，其他平台保留）
 * - 适用于平台专属功能控制（如iOS特定UI元素）
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要iOS控制的节点
 * 2. 勾选reverse表示"非iOS时显示"
 * 
 * // 代码动态创建示例：
 * const iosNode = new Node('iOSOnly');
 * const comp = iosNode.addComponent(YJShowForIOS);
 * comp.reverse = true; // 设置为反向模式（iOS时销毁）
 */
export class YJShowForIOS extends Component {
    /**
     * 反向逻辑开关
     * @property {boolean} reverse
     * @tip 
     * - true: iOS平台销毁节点，其他平台保留
     * - false: 非iOS平台销毁节点，iOS平台保留（默认）
     */
    @property({ displayName: '取反', tooltip: '开启时iOS平台销毁节点，其他平台保留' })
    reverse: boolean = false;

    /**
     * 组件初始化时执行平台检测
     * @remarks
     * 执行流程：
     * 1. 检查组件是否启用
     * 2. 判断当前运行平台
     * 3. 根据reverse设置决定是否销毁节点
     * 
     * @example
     * // 逻辑说明：
     * - reverse=false时（默认）：
     *   iOS平台保留节点，其他平台销毁
     * - reverse=true时：
     *   iOS平台销毁节点，其他平台保留
     */
    onLoad() {
        // 组件未启用时直接返回
        if (!this.enabled) return;
        
        // 平台检测与销毁逻辑
        const isIOS = sys.os == sys.OS.IOS;
        if (isIOS && this.reverse) {
            // iOS平台且开启反向模式时销毁
            this.node.destroy();
        } else if (!isIOS && !this.reverse) {
            // 非iOS平台且未开启反向模式时销毁
            this.node.destroy();
        }
    }
}
