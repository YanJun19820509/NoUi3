
import { ccclass, property, executeInEditMode, EDITOR, Node, math, UITransform, instantiate, Vec3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { HackUi } from './HackUi';
import { PositionInfo, SetCreateNodeWithPosition } from './SetCreateNodeWithPosition';

/**
 * Predefined variables
 * Name = SetCreateNodeWithPositionByType
 * DateTime = Sat Nov 19 2022 17:28:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeWithPositionByType.ts
 * FileBasenameNoExtension = SetCreateNodeWithPositionByType
 * URL = db://assets/common/ui/SetCreateNodeWithPositionByType.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateNodeWithPositionByType')
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
export class SetCreateNodeWithPositionByType extends SetCreateNodeWithPosition {

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
                    if (info.positions.length == 0) {
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
                let posinfo = this.positionTypes[this.previewNum];
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
    protected async onDataChange(data: any) {
        if (!data) return;
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
        }
        this._isSettingData = true;
        const { list, type } = data;
        this.setItemsWithType(list, type);
    }

    protected setItemsWithType(data: any[], index: number) {
        if (!this.container) this.container = this.node;

        let n = data.length;
        let l = this.container.children.length;

        // 隐藏多余节点
        for (let i = 0; i < l; i++) {
            no.visible(this.container.children[i], !!data[i]);
        }

        let positionInfo = this.positionTypes[index];
        if (!positionInfo) {
            console.error('Invalid position type index:', index);
            return;
        }
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
}
