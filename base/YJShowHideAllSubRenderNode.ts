
import { ccclass, property, Component, Layers, Node, sys, disallowMultiple, ResolutionPolicy } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJShowHideAllSubRenderNode
 * DateTime = Sun Apr 23 2023 14:23:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowHideAllSubRenderNode.ts
 * FileBasenameNoExtension = YJShowHideAllSubRenderNode
 * URL = db://assets/common/base/YJShowHideAllSubRenderNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 子节点显隐控制组件
 * @description 提供以下功能：
 * 1. 通过事件控制所有子渲染节点的显隐状态
 * 2. 支持全屏面板事件自动处理（需开启catchFullScreenPanelEvent）
 * 3. 适配不同屏幕分辨率策略下的显隐逻辑
 * 
 * @example
 * // 编辑器使用：
 * // 1. 添加本组件到父节点
 * // 2. 配置事件名称（默认_show/hide_sub_render_node）
 * // 3. 根据需求勾选catchFullScreenPanelEvent
 * 
 * @example
 * // 代码调用示例：
 * // 触发显示事件
 * no.evn.emit('_show_sub_render_node', 'panel1');
 * // 直接控制显隐
 * node.getComponent(YJShowHideAllSubRenderNode).showSubRenderNode();
 */
@ccclass('YJShowHideAllSubRenderNode')
@disallowMultiple() // 单例组件，同一节点只允许存在一个实例
export class YJShowHideAllSubRenderNode extends Component {
    /** 显示子节点事件名称（只读） */
    @property({ readonly: true })
    showSubRenderNodeEvent: string = '_show_sub_render_node';
    /** 隐藏子节点事件名称（只读） */
    @property({ readonly: true })
    hideSubRenderNodeEvent: string = '_hide_sub_render_node';
    /** 是否捕获全屏面板事件（自动处理弹窗遮挡时的显隐逻辑） */
    @property
    catchFullScreenPanelEvent: boolean = false;

    private isShow: boolean = true; // 当前显隐状态
    private _fullPanels: string[] = []; // 全屏面板追踪列表

    /**
     * 组件加载时初始化事件监听
     * @description 注册显隐事件监听器，根据配置决定是否监听全屏面板事件
     */
    protected onLoad(): void {
        if (this.enabled) {
            no.evn.on(this.showSubRenderNodeEvent, this.onShow, this);
            no.evn.on(this.hideSubRenderNodeEvent, this.onHide, this);
            if (this.catchFullScreenPanelEvent) {
                no.evn.on('_full_screen_panel_open', this.onHide, this);
                no.evn.on('_full_screen_panel_close', this.onShow, this);
            }
        }
    }

    /** 组件销毁时清理事件监听和定时器 */
    protected onDestroy(): void {
        no.evn.targetOff(this);
        no.unschedule(this);
    }

    /**
     * 显示事件处理
     * @param type 事件来源标识（用于过滤自身触发事件）
     */
    private onShow(type: string) {
        if (this.node.name == type) return;
        no.removeFromArray(this._fullPanels, type);
        if (!this._fullPanels.length) {
            this.showSubRenderNode();
        }
    }

    /**
     * 隐藏事件处理
     * @param type 事件来源标识（用于过滤自身触发事件）
     */
    private onHide(type: string) {
        if (this.node.name == type) return;
        no.addToArray(this._fullPanels, type);
        this.showSubRenderNode();
    }

    /**
     * 更新子节点显隐状态
     * @description 根据全屏面板状态自动切换显隐，避免重复操作
     */
    public showSubRenderNode() {
        let v: boolean = !this._fullPanels.length;
        if (v == this.isShow) return;
        this.isShow = v;
        this.changeLayer(this.node, v);
    }

    /**
     * 实际执行显隐操作
     * @param node 目标节点
     * @param v 是否显示
     * @description 处理特殊分辨率策略下的显隐逻辑（FIXED_HEIGHT模式强制隐藏）
     */
    private changeLayer(node: Node, v: boolean) {
        no.visibleByOpacity(node, v);
    }
}
