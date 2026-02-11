
import { ccclass, property, menu, Node, UITransform, Button, EDITOR, BlockInputEvents, Layers, Enum, Size, instantiate, UIOpacity } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';
import { SetGray } from './SetGray';
import { SetEffect } from './SetEffect';
import { nodeUtils } from '../extend/nodeUtils';

/**
 * Predefined variables
 * Name = SetLock
 * DateTime = Thu Mar 24 2022 17:36:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetLock.ts
 * FileBasenameNoExtension = SetLock
 * URL = db://assets/common/base/node/SetLock.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

enum LockType {
    Gray = 0,
    Hide,
    None
}

@ccclass('SetLock')
@menu('NoUi/ui/SetLock(给节点上锁:boolean)')
export class SetLock extends HackUi {
    // ================== 核心配置属性 ==================
    @property({ type: Node })
    target: Node = null;
    /**
     * @example
     * // 设置需要被锁定的目标节点
     * // 如果留空则默认锁定组件所在节点
     */

    @property({ type: Enum(LockType) })
    lockType: LockType = LockType.Hide;
    /**
     * @example
     * // 锁定类型选择：
     * // - Gray: 置灰并添加遮罩
     * // - Hide: 直接隐藏节点
     * // - None: 无效果（仅触发事件）
     */

    @property({ type: Node, visible() { return this.lockType != LockType.Hide; } })
    lockNode: Node = null;
    /**
     * @example
     * // 自定义锁定遮罩节点：
     * // - 当lockType为Gray/Hide时可见
     * // - 如果留空会自动创建透明遮罩
     */

    // ================== 状态控制属性 ==================
    @property
    locked: boolean = true;
    @property({ displayName: '取反' })
    reverse: boolean = false;
    /**
     * @example
     * // 反向控制示例：
     * // reverse=true时，data=true实际会解锁
     * // reverse=false时，data=true会锁定
     */

    @property(no.EventHandlerInfo)
    onLocked: no.EventHandlerInfo[] = [];
    /**
     * @example
     * // 锁定状态回调使用：
     * // 当点击锁定遮罩时触发
     */

    // ================== 私有状态 ==================
    private _lockType: LockType;

    // ================== 生命周期方法 ==================
    start() {
        if (EDITOR) return;
        // 初始化锁定状态
        if (this.dataSetted) return;
        if (this.locked) this.onDataChange(this.locked);
    }

    update() {
        if (!EDITOR) return;
        // 编辑器模式下同步锁定类型变化
        if (this._lockType == this.lockType) return;
        this._lockType = this.lockType;

        // 根据锁定类型动态添加/移除组件
        if (this.lockType == LockType.Gray && !this.getComponent(SetGray)) {
            this.addComponent(SetGray);
        } else if (this.lockType != LockType.Gray) {
            // 清理灰度相关组件
            const a = this.getComponent(SetGray);
            if (a) {
                if (a.recursive) {
                    // 递归移除子节点灰度组件
                    let grays = a.getComponentsInChildren(SetGray);
                    let aa: SetGray;
                    let bb: SetEffect;
                    for (let i = 0, n = grays.length; i < n; i++) {
                        aa = grays[i];
                        bb = aa.getComponent(SetEffect);
                        aa?.destroy();
                        bb?.destroy();
                    }
                }
                a?.destroy();
            }
            this.getComponent(SetEffect)?.destroy();
        }
    }

    // ================== 数据响应方法 ==================
    onDataChange(d: any) {
        if (!this.target) this.target = this.node;
        // 处理数据变化
        this.locked = Boolean(d);
        if (this.reverse) this.locked = !this.locked;
        // 根据锁定状态执行操作
        if (this.locked) this.setLock();
        else this.setUnlock();
    }

    // ================== 公共方法 ==================
    /**
     * 检查锁定状态并触发回调
     * @example
     * // 点击锁定遮罩时调用：
     * // 如果处于锁定状态，执行onLocked回调
     */
    public a_check(): void {
        if (this.locked) {
            no.EventHandlerInfo.execute(this.onLocked);
        }
    }

    // ================== 锁定操作实现 ==================
    /**
     * 执行锁定操作
     * @流程说明
     * 1. 隐藏目标节点（当lockType=Hide时）
     * 2. 创建锁定遮罩节点
     * 3. 设置灰度效果（当lockType=Gray时）
     */
    private setLock() {
        if (this.lockType == LockType.Hide) {
            nodeUtils.visible(this.target, false);
        } else {
            this.createLockNode();
            if (this.lockType == LockType.Gray) {
                this.setGray(true);
            }
        }
    }

    /**
     * 执行解锁操作
     * @流程说明
     * 1. 显示目标节点（当lockType=Hide时）
     * 2. 移除锁定遮罩节点
     * 3. 移除灰度效果（当lockType=Gray时）
     */
    private setUnlock() {
        if (this.lockType == LockType.Hide) {
            nodeUtils.visible(this.target, true);
        } else {
            this.target.getChildByName('_lock_')?.destroy();
            if (this.lockType == LockType.Gray) {
                this.setGray(false);
            }
        }
    }

    // ================== 灰度效果控制 ==================
    /**
     * 设置灰度效果
     * @param v 是否启用灰度
     * @流程说明
     * 1. 显示/隐藏自定义锁节点
     * 2. 动态添加/设置SetGray组件
     */
    private setGray(v: boolean) {
        nodeUtils.visible(this.lockNode, v);
        let a = this.target.getComponent(SetGray) || this.target.addComponent(SetGray);
        a.a_setData(v);
    }

    // ================== 遮罩节点创建 ==================
    /**
     * 创建锁定遮罩节点
     * @流程说明
     * 1. 检查是否已存在遮罩节点
     * 2. 使用自定义模板或创建默认节点
     * 3. 添加按钮事件和阻断交互组件
     * @example
     * // 自定义锁节点示例：
     * // - 需要包含Button组件
     * // - 建议使用半透明背景
     */
    private createLockNode() {
        let target = this.target;
        if (target.getChildByName('_lock_')) return;
        let lock: Node;

        // 使用自定义模板或创建默认节点
        if (this.lockNode) {
            lock = instantiate(this.lockNode);
            lock.name = '_lock_';
            lock.active = true;
        } else {
            // 创建全尺寸透明遮罩
            let nodeUt = target.getComponent(UITransform);
            lock = new Node('_lock_');
            lock.layer = Layers.Enum.UI_2D;
            let ut = lock.addComponent(UITransform);
            ut.setContentSize(nodeUt.getBoundingBox().size);
            ut.setAnchorPoint(nodeUt.anchorPoint);
        }

        // 设置节点属性和事件
        lock.setPosition(0, 0);
        no.addClickEventsToButton(lock.addComponent(Button), target, 'SetLock', 'a_check');
        lock.addComponent(BlockInputEvents);
        lock.parent = target;
    }
}
