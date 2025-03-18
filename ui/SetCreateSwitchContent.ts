
import { ccclass, property, executeInEditMode, EDITOR, Node, isValid } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetCreateSwitchContent
 * DateTime = Tue Jul 19 2022 14:52:24 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateSwitchContent.ts
 * FileBasenameNoExtension = SetCreateSwitchContent
 * URL = db://assets/NoUi3/ui/SetCreateSwitchContent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('ContentInfo')
/**
 * 内容配置信息类，用于管理预制件的加载和显示
 * @example
 * // 创建配置
 * const config = new ContentInfo();
 * config.name = 'main_menu';
 * config.prefab = this.mainMenuPrefab;
 * 
 * // 使用配置加载内容
 * await config.loadTo(this.container);
 */
class ContentInfo {
    /** 内容标识名称（用于逻辑查找） */
    @property
    name: string = '';

    /** 预制件加载组件（负责预制件的加载管理） */
    @property(YJLoadPrefab)
    prefab: YJLoadPrefab = null;

    /** 已加载的节点实例缓存 */
    private loadedNode: Node;

    /**
     * 异步加载预制件到指定父节点
     * @param parent - 父节点容器
     * @example
     * // 在容器节点中加载内容
     * await content.loadTo(this.node);
     */
    public async loadTo(parent: Node) {
        // 异步加载预制件并缓存实例
        this.loadedNode = await this.prefab.loadPrefab();

        // 父节点有效性检查
        if (!no.checkValid(parent)) return;

        // 加载附加资源（如果有YJLoadAssets组件）
        const assetsLoader = this.loadedNode.getComponent(YJLoadAssets);
        if (assetsLoader) await assetsLoader.load();

        // 设置父节点关系
        this.loadedNode.parent = parent;
    }

    /**
     * 控制内容显示/隐藏（使用透明度+位置偏移双重控制）
     * @param v - 是否显示
     * @example
     * // 显示内容
     * content.show(true);
     * 
     * // 隐藏内容
     * content.show(false);
     */
    public show(v: boolean): void {
        if (this.loadedNode) {
            if (!isValid(this.loadedNode)) return;

            // // 缓存原始X坐标（首次隐藏时记录）
            // if (this.loadedNode['__origin_x__'] == null) {
            //     this.loadedNode['__origin_x__'] = no.x(this.loadedNode);
            // }

            // // 使用透明度控制可见性，位置偏移确保完全隐藏
            // no.visibleByOpacity(this.loadedNode, v);
            // no.x(this.loadedNode, !v ? 20000 : this.loadedNode['__origin_x__']);
            no.visibleByActiveInHierarchy(this.loadedNode, v);
        }
    }

    /** 获取是否已加载节点 */
    public get isLoaded(): boolean {
        return !!this.loadedNode;
    }

    /**
     * 清理已加载的内容
     * @example
     * // 重置内容状态
     * content.clear();
     */
    public clear() {
        this.prefab.clear();
        this.loadedNode = null;
    }
}

/**
 * 创建多个可切换显示的内容节点控制器
 * @example
 * // 在编辑器中使用：
 * 1. 配置contents数组中的prefab和名称
 * 2. 通过设置data属性切换显示内容（支持字符串名称或数字索引）
 * 
 * // 在代码中使用：
 * node.getComponent(SetCreateSwitchContent).a_showByName('main');
 */
@ccclass('SetCreateSwitchContent')
@executeInEditMode()
export class SetCreateSwitchContent extends HackUi {
    /** 内容配置数组，每个元素包含名称和对应的预制体 */
    @property(ContentInfo)
    contents: ContentInfo[] = [];

    /** 内容节点的父容器，默认为当前节点 */
    @property(Node)
    container: Node = null;

    /** 是否禁用缓存（非当前内容立即清除） */
    @property
    noCache: boolean = false;

    /** 当组件被禁用时是否清空所有子节点 */
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    onLoad() {
        if (EDITOR) {
            // 编辑器模式下自动设置父容器
            if (!this.container)
                this.container = this.node;
        } else {
            // 运行时调用父类逻辑
            super.onLoad();
        }
    }

    onDisable() {
        if (EDITOR) return;

        // 清理所有定时回调
        this.unscheduleAllCallbacks();

        // 需要时执行清理操作
        if (this.clearOnDisable) {
            // 清理所有内容实例
            for (let i = 0; i < this.contents?.length; i++) {
                this.contents[i].clear();
            }
            // 销毁容器所有子节点
            this.container.destroyAllChildren();
        }
    }

    /**
     * 数据变化回调函数
     * @param data 支持两种类型：
     * - string: 按名称显示内容
     * - number: 按索引显示内容
     * @example
     * // 通过数据驱动切换显示
     * this.node.data = 'settings'; // 按名称切换
     * this.node.data = 1;         // 按索引切换
     */
    protected onDataChange(data: any) {
        if (typeof data == 'string') this.a_showByName(data);
        else if (typeof data == 'number') this.a_showByIndex(data);
    }

    /**
     * 显示指定内容（异步加载）
     * @param info 要显示的内容信息
     */
    private async showContent(info: ContentInfo) {
        if (!info) return;

        // 异步加载预制体
        if (!info.isLoaded) {
            await info.loadTo(this.container);
            if (!this?.node?.isValid) return; // 组件可能已被销毁
        }

        // 延迟一帧后隐藏其他内容（确保布局完成）
        this.scheduleOnce(() => {
            this.hideContent(info.name);
        });
    }

    /**
     * 隐藏非指定名称的内容
     * @param exceptName 需要保留显示的内容名称
     */
    private hideContent(exceptName: string) {
        // 遍历所有内容配置
        for (let i = 0; i < this.contents?.length; i++) {
            const info = this.contents[i];
            if (this.noCache && info.name != exceptName) {
                // 非缓存模式直接清除实例
                info.clear();
            } else {
                // 常规模式只控制显隐
                info.show(info.name == exceptName);
            }
        }
    }

    /**
     * 通过名称显示内容
     * @param name 配置中的内容名称
     * @example
     * // 在按钮点击事件中调用：
     * onClick() {
     *   this.node.getComponent(SetCreateSwitchContent).a_showByName('main');
     * }
     */
    public a_showByName(name: string) {
        let i = no.indexOfArray(this.contents, name, 'name');
        if (i == -1) return;
        this.a_showByIndex(i);
    }

    /**
     * 通过索引显示内容
     * @param i 内容数组的索引位置
     * @example
     * // 切换显示第一个内容
     * component.a_showByIndex(0);
     */
    public a_showByIndex(i: number) {
        this.showContent(this.contents[Number(i)]);
    }
}
