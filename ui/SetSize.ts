
import { ccclass, menu, property, Node, Size, size, v3, NodeEventType } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetSize
 * DateTime = Mon Jan 17 2022 14:20:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSize.ts
 * FileBasenameNoExtension = SetSize
 * URL = db://assets/Script/NoUi3/ui/SetSize.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * 设置宽高，支持子节点尺寸超过最大尺寸自动缩小，支持同步子节点尺寸
 */

@ccclass('SetSize')
@menu('NoUi/ui/SetSize(设置宽高:object)')
/**
 * 设置宽高，支持子节点尺寸超过最大尺寸自动缩小，支持同步子节点尺寸
 * 
 * 使用示例：
 * // 设置节点尺寸为300x400
 * this.a_setData({width: 300, height: 400})
 * // 设置节点尺寸为150x250
 * this.a_setData([150, 250])
 */
export class SetSize extends HackUi {
    /**
     * 是否启用最大尺寸检查
     * @规则：
     * - true时当子节点尺寸超过maxSize会自动缩小
     * - false时根据syncSize决定是否同步子节点尺寸
     * @示例 this.checkMaxSize = true // 开启最大尺寸限制
     */
    @property
    checkMaxSize: boolean = false;

    /**
     * 最大尺寸限制（仅在checkMaxSize=true时生效）
     * @规则：
     * - width/height为0表示该方向不限制
     * - 任一方向超过限制会等比例缩放
     * @示例 this.maxSize = size(200, 300) // 最大宽200，最大高300
     */
    @property({ tooltip: '最大尺寸，超过该尺寸会缩小，0表示不限制', visible() { return this.checkMaxSize; } })
    maxSize: Size = size();

    /**
     * 是否同步子节点最大尺寸
     * @规则：
     * - true时自动将父节点尺寸设置为子节点最大尺寸
     * - 与checkMaxSize互斥
     * @示例 this.syncSize = true // 父节点始终匹配最大子节点尺寸
     */
    @property({ tooltip: '是否同步尺寸,为true时父节点动态匹配最大子节点尺寸', visible() { return !this.checkMaxSize; } })
    syncSize: boolean = false;

    onLoad() {
        super.onLoad();
        // 验证maxSize有效性
        if (this.checkMaxSize) {
            this.checkMaxSize = this.maxSize.width > 0 && this.maxSize.height > 0;
        }
        // 需要尺寸监控时注册子节点事件
        if (this.checkMaxSize || this.syncSize) {
            this.node.on(NodeEventType.CHILD_ADDED, this._childAdded, this);
            this.node.on(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
        }
    }

    onDestroy() {
        // 组件销毁时移除事件监听
        if (this.checkMaxSize || this.syncSize) {
            this.node.off(NodeEventType.CHILD_ADDED, this._childAdded, this);
            this.node.off(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
        }
    }

    /**
     * 数据驱动尺寸设置
     * @param data 尺寸数据，支持格式：
     * - {width:100, height:200}
     * - [100,200]
     * @示例 
     * this.a_setData({width: 300, height: 400}) // 设置节点尺寸为300x400
     * this.a_setData([150, 250]) // 设置节点尺寸为150x250
     */
    protected onDataChange(data: any) {
        let a = [];
        // 转换对象数据为数组
        for (let k in data) {
            a.push(data[k]);
        }
        no.size(this.node, size(a[0], a[1]));
    }

    /**
     * 尺寸检查核心方法
     * @功能：
     * 1. 计算所有子节点最大尺寸
     * 2. 根据模式进行缩放或尺寸同步
     * @示例
     * 当子节点尺寸为250x200，maxSize为200x300时：
     * 宽度超过限制，缩放比例为0.8（200/250）
     */
    private checkSize() {
        let width = 0, height = 0;
        // 遍历所有子节点获取最大尺寸
        for (let i = 0, n = this.node.children.length; i < n; i++) {
            const child = this.node.children[i];
            const s = no.size(child);
            width = Math.max(width, s.width);
            height = Math.max(height, s.height);
        }

        // 最大尺寸模式处理
        if (this.checkMaxSize) {
            const wMax = this.maxSize.width,
                hMax = this.maxSize.height;
            let s = 1;
            // 计算需要缩放的比例
            if (width > wMax) {
                s = wMax / width;
            } else if (height > hMax) {
                s = hMax / height
            }
            // 执行缩放
            if (s < 1) {
                no.scale(this.node, v3(s, s, 1));
            }
        }
        // 尺寸同步模式处理
        else if (this.syncSize) {
            no.size(this.node, size(width, height));
        }
    }

    /**
     * 子节点添加事件处理
     * @param child 新增的子节点
     * @示例 当添加新按钮时自动触发尺寸检查
     */
    protected _childAdded(child: Node) {
        child.on(NodeEventType.SIZE_CHANGED, this.checkSize, this);
        this.checkSize();
    }

    /**
     * 子节点移除事件处理
     * @param child 被移除的子节点
     * @示例 当移除大尺寸子节点后自动调整父节点尺寸
     */
    protected _childRemoved(child: Node) {
        child.off(NodeEventType.SIZE_CHANGED, this.checkSize, this);
    }
}
