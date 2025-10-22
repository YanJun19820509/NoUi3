
import { no } from '../../no';
import { ccclass, Component, property, sys } from '../../yj';

/**
 * Predefined variables
 * Name = YJShowForAppVer
 * DateTime = Tue Aug 09 2022 11:51:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForAppVer.ts
 * FileBasenameNoExtension = YJShowForAppVer
 * URL = db://assets/common/base/node/YJShowForAppVer.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 根据appver判断节点是否显示
 */

@ccclass('YJShowForAppVer')
/**
 * 应用版本控制显示组件
 * @remarks
 * - 根据当前应用版本号控制节点显示状态
 * - 版本号格式要求：x.x.x（支持任意段数，如"1"或"1.2.3.4"）
 * - 适用于灰度测试、功能分阶段发布等场景
 * - 注意：在浏览器环境（DESKTOP_BROWSER）下始终不生效
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加组件到需要控制的节点
 * 2. 设置最小版本号（如"1.2.3"）
 * 3. 当实际应用版本>=设定版本时节点保持显示，否则自动销毁
 * 
 * // 代码动态创建示例：
 * const node = new Node('VersionControl');
 * const comp = node.addComponent(YJShowForAppVer);
 * comp.minAppVer = '2.0.1'; // 设置最低要求版本
 */
export class YJShowForAppVer extends Component {
    /**
     * 最低要求版本号
     * @property {string} minAppVer
     * @tip 
     * - 版本号格式为用点分隔的数字序列（如"1.2.3"）
     * - 留空表示始终显示
     * - 在编辑器模式下会立即生效（节点会变灰显示）
     */
    @property({ tooltip: '最低要求版本号（格式：1.2.3），留空则始终显示' })
    minAppVer: string = '';

    /**
     * 组件初始化时执行版本检查
     * @remarks
     * 执行流程：
     * 1. 检查组件是否启用
     * 2. 排除浏览器环境
     * 3. 拆分当前版本和最低版本为数字数组
     * 4. 逐段比较版本号
     * 5. 当检测到当前版本低于要求版本时销毁节点
     * 
     * @example
     * // 版本比较逻辑示例：
     * 当前版本"1.3" vs 最低版本"1.2.5" → 保持显示
     * 当前版本"2.0" vs 最低版本"2.0.1" → 销毁节点
     * 当前版本"1.4.2" vs 最低版本"1.4" → 保持显示
     */
    onLoad() {
        // 组件未启用或浏览器环境直接返回
        if (!this.enabled || sys.platform == sys.Platform.DESKTOP_BROWSER) return;

        // 拆分版本号为数字数组（空版本视为0.0.0...）
        const min = this.minAppVer.split('.').map(Number);
        const cur = no.appVer().split('.').map(Number);

        let minVer: number;
        let curVer: number;
        // 逐段比较版本号（处理不同长度版本号）
        for (let i = 0, n = Math.max(min.length, cur.length); i < n; i++) {
            minVer = min[i] || 0;    // 缺失版本段视为0
            curVer = cur[i] || 0;    // 例如：1.2 vs 1.2.3 → 1.2.0 vs 1.2.3

            // 发现当前版本段小于最低要求版本段
            if (curVer < minVer) {
                this.node.destroy(); // 立即销毁节点
                return;
            }
            // 当前版本段大于最低要求则通过检查
            if (curVer > minVer) break;
        }
    }
}
