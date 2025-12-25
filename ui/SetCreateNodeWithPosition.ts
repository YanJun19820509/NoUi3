
import { ccclass, property, executeInEditMode, EDITOR, Node, math, UITransform, instantiate, Vec3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetCreateNodeWithPosition
 * DateTime = Sat Nov 19 2022 17:28:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeWithPosition.ts
 * FileBasenameNoExtension = SetCreateNodeWithPosition
 * URL = db://assets/common/ui/SetCreateNodeWithPosition.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('PositionInfo')
export class PositionInfo {
    @property(Vec3)
    positions: Vec3[] = [];
}

@ccclass('SetCreateNodeWithPosition')
@executeInEditMode()
/**
 * 根据预设位置创建并排列节点的组件
 * @特点 
 * - 支持多种预设位置配置
 * - 提供编辑器预览功能
 * - 支持动态数据绑定
 * 
 * @示例 创建3个商品项并定位到预设位置：
 * // 数据格式
 * const items = [
 *   { name: '剑', price: 100 },
 *   { name: '盾', price: 200 },
 *   { name: '药水', price: 50 }
 * ];
 * 
 * // 调用方式
 * this.onDataChange(items);
 */
export class SetCreateNodeWithPosition extends HackUi {
    // 预制体加载组件，用于动态加载节点模板
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;

    // 实际使用的节点模板（预制体加载完成后自动赋值）
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    // 是否在禁用组件时清除所有子节点
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    // 是否在启用组件时重新创建子节点（需clearOnDisable为true时生效）
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;

    // 容器节点，用于存放生成的子节点
    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    // 预设位置配置集合（不同数量对应不同布局）
    @property({ type: PositionInfo })
    positionTypes: PositionInfo[] = [];

    // 编辑器专用属性：保存当前子节点位置到positionTypes
    @property({ editorOnly: true })
    saveCurrentPositions: boolean = false;

    // 编辑器专用属性：预览指定数量的位置布局
    @property({ editorOnly: true })
    previewNum: number = 0;

    // 编辑器专用属性：触发位置预览创建
    @property({ editorOnly: true })
    previewCreate: boolean = false;

    // 所有节点创建完成后的事件回调
    @property({ type: no.EventHandlerInfo })
    afterCreated: no.EventHandlerInfo[] = [];

    // 数据设置锁，防止重复设置
    protected _isSettingData: boolean = false;

    /**
     * 编辑器更新循环
     * @功能 处理位置保存和预览功能
     * @示例 在编辑器中：
     * 1. 排列好3个子节点后勾选saveCurrentPositions保存位置
     * 2. 设置previewNum=3并勾选previewCreate查看布局效果
     */
    update() {
        if (EDITOR) {
            // 保存当前子节点位置到配置
            if (this.saveCurrentPositions) {
                this.saveCurrentPositions = false;
                let pos: Vec3[] = [];
                // 使用传统for循环遍历子节点
                let child: Node;
                for (let i = 0, n = this.node.children.length; i < n; i++) {
                    child = this.node.children[i];
                    pos[pos.length] = child.position.clone();
                }

                // 更新或添加位置配置
                let setted = false;
                let info: PositionInfo;
                for (let i = 0, n = this.positionTypes.length; i < n; i++) {
                    info = this.positionTypes[i];
                    if (info.positions.length == pos.length) {
                        setted = true;
                        info.positions = pos;
                        break;
                    }
                }
                if (!setted) {
                    info = new PositionInfo();
                    info.positions = pos;
                    this.positionTypes[this.positionTypes.length] = info;
                }
            }

            // 预览位置布局
            if (this.previewCreate) {
                this.previewCreate = false;
                let posinfo = this.getPositions(this.previewNum);
                if (!posinfo) return;
                let size = this.template?.getComponent(UITransform).contentSize.clone() || math.size(100, 100);
                let node: Node;
                for (let i = 0, n = posinfo.positions.length; i < n; i++) {
                    node = new Node();
                    node.addComponent(UITransform).setContentSize(size);
                    node.setPosition(posinfo.positions[i]);
                    node.parent = this.container;
                }
            }
        }
    }

    /**
     * 组件销毁时处理
     * @重要操作 清理模板节点防止内存泄漏
     */
    onDestroy() {
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    /**
     * 组件启用时回调
     * @功能 根据配置重新创建节点
     */
    onEnable() {
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.resetData();
        }
    }

    /**
     * 组件禁用时回调
     * @功能 1.清空数据 2.根据配置清除子节点
     */
    onDisable() {
        if (this._isSettingData) return;
        this.unscheduleAllCallbacks();
        if (this.clearOnDisable) {
            for (let i = 0; i < this.container?.children.length; i++) {
                this.container.children[i].destroy();
            }
        }
    }

    /**
     * 数据变更处理
     * @param data 新数据数组
     * @流程 
     * 1. 加载预制体模板
     * 2. 创建/更新子节点
     * 3. 设置节点位置和数据
     * 
     * @示例 更新商品数据：
     * const newItems = [
     *   { name: '高级剑', price: 200 },
     *   { name: '魔法盾', price: 300 }
     * ];
     * this.onDataChange(newItems);
     */
    protected async onDataChange(data: any) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
        }
        this._isSettingData = true;

        this.setItems([].concat(data));
    }

    /**
     * 创建/更新子节点
     * @param data 数据数组
     * @流程
     * 1. 隐藏多余节点
     * 2. 创建缺失节点
     * 3. 设置所有节点位置和数据
     * 
     * @示例 创建5个敌人并定位：
     * const enemies = [{type: 'orc'}, {type: 'goblin'}, ...];
     * this.setItems(enemies);
     */
    protected setItems(data: any[]) {
        if (!this.container) this.container = this.node;

        let n = data.length;
        let l = this.container.children.length;

        // 隐藏多余节点
        for (let i = 0; i < l; i++) {
            no.visible(this.container.children[i], !!data[i]);
        }

        let positionInfo = this.getPositions(n);

        let item: Node;
        // 创建缺失节点
        if (n > l) {
            let max = n;
            while (max > 0) {
                item = instantiate(this.template);
                item.setPosition(positionInfo.positions[this.container.children.length]);
                item.parent = this.container;
                max--;
            }
        } else if (n - l == 1) {
            item = instantiate(this.template);
            item.setPosition(positionInfo.positions[this.container.children.length]);
            item.parent = this.container;
        }

        // 初始化所有节点
        for (let i = 0; i < n; i++) {
            this.setItem(data, 0, i);
        }

        this._isSettingData = false;
        no.EventHandlerInfo.execute(this.afterCreated);
    }

    /**
     * 初始化单个节点
     * @param data 数据数组
     * @param start 起始索引
     * @param i 当前索引
     * @示例 自定义节点初始化：
     * setItem(data, start, i) {
     *   super.setItem(data, start, i);
     *   const node = this.container.children[start + i];
     *   node.getComponent(Enemy).init(data[i]);
     * }
     */
    protected setItem(data: any[], start: number, i: number) {
        if (data[i] == null) {
            return;
        }
        let item = this.container.children[start + i];
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        a?.clear().initWithData(data[i]);
        no.visible(item, true);
    }

    /**
     * 获取指定数量的位置配置
     * @param len 需要的位置数量
     * @returns 匹配的位置配置信息
     */
    private getPositions(len: number): PositionInfo {
        let info: PositionInfo;
        for (let i = 0, n = this.positionTypes.length; i < n; i++) {
            info = this.positionTypes[i];
            if (info.positions.length == len) return info;
        }
        return null;
    }

    ///////////////////////////EDITOR///////////////
    /**
     * 编辑器加载回调
     * @功能 初始化编辑器所需组件
     */
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) this.container = this.node;
    }
}
