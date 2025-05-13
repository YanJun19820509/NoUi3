
import { ccclass, property, menu, instantiate, Vec3 } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetPathWithNodePointByUrl
 * DateTime = Sat Apr 16 2022 00:56:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPathWithNodePointByUrl.ts
 * FileBasenameNoExtension = SetPathWithNodePointByUrl
 * URL = db://assets/Script/common/ui/SetPathWithNodePointByUrl.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用节点来设计路径，当 路径prefab加载完成后，调用代理返回路径数据
 */
@ccclass('SetPathWithNodePointByUrl')
@menu('NoUi/ui/SetPathWithNodePointByUrl(设置prefab路径:string)')
/**
 * 路径预制件解析组件
 * @功能说明 
 * - 通过预制件中的子节点位置自动生成路径点数组
 * - 支持自动释放加载的预制件资源
 * @使用示例
 * // 加载预制件并获取路径数据
 * this.node.emit('data', 'path/prefab_url');
 * // 事件回调接收路径数据示例：
 * // onParsed: [{"component":"PathFollower","handler":"setPath","customEventData":"data"}]
 */
export class SetPathWithNodePointByUrl extends HackUi {
    /**
     * 路径解析完成事件回调
     * @property {no.EventHandlerInfo} onParsed
     * @example [{"target":组件节点,"component":"组件名称","handler":"回调方法名"}] 
     */
    @property(no.EventHandlerInfo)
    onParsed: no.EventHandlerInfo = new no.EventHandlerInfo();

    /**
     * 是否自动释放预制件资源
     * @rule 启用后将在完成加载后立即释放资源
     * @default true
     */
    @property
    autoRelease: boolean = true;

    /**
     * 数据变化处理入口
     * @param data 预制件路径字符串
     * @实现流程:
     * 1. 异步加载预制件资源
     * 2. 实例化预制件获取节点引用
     * 3. 遍历所有子节点获取世界坐标
     * 4. 触发解析完成事件回调
     * 5. 根据配置决定是否释放资源
     */
    protected onDataChange(data: any) {
        // 异步加载预制件资源
        no.assetBundleManager.loadPrefab(data, item => {
            // 实例化预制件节点
            let n = instantiate(item);
            // 初始化路径数组
            let path: Vec3[] = [];
            
            // 使用传统for循环遍历子节点（兼容性更好）
            // 遍历预制件所有子节点获取位置信息
            for (let i = 0; i < n.children.length; i++) {
                // 克隆节点位置避免引用问题
                const pos = n.children[i].position.clone();
                // 按顺序存入路径数组
                path[path.length] = pos;
            }
            
            // 执行解析完成回调并传递路径数据
            this.onParsed.execute(path);
            
            // 自动释放资源（内存管理最佳实践）
            this.autoRelease && no.assetBundleManager.release(item);
        });
    }
}
