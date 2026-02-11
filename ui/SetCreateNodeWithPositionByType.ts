import { ccclass, executeInEditMode, Node, instantiate } from '../yj';
import { no } from '../no';
import { SetCreateNodeWithPosition } from './SetCreateNodeWithPosition';
import { nodeUtils } from '../extend/nodeUtils';

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
            nodeUtils.visible(this.container.children[i], !!data[i]);
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
