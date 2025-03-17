
import { JSB, ccclass, property, disallowMultiple, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJReleasePrefab
 * DateTime = Sat May 07 2022 11:58:55 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJReleasePrefab.ts
 * FileBasenameNoExtension = YJReleasePrefab
 * URL = db://assets/NoUi3/base/node/YJReleasePrefab.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJReleasePrefab')
@disallowMultiple()
/**
 * 预制体资源释放组件
 * @remarks
 * - 用于在节点销毁时自动释放关联的预制体资源
 * - 支持强制释放模式（跳过引用计数直接释放）
 * - 仅在浏览器环境生效（Native平台自动管理资源）
 * 
 * @example
 * // 典型使用场景：
 * // 1. 场景切换时自动释放不再使用的预制体
 * // 2. 临时弹窗关闭时立即释放资源
 * // 3. 需要手动控制资源生命周期的动态加载对象
 */
export class YJReleasePrefab extends Component {
    /** 
     * 强制释放开关
     * @property {boolean} force=true
     * @remarks
     * - 开启时跳过引用计数直接释放资源
     * - 关闭时遵循引用计数规则释放
     * @example
     * // 需要立即释放时：
     * @property({ displayName: '强制释放' })
     * force = true;
     * 
     * // 需要安全释放时：
     * force = false;
     */
    @property({ displayName: '强制释放' })
    force: boolean = true;

    /** 缓存的预制体资源UUID */
    private prefabUuid: string;
    /** 组件初始启用状态标识（用于处理运行时状态变更） */
    private aa: boolean = false;

    /**
     * 组件加载时初始化
     * @remarks
     * - 获取节点关联的预制体UUID
     * - 记录组件初始启用状态
     * - 通过节点私有属性_prefab获取原始预制体信息
     */
    onLoad() {
        // 通过节点内部属性获取预制体UUID（需要兼容不同Creator版本）
        this.prefabUuid = this.node['_prefab']?.asset._uuid;
        // 缓存初始状态用于销毁判断（防止运行时被动态禁用）
        this.aa = this.enabled;
    }

    /**
     * 组件销毁时资源释放
     * @remarks
     * 执行条件：
     * - 组件初始为启用状态
     * - 非Native平台（浏览器环境）
     * - 成功获取到预制体UUID
     * 
     * @example
     * // 手动触发释放：
     * node.destroy();
     * 
     * // 条件释放示例：
     * if(needRelease){
     *     getComponent(YJReleasePrefab).enabled = true;
     *     node.destroy();
     * }
     */
    onDestroy() {
        if (this.aa && !JSB) // 仅在浏览器环境且组件初始启用时执行
            no.assetBundleManager.release(this.prefabUuid, this.force);
    }
}
