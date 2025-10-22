import { YJHintWatcher } from "../../base/YJHintWatcher";
import { YJToggleGroupManager } from "../../base/node/YJToggleGroupManager";
import { HackUi } from "../../ui/HackUi";
import { no } from "../../no";
import { Component, ccclass, property, Node, instantiate, Label, requireComponent, Toggle } from "../../yj";
import { YJCharLabel } from "../charLabel/YJCharLabel";

//菜单构建器

@ccclass('YJMenuItemInfo')
export class YJMenuItemInfo {
    @property
    title: string = '';
    @property({ displayName: '红点key', tooltip: '多个key用逗号分隔' })
    redHintKeys: string = '';
    @property
    DEBUG: boolean = false;
}

@ccclass('YJMenu')
@requireComponent(YJToggleGroupManager)
/**
 * 动态菜单组件
 * @example
 * // 编辑器配置示例：
 * // 1. 拖入菜单项模板预制体到itemTemp属性
 * // 2. 指定容器节点到container属性（不指定则使用当前节点）
 * // 3. 配置菜单项数组，设置每个项的标题、红点提示等
 * 
 * // 代码调用示例：
 * // 获取菜单组件引用
 * const menu = this.node.getComponent(YJMenu);
 * // 手动创建自定义菜单项
 * menu.createMenu([
 *     {title:'新消息', redHintKeys:'mail,chat', DEBUG:false},
 *     {title:'设置', redHintKeys:'', DEBUG:false}
 * ], true);
 */
export class YJMenu extends Component {
    /** 菜单项配置数组（每个元素对应一个菜单项） */
    @property({ type: YJMenuItemInfo })
    menuItems: YJMenuItemInfo[] = []

    /** 菜单项模板预制体（需要包含Label/YJCharLabel和YJHintWatcher组件） */
    @property({ type: Node, displayName: '菜单子项模板' })
    itemTemp: Node = null;

    /** 菜单项容器节点（不指定则使用当前节点） */
    @property({ type: Node })
    container: Node = null;

    /** 是否在组件启用时自动创建菜单 */
    @property
    autoCreate: boolean = true;

    /** 是否在组件禁用时清空菜单项（用于动态菜单场景） */
    @property
    clearOnDisable: boolean = true;

    /** 组件启用时回调，自动创建菜单 */
    onEnable() {
        this.autoCreate && this.createMenu(this.menuItems, false);
    }

    /** 组件禁用时回调，清空菜单项 */
    onDisable() {
        if (this.clearOnDisable)
            this.container.removeAllChildren();
    }

    /**
     * 创建并渲染菜单项
     * @param menuItems 菜单项配置数组
     * @param force 是否强制重新创建（true时会清空已有菜单项）
     * @description 创建流程：
     * 1. 遍历配置数组，跳过DEBUG项（非开发环境）
     * 2. 实例化模板节点
     * 3. 设置菜单项标题（支持Label/YJCharLabel组件）
     * 4. 绑定红点提示（通过YJHintWatcher组件）
     * 5. 将生成的菜单项添加到容器
     */
    public createMenu(menuItems: YJMenuItemInfo[], force = true) {
        if (!menuItems || menuItems.length == 0) return;
        this.container = this.container || this.node;
        if (!force && this.container.children.length > 0) return;
        this.container.removeAllChildren();

        let info: YJMenuItemInfo;
        let item: Node;
        let list: any[];
        let a: any;
        for (let i = 0; i < menuItems.length; i++) {
            info = menuItems[i];
            // 过滤调试专用菜单项
            if (!no.isDebug() && info.DEBUG) continue;

            // 实例化菜单项
            item = instantiate(this.itemTemp);

            // 设置菜单项标题
            if (info.title) {
                // 查找所有文本组件（优先Label组件）
                list = item.getComponentsInChildren(Label);
                if (list.length == 0) {
                    list = item.getComponentsInChildren(YJCharLabel);
                }
                // 更新所有找到的文本组件
                for (let j = 0; j < list.length; j++) {
                    a = list[j];
                    a.getComponent(HackUi)?.a_setData(info.title);
                }
            }

            // 绑定红点提示
            if (info.redHintKeys) {
                item.getComponentInChildren(YJHintWatcher)?.setHintTypes(info.redHintKeys);
            }

            // 激活并挂载节点
            item.active = true;
            item.parent = this.container || this.node;
        }
    }
}
