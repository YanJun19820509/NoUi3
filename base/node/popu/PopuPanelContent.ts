import { ccclass, property, Component, Node } from '../../../yj';
import { YJDataWork } from '../../../base/YJDataWork';
import { PopuPanel } from './PopuPanel';
import { YJLoadAssets } from '../../../editor/YJLoadAssets';
import { no } from '../../../no';
import { YJPanelCreated, YJPanelPrefabMetaKey } from '../../../types';

@ccclass('PopuPanelContent')
/**
 * 弹窗内容基类
 * 用于管理弹窗内容的生命周期、数据和事件
 */
export class PopuPanelContent extends Component {
    /** 数据管理器,用于处理UI数据的同步 */
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    /** 是否允许点击空白区域关闭弹窗 */
    @property({ displayName: '点击空白关闭' })
    touchClose: boolean = true;
    /** 是否需要缓存弹窗 */
    @property
    needCache: boolean = false;
    /** 是否需要清理缓存,仅在needCache为true时生效 */
    @property({ visible() { return this.needCache; } })
    needClear: boolean = true;

    /** 弹窗面板实例 */
    private panel: PopuPanel;

    /** 组件加载时调用 */
    onLoad() {
        this.onLoadContent();
    }

    /** 组件启用时调用 */
    onEnable() {
        this.onInitContent();
    }

    /** 组件禁用时调用,清理数据 */
    onDisable() {
        this.dataWork.clear();
    }

    /** 组件销毁时调用,清理面板创建标记 */
    onDestroy() {
        no.setPrototype(this, { [YJPanelCreated]: '0' });
    }

    /**
     * 初始化弹窗内容
     * @param panel 弹窗面板实例
     * @param data 初始化数据
     */
    public init(panel: PopuPanel, data?: any) {
        no.evn.targetOff(this);
        this.panel = panel;
        if (!this.touchClose) panel.touchCloseDisable();
        if (data) {
            this._initData(data);
        }
        this.afterInit();
        no.evn.emit('PopuPanelContent_create', this.node.name, this.getPrefabUrl());
    }

    /**
     * 初始化数据
     * @param data 初始化数据
     */
    private _initData(data?: any) {
        if (!this.dataWork) {
            this.scheduleOnce(() => {
                this._initData(data);
            });
            return;
        }
        this.dataWork.clear().initWithData(data);
        this.afterDataInit();
    }

    /**
     * 初始化界面内容
     * 可在prefab实例化时调用
     */
    public async initContent(panel: PopuPanel, data?: any) {
        if (this.getComponent(YJLoadAssets)) {
            await this.getComponent(YJLoadAssets).load();
        }
        this.init(panel, data);
    }

    /** 关闭弹窗(带动画) */
    public closePanel() {
        this.panel?.closePopuPanel();
    }

    /** 关闭弹窗(无动画) */
    public closePanelNoAni() {
        this.panel?.closePopuPanelNoAni();
    }

    /** 隐藏弹窗 */
    public hide() {
        this.onHide();
        this.panel?.hide();
        no.evn.emit('__popu_panel_close');
    }

    /** 显示弹窗 */
    public show() {
        this.panel?.show();
    }

    private getPrefabUrl() {
        return this['__proto__'][YJPanelPrefabMetaKey];
    }

    /** 弹窗关闭时调用,清理事件监听 */
    public onClose() {
        no.evn.targetOff(this);
        this.dataWork.clear();
        this.unscheduleAllCallbacks();
    }

    //以下方法需要子类实现
    /** 初始化完成后调用,此时data不一定有值 */
    protected afterInit() {

    }
    /** 数据初始化完成后调用,此时data一定有值 */
    protected afterDataInit() {

    }
    /**
     * 初始化预制体内已有的数据节点逻辑
     */
    protected onInitContent() {

    }
    /**
     * 需要动态创建节点的逻辑
     */
    protected onLoadContent() {

    }
    /**
     * 开启动效结束时调用
     */
    public onOpenAniOver() {

    }

    /**
     * 弹窗隐藏时调用
     */
    public onHide() {

    }
}


