
import { ccclass, property, menu, requireComponent, executeInEditMode, EDITOR, UIRenderer, Sprite } from '../yj';
import { HackUi } from './HackUi';
import { SetEffect } from './SetEffect';

/**
 * 半透遮罩组件
 * @功能说明
 * - 通过材质或灰度处理实现UI元素的遮罩效果
 * - 支持递归影响子节点
 * - 提供编辑器环境下的自动配置功能
 * 
 * @使用示例
 * // 通过数据驱动设置遮罩状态
 * a_setData(true); // 启用遮罩
 * a_setData(false); // 关闭遮罩
 * 
 * // 编辑器配置示例：
 * {
 *   autoGray: true,  // 默认自动置灰
 *   reverse: false,  // 不取反数据
 *   recursive: true, // 影响所有子节点
 *   autoSetChildren: true // 自动为子节点添加组件
 * }
 */
@ccclass('SetAlphaMask')
@menu('NoUi/ui/SetAlphaMask(设置半透遮罩:bool)')
@requireComponent(SetEffect)
@executeInEditMode()
export class SetAlphaMask extends HackUi {
    // ======================== 编辑器属性配置 ========================
    /** 是否在加载时自动置灰（需配合FuckUi数据系统使用） */
    @property({ displayName: '默认置灰' })
    autoGray: boolean = false;
    
    /** 是否对输入值取反（true时实际效果与输入值相反） */
    @property({ displayName: '取反' })
    reverse: boolean = false;
    
    /** 是否递归影响子节点（true时所有子节点都会应用相同效果） */
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;
    
    /** 是否自动为子节点添加SetAlphaMask组件（仅在编辑器模式下生效） */
    @property
    autoSetChildren: boolean = false;

    // ======================== 生命周期方法 ========================
    onLoad() {
        super.onLoad();
        // 编辑器环境下不执行自动置灰逻辑
        if (EDITOR) return;
        // 自动置灰且未接收过数据时立即生效
        this.autoGray && !this.dataSetted && this.SetAlphaMask(true);
    }

    // ======================== 数据驱动逻辑 ========================
    /**
     * 数据变更处理核心方法
     * @param data 输入数据（自动转换为布尔值）
     * 
     * @示例
     * onDataChange(1)   → v=true
     * onDataChange(0)   → v=false
     * onDataChange(null)→ v=false
     */
    protected onDataChange(data: any) {
        data = Boolean(data);  // 强制转换为布尔值
        if (this.reverse) data = !data;  // 取反处理
        this.SetAlphaMask(data);  // 应用遮罩效果
    }

    // ======================== 核心功能实现 ========================
    /** 材质加载重试计数器（防止无限重试） */
    private _num = 30;
    
    /**
     * 设置遮罩效果主逻辑
     * @param v 是否启用遮罩
     * 
     * @实现说明
     * 1. 优先尝试使用自定义材质实现效果
     * 2. 材质未加载时进行最多30次重试（约1秒）
     * 3. 最终失败时降级使用灰度效果
     * 4. 递归处理子节点（如果启用）
     */
    private SetAlphaMask(v: boolean) {
        let a = this.getComponent(UIRenderer);
        if (a) {
            if (!a.customMaterial) {  // 无自定义材质情况
                if (this._num > 0) {  // 延迟重试机制
                    this._num--;
                    this.scheduleOnce(() => {
                        this.SetAlphaMask(v);
                    });
                    return;
                }
                this.SetAlphaMaskNoEffect(v);  // 最终降级方案
            } else {  // 使用SetEffect组件控制材质参数
                let setEffect = this.getComponent(SetEffect) || this.addComponent(SetEffect);
                setEffect.a_setData({
                    defines: {
                        ['0-10']: v  // 控制shader中的宏定义开关
                    }
                });
            }
        }
        // 递归处理子节点
        if (this.recursive) {
            let children = this.getComponentsInChildren(UIRenderer);
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (a?.uuid == child.uuid) continue;  // 跳过自身
                child.getComponent(SetAlphaMask)?.a_setData(v);  // 递归设置
            }
        }
    }

    /**
     * 降级遮罩实现（使用Sprite自带的灰度效果）
     * @param v 是否启用灰度效果
     */
    private SetAlphaMaskNoEffect(v: boolean) {
        const a = this.getComponent(Sprite);
        if (!a) return;
        a.grayscale = v;  // 直接设置灰度属性
    }

    // ======================== 编辑器专用逻辑 ========================
    /**
     * 编辑器更新方法
     * @功能 自动为子节点添加SetAlphaMask组件（当autoSetChildren=true时）
     */
    update() {
        if (!EDITOR) return;  // 仅编辑器生效
        if (!this.autoSetChildren) return;
        this.autoSetChildren = false;  // 单次执行

        if (this.recursive) {
            let children = this.getComponentsInChildren(UIRenderer);
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                // 自动添加组件（如果不存在）
                const a = (child.getComponent(SetAlphaMask) || child.addComponent(SetAlphaMask));
            }
        }
    }
}
