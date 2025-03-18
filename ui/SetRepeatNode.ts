import { ccclass, property, Node, instantiate, SpriteFrame } from '../../NoUi3/yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * 设置重复节点，如星级展示
 * Author mqsy_yj
 * DateTime Mon Jul 22 2024 17:24:07 GMT+0800 (中国标准时间)
 * data--number | {count:number,max:number,show:string,fill:string} 
 * count--重复数量, max--最大数量，show--重复节点显示图片名, fill-填充节点显示图片名
 */

@ccclass('FillSpriteFrameInfo')
/**
 * 填充用精灵帧信息封装类
 * 功能说明：
 * - 封装精灵帧资源与对应的元数据
 * - 提供编辑器友好的资源选择接口
 * - 自动记录资源UUID和名称用于序列化
 * 
 * @使用示例：
 * // 在属性检查器中：
 * 1. 点击Fill属性旁边的资源选择按钮
 * 2. 选择需要的精灵帧资源
 * 3. 自动记录资源UUID和名称到assetUuid/assetName
 * 
 * // 代码中创建实例：
 * const info = new FillSpriteFrameInfo();
 * info.fill = loadRes('textures/star_full', SpriteFrame);
 */
@ccclass('FillSpriteFrameInfo')
export class FillSpriteFrameInfo {
    /**
     * 填充用精灵帧属性（编辑器可见）
     * @property {SpriteFrame} fill
     * @规则：
     * - 在编辑器中通过资源选择器指定
     * - 设置时会自动记录资源UUID和名称
     * - 获取时始终返回null（实际使用需通过assetUuid加载）
     */
    @property(SpriteFrame)
    public get fill(): SpriteFrame {
        return null; // 实际资源通过assetUuid管理
    }

    public set fill(v: SpriteFrame) {
        if (v) {
            // 记录资源唯一标识符和名称（用于序列化/反序列化）
            this.assetUuid = v.uuid;
            this.assetName = v.name;
        }
    }

    /** 
     * 资源显示名称（编辑器只读） 
     * @example "star_full"
     */
    @property({ readonly: true })
    assetName: string = '';

    /** 
     * 资源唯一标识符（编辑器只读）
     * @example "fcmrqX2XLHJMm8xUZ1acCg"
     */
    @property({ readonly: true })
    assetUuid: string = '';
}

@ccclass('SetRepeatNode')
/**
 * 重复节点生成组件（如星级展示）
 * 功能说明：
 * - 支持数字和对象两种数据格式
 * - 可配置星级样式或普通重复样式
 * - 自动实例化/复用节点并设置显示内容
 * 
 * @使用示例：
 * // 设置7星（当max=5时显示2组：5星+2星）
 * this.a_setData(7);
 * // 通过对象设置显示3/5个填充图标
 * this.a_setData({count:3, max:5, show:'star_full', fill:'star_empty'});
 */
export class SetRepeatNode extends HackUi {
    // 模板节点引用（用于实例化新节点）
    @property(Node)
    tempNode: Node = null;
    // 是否启用星级样式（支持多组图标循环）
    @property({ displayName: '类似星级样式' })
    starLike: boolean = false;
    // 单组最大显示数量（仅在星级样式启用时生效）
    @property({ displayName: '最多显示数量', visible() { return this.starLike; } })
    max: number = 5;
    // 显示用图片配置数组（按组存储）
    @property({ type: FillSpriteFrameInfo, displayName: ' 显示图片', visible() { return this.starLike; } })
    show: FillSpriteFrameInfo[] = [];
    // 填充用图片配置数组（按组存储）
    @property({ type: FillSpriteFrameInfo, displayName: '填充图片', visible() { return this.starLike; } })
    fill: FillSpriteFrameInfo[] = [];

    /**
     * 数据变化处理入口
     * @param data 支持格式：
     * - number: 总数量（自动计算组别）
     * - object: {count:显示数量, max:最大数量, show:显示图片名, fill:填充图片名}
     */
    protected onDataChange(data: any) {
        if (typeof data === 'number') {
            this.setWithNumber(data);
        } else if (typeof data === 'object') {
            this.setWithObject(data);
        }
    }

    /**
     * 数字模式处理
     * @param star 总星数
     * @实现逻辑：
     * 1. 计算当前组显示数量：超过max则显示余数（如7星max5→第二组显示2）
     * 2. 计算组别索引：star/(max+1)取整
     * 3. 获取对应组别的显示/填充图片
     * 4. 调用对象模式设置
     * @示例：
     * setWithNumber(7) → count=2, idx=1（当max=5时）
     */
    private setWithNumber(star: number) {
        // 计算当前组应显示的数量（不超过max）
        const count = star <= this.max ? star : (star - this.max);
        // 计算当前应使用的图标组索引
        const idx = Math.floor(star / (this.max + 1));
        // 获取对应组的显示/填充图片名称
        const show = this.show[idx]?.assetName || '';
        const fill = this.fill[idx]?.assetName || 'null';
        this.setWithObject({ count, max: this.max, show, fill });
    }

    /**
     * 对象模式处理
     * @param data 配置对象
     * @实现流程：
     * 1. 校验模板节点是否存在
     * 2. 循环创建/复用节点：
     *    - 已有节点直接使用
     *    - 无节点时实例化新节点
     * 3. 根据序号设置显示内容：
     *    - 小于count显示主图
     *    - 大于等于count显示填充图
     */
    private setWithObject(data: { count: number, max: number, show: string, fill: string }) {
        const { count, max, show, fill } = data;
        if (!this.tempNode) {
            no.err('YJRepeatBox tempNode is null!');
            return;
        }

        // 使用传统for循环处理节点（避免使用for...of）
        for (let i = 0; i < max; i++) {
            // 尝试复用已有节点
            let item = this.node.children[i];
            
            // 需要时创建新节点
            if (!item) {
                item = instantiate(this.tempNode);
                if (item) {
                    item.parent = this.node; // 设置父节点
                    item.active = true;      // 激活节点
                }
            }

            // 设置节点显示内容（使用SetSpriteFrameInSampler2D组件）
            const comp = item.getComponent('SetSpriteFrameInSampler2D');
            const useShow = i < count; // 判断是否使用显示图
            comp['setData'](JSON.stringify(useShow ? show : fill));
        }
    }
}
