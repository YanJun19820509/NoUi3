
import { ccclass, property, menu, executeInEditMode, Node, instantiate, EDITOR, Size, v3, Layout, UIOpacity } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJJobManager } from '../base/YJJobManager';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';

/**
 * Predefined variables
 * Name = SetCreateNode
 * DateTime = Mon Jan 17 2022 10:42:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNode.ts
 * FileBasenameNoExtension = SetCreateNode
 * URL = db://assets/Script/common/ui/SetCreateNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetCreateNode')
@menu('NoUi/ui/SetCreateNode(动态创建节点:object|array)')
@executeInEditMode()
/**
 * 动态创建节点组件
 * 
 * @功能说明
 * - 根据输入数据动态生成节点实例
 * - 支持节点复用机制，通过缓存池管理节点生命周期
 * - 自动绑定数据到子节点的YJDataWork组件
 * - 支持编辑器实时预览
 */
export class SetCreateNode extends HackUi {

    // ================== 核心配置 ==================
    /** 预制体加载组件（优先使用template时可不设置） */
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;

    /** 
     * 元素模板节点（优先使用预制体时可不设置）
     * @example 
     * // 编辑器使用：
     * 1. 预制体方式：拖入预制体资源到loadPrefab属性
     * 2. 场景节点方式：在场景中创建模板节点并拖入此属性
     */
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    /** 
     * 节点生成容器（默认为当前节点）
     * @example 当需要将生成的节点放入ScrollView内容容器时，拖入对应的content节点到此属性
     */
    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    /** 
     * 首次创建优化模式（默认开启）
     * @description - 逐个创建节点可避免一次性大量节点创建造成的卡顿
     * @description - 关闭后将使用批量创建，适用于少量节点快速初始化
     */
    @property({ displayName: '第一次逐个创建', tooltip: '逐个创建能提高性能，如果没有特殊需求，不要取消' })
    isFirst = true;

    // ================== 创建控制 ==================
    /** 是否限制创建数量 */
    @property({ displayName: '仅创建部分' })
    createPart: boolean = false;

    /** 
     * 最大创建数量
     * @example 当数据源有100条时，设置createNum=5将只创建前5个节点
     */
    @property({ displayName: '创建数量', min: 1, step: 1, visible() { return this.createPart; } })
    createNum: number = 1;

    /** 是否保留已存在节点（仅追加新节点） */
    @property({ displayName: '仅新增' })
    onlyAdd: boolean = false;

    // ================== 效果相关 ==================
    /** 
     * 节点创建动画组件
     * @example 可配置淡入、缩放等入场动画效果
     */
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;

    /** 
     * 节点创建完成事件回调
     * @example 可用于：
     * - 播放音效
     * - 更新界面计数
     * - 触发后续流程
     */
    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];

    // ================== 高级配置 ==================
    /** 
     * 单例模式开关
     * @description 适用于需要重复利用的节点（如：动态图集节点）
     * @example 角色头像、公共弹窗等需要重复利用的UI元素
     */
    @property({ tooltip: '针对有YJDynamicAtlas组件的预制体' })
    onlyOne: boolean = false;

    /** 
     * 批量创建数量（动画优化用）
     * @description 当需要播放创建动画时，分批创建可优化性能
     */
    @property({ displayName: '批量创建数量', min: 1, step: 1, tooltip: '当onlyOne为true而且需要播放动效时有效', visible() { return !this.onlyOne && this.uiAnim; } })
    batchNum: number = 1;

    /** 
     * 组件禁用时自动清理
     * @description 适用于需要频繁切换的界面元素
     * @example 战斗场景切换时自动清理UI元素
     */
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    /** 组件启用时自动重建 */
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;

    // ================== 运行时状态 ==================
    protected needSetDynamicAtlas: boolean = true; // 动态图集标记
    private _isSettingData: boolean = false;       // 数据设置锁
    private itemSize: Size;                        // 节点尺寸缓存
    private _1b1: boolean = false;                 // 布局优化标记
    private _items: Node[] = [];                   // 已创建节点集合

    /** 
     * 组件销毁处理
     * @description - 编辑器环境下跳过
     * @description - 运行时销毁模板节点释放内存
     */
    onDestroy() {
        if (EDITOR) {
            return;
        }
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    /** 
     * 组件启用处理
     * @description 当开启recreateOnEnable时，重新初始化数据
     * @example 从其他场景返回时自动重建UI元素
     */
    onEnable() {
        if (EDITOR) {
            return;
        }
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.needSetDynamicAtlas = true;
            this.resetData();
        }
    }

    /**
     * 组件禁用时的处理
     * - 编辑器环境下跳过
     * - 清除定时器和临时数据
     * - 根据配置清理或隐藏节点
     * 
     * @example
     * // 当组件被禁用时：
     * // 1. 如果开启clearOnDisable且不自动重建，则销毁所有子节点
     * // 2. 如果使用UI动画，则隐藏子节点内容
     */
    onDisable() {
        if (EDITOR) return; // 编辑器环境不执行
        if (this._isSettingData) return; // 数据设置中跳过

        // 清理定时器和临时数据
        this.unscheduleAllCallbacks();

        if (this.clearOnDisable) {

            // 销毁所有已创建节点
            for (let i = 0; i < this._items.length; i++) {
                this._items[i].destroy();
            }
            this._items = []; // 重置节点数组
            this.isFirst = true; // 标记需要重新初始化
        } else if (this.uiAnim?.enabled) {
            // UI动画模式下隐藏子节点内容
            for (let i = 0; i < this._items.length; i++) {
                this._items[i].children[0].active = false;
            }
        }
    }

    private _data: any[];
    /**
     * 数据变更处理
     * @param data 输入数据，支持单对象或数组格式
     * 
     * @example
     * // 接收数据示例：
     * // 单个数据 - a_setData({id:1001})
     * // 批量数据 - a_setData([{id:1001}, {id:1002}])
     */
    protected async onDataChange(data: any) {
        // 异步加载预制体模板
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return; // 节点无效时终止
        }

        this._isSettingData = true; // 加数据设置锁

        // 数据标准化处理
        data = [].concat(data); // 统一转为数组
        if (this.createPart) {
            data = (data as any[]).slice(0, this.createNum); // 截取指定数量
        }
        this._data = data;
        this.setItems(); // 执行节点创建/更新
    }

    /**
     * 核心节点创建/更新方法
     * @param data 要展示的数据数组
     * 
     * @实现说明
     * 1. 容器检查：使用指定容器或当前节点
     * 2. 单节点模式：直接设置动态图集节点
     * 3. 节点复用：根据数据长度显示/隐藏已有节点
     * 4. 批量创建：分批次创建新节点避免卡顿
     * 
     * @example
     * // 创建10个带动画的节点：
     * setItems(new Array(10).fill({})); // 使用UI动画+分批创建
     * 
     * // 快速创建100个节点：
     * setItems(new Array(100).fill({})); // 使用JobManager优化性能
     */
    protected setItems(immediate: boolean = false) {
        // 容器初始化检查
        if (!this.container) this.container = this.node;
        if (!this.container) {
            console.error('SetCreateNode: container is null', this.bind_keys);
            return;
        }
        const data = this._data;
        if (!data) return;
        // 单节点特殊处理模式
        if (this.onlyOne) {
            this.setDynamicAtlasNode(data[0]);
            return;
        }

        // 空数据处理
        const n = data.length;
        if (!n) {
            this._items.forEach(item => item.destroy());
            this._items = [];
            return;
        }

        // 节点复用逻辑
        const l = this._items.length;
        if (l === 0) this._1b1 = this.isFirst; // 首次运行标记

        // 非增量模式时隐藏多余节点
        if (!this.onlyAdd && l > n) {
            for (let i = n; i < l; i++) {
                no.visible(this._items[i], false);
            }
        }

        // 批量创建调度逻辑
        const start = !this.onlyAdd ? 0 : l; // 起始索引计算
        let dataIdx = 0; // 数据索引指针

        if (immediate) {
            for (let i = 0; i < n; i++) {
                this.setItem(data, start, dataIdx++, true);
            }
            return;
        }

        if (this.uiAnim?.enabled || this._1b1) {
            // 动画模式/首次创建：分批次定时创建
            this._1b1 = false; // 重置首次标记
            this.schedule(() => {
                for (let j = 0; j < this.batchNum; j++) {
                    this.setItem(data, start, dataIdx++);
                }
            }, 0.1, Math.ceil(n / this.batchNum));
        } else {
            // 普通模式：使用JobManager优化性能
            YJJobManager.ins.addTask(() => {
                this.setItem(data, start, dataIdx++);
                return dataIdx >= n; // 任务完成条件
            });
        }

        this._isSettingData = false; // 释放数据设置锁
    }

    /**
     * 初始化节点容器
     * @param item 需要包装的原始节点
     * @returns 返回包装后的容器节点或原始节点
     * 
     * @功能说明
     * - 当需要动画效果或首次创建时，创建包装容器节点
     * - 复制原始节点的布局属性到容器节点
     * - 保持原始节点的锚点设置
     * 
     * @示例
     * // 创建基础节点
     * const itemNode = instantiate(this.template);
     * // 初始化后获得带布局容器的节点结构：
     * // box (布局容器)
     * // └── itemNode (原始模板节点)
     */
    private initItem(item: Node) {
        // 重置节点位置到原点
        no.position(item, v3(0, 0));

        // 需要动画效果或首次创建时创建包装容器
        if (this.uiAnim?.enabled || this.isFirst) {
            const box = no.newNode('box'); // 创建布局容器节点
            box.addComponent(UIOpacity); // 添加透明度组件用于动画效果

            // 处理布局属性复制
            const layout = item.getComponent(Layout);
            if (!layout) {
                // 无布局组件时直接设置容器尺寸
                if (!this.itemSize) this.itemSize = no.size(item);
                no.size(box, this.itemSize);
            } else {
                // 完整复制布局属性到容器节点
                const bLayout = box.addComponent(Layout);
                // 克隆所有布局属性（保持与原始节点布局一致）
                bLayout.type = layout.type;
                bLayout.resizeMode = layout.resizeMode;
                bLayout.paddingTop = layout.paddingTop;
                bLayout.paddingBottom = layout.paddingBottom;
                bLayout.paddingLeft = layout.paddingLeft;
                bLayout.paddingRight = layout.paddingRight;
                bLayout.spacingX = layout.spacingX;
                bLayout.spacingY = layout.spacingY;
                bLayout.affectedByScale = layout.affectedByScale;
                bLayout.verticalDirection = layout.verticalDirection;
                bLayout.horizontalDirection = layout.horizontalDirection;
                bLayout.constraint = layout.constraint;
            }

            // 保持原始锚点设置
            const a = no.anchor(item);
            no.anchor(box, a.x, a.y);
            box.addChild(item); // 将原始节点挂载到容器
            return box;
        }
        return item;
    }

    /**
     * 设置单个节点数据
     * @param data 数据数组
     * @param childIdxStart 子节点起始索引
     * @param dataIdx 当前数据索引
     * 
     * @功能说明
     * - 处理节点复用/创建逻辑
     * - 绑定数据到YJDataWork组件
     * - 控制节点显隐状态
     * - 触发创建动画效果
     * 
     * @示例
     * // 创建3个节点示例：
     * setItem([data1, data2, data3], 0, 0)
     * setItem([data1, data2, data3], 0, 1)
     * setItem([data1, data2, data3], 0, 2)
     */
    private setItem(data: any[], childIdxStart = 0, dataIdx = 0, immediate: boolean = false) {
        const childIdx = childIdxStart + dataIdx;

        // 数据越界检查
        if (dataIdx >= data.length) {
            no.EventHandlerInfo.execute(this.onComplete); // 执行完成回调
            return;
        }

        let isNew = false;
        let item = this._items[childIdx];

        // 节点不存在时创建新实例
        if (!item) {
            item = this.initItem(instantiate(this.template));
            this.container.addChild(item);
            this._items.push(item);
            isNew = true;
        }

        // 处理空数据节点
        if (data[dataIdx] == null) {
            no.visible(item, false);
            return;
        }

        no.visible(item, true); // 确保节点可见

        // 获取实际内容节点（当有包装容器时）
        if (this.uiAnim?.enabled || this.isFirst) {
            item = item.children[0];
            no.visible(item, true);
        }

        // 数据绑定到YJDataWork组件
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        // 初始化数据绑定
        a?.clear().initWithData(data[dataIdx]);

        if (immediate) return;
        // 处理动画效果
        if (this.uiAnim?.enabled) {
            this.uiAnim.playOtherNode(item); // 播放指定动画
        } else if (this.isFirst && isNew) {
            // 首次创建默认缩放动画
            no.TweenSet.play(no.parseTweenData([
                {
                    set: 1, // 初始状态
                    props: { scale: [0, 0] } // 缩放归零
                }, {
                    duration: .2, // 动画时长
                    to: 1, // 线性插值
                    props: { scale: [1, 1] } // 恢复正常尺寸
                }
            ], item));
        }
    }

    /**
     * 设置动态图集节点
     * @param data 需要绑定的数据，支持对象或数组格式
     * @returns Promise<void>
     * 
     * @功能说明
     * - 动态创建/复用节点实例
     * - 异步加载依赖资源
     * - 绑定数据到YJDataWork组件
     * - 处理UI动画效果
     * 
     * @示例
     * // 创建并初始化动态节点
     * this.setDynamicAtlasNode({ 
     *     texture: 'textures/icon_equip',
     *     frame: 'gold_frame'
     * });
     */
    protected async setDynamicAtlasNode(data: any): Promise<void> {
        if (data == null) return;
        let item = this._items[0];

        // 节点不存在时创建新实例
        if (!item) {
            // 异步加载预制体模板
            if (!this.template) {
                this.template = await this.loadPrefab.loadPrefab();
                if (!this?.node?.isValid) return;
            }

            // 实例化并初始化节点
            item = instantiate(this.template);

            // 加载依赖资源（如图片、纹理等）
            if (item.getComponent(YJLoadAssets))
                await item.getComponent(YJLoadAssets)?.load();
            if (!this?.node?.isValid) return;

            item = this.initItem(item);
            item.parent = this.container;
            no.visible(item, true);
            this._items.push(item);
        }

        // 处理UI动画效果
        if (this.uiAnim?.enabled) {
            this._aniEnd = false;
            item = item.children[0]; // 获取实际内容节点
            this.uiAnim.playOtherNode(item);  // 播放入场动画
            // 如需等待动画完成可取消注释：
            // await no.waitFor(() => { return this._aniEnd; });
        }

        // 数据绑定到YJDataWork组件
        let dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (dataWork) {
            dataWork.initWithData(data);
        }

        // 触发完成回调
        no.EventHandlerInfo.execute(this.onComplete);
        this._isSettingData = false; // 释放数据锁
    }

    /** 动画结束标志位 */
    private _aniEnd = false;

    /**
     * 动画效果完成回调
     * @example
     * // 在UI动画组件中配置回调：
     * // animationEvent: { frame: END, method: 'a_AnimationEffectCallback' }
     */
    public a_AnimationEffectCallback(): void {
        this._aniEnd = true;
    }

    /**
     * 立即更新
     * @description 立即更新数据，不使用动画效果
     */
    public a_immediate() {
        if (!this.enabledInHierarchy) return;
        this.unscheduleAllCallbacks();
        this.setItems(true);
    }

    ///////////////////////////EDITOR METHODS/////////////////
    /**
     * 编辑器加载时初始化
     * @功能说明
     * - 自动获取YJLoadPrefab组件
     * - 设置默认容器为当前节点
     */
    onLoad(): void {
        super.onLoad();
        if (!EDITOR) return;

        // 编辑器环境下自动获取组件引用
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) this.container = this.node; // 默认使用当前节点作为容器
    }
}
