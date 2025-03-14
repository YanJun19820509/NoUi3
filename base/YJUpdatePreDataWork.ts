import { ccclass, Component, EDITOR, executeInEditMode, property } from "NoUi3/yj";
import { YJDataWork } from "./YJDataWork";
import { no } from "NoUi3/no";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Sep 23 2024 14:57:36 GMT+0800 (中国标准时间)
 * 向上更新主dataWork的数据
 */

@ccclass('YJUpdatePreDataWork')
@executeInEditMode()
export class YJUpdatePreDataWork extends Component {
    /** 关联的YJDataWork组件，用于数据更新操作 */
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    
    /**
     * 数据绑定路径配置
     * @property 
     * @example 
     * - 更新单个字段: "position"
     * - 更新数组元素: "items.0" 或 "items.id"（通过id查找数组元素）
     * - 批量更新多个字段: "hp,items.0,equipment.weapon"
     */
    @property({ displayName: '绑定数据的keys', tooltip: '用.表示key的层级关系；如果上层数据是数组，那么.后为下标或能找唯一子项的key；仅支持两层。用,分隔多个key' })
    bind_keys: string = '';

    onLoad() {
        // 编辑器模式下自动查找父节点上的YJDataWork组件
        if (EDITOR) {
            if (!this.dataWork) this.dataWork = no.getComponentInParents(this.node.parent, YJDataWork);
        }
    }

    /**
     * 数据更新方法
     * @param d 要更新的数据对象
     * @example
     * // 更新用户位置信息
     * updateData({x:100, y:200}); // bind_keys配置为"position"
     * 
     * // 更新背包第一个物品
     * updateData({id:1, count:5}); // bind_keys配置为"bagItems.0"
     * 
     * // 批量更新角色属性和装备
     * updateData({atk:50, weapon:'sword'}); // bind_keys配置为"roleStatus,equipment.weapon"
     */
    public updateData(d: any) {
        const keys = this.bind_keys.split(',');
        for (let i = 0, n = keys.length; i < n; i++) {
            const ks = keys[i].split('.');
            if (ks.length == 1) {
                // 直接更新一级属性
                this.dataWork.changeValueByUi(ks[0], d);
            } else {
                // 处理嵌套属性（支持数组）
                const data = this.dataWork.getValue(ks[0]);
                if (Array.isArray(data)) {
                    // 解析数组索引（支持数字下标或通过key查找）
                    let index = parseInt(ks[1]);
                    if (isNaN(index)) {
                        index = no.indexOfArray(data, d[ks[1]], ks[1]);
                    }
                    // 更新数组元素
                    data[index] = d;
                }
                // 提交修改后的数据
                this.dataWork.changeValueByUi(ks[0], data);
            }
        }
    }
}