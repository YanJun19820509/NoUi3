
import { ccclass, property, menu, executeInEditMode, EDITOR, UIRenderer, Sprite } from '../yj';
import { rendererUtils } from '../extend/rendererUtils';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetGray
 * DateTime = Mon Jan 17 2022 10:47:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGray.ts
 * FileBasenameNoExtension = SetGray
 * URL = db://assets/Script/common/ui/SetGray.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetGray')
@menu('NoUi/ui/SetGray(设置灰态:bool)')
@executeInEditMode()
/**
 * 灰度控制组件
 * @description 实现UI元素的灰度效果控制，支持普通置灰和遮罩效果两种模式
 * @使用场景
 * 1. 需要根据业务状态显示灰态UI时（如按钮禁用）
 * 2. 需要批量控制子节点灰态时
 * @示例
 * // 编辑器中使用：
 * 1. 勾选autoGray实现默认置灰
 * 2. 勾选recursive实现子节点递归控制
 * 
 * // 代码中使用：
 * const grayComp = node.getComponent(SetGray);
 * grayComp.a_setData(true); // 启用灰态
 */
export class SetGray extends HackUi {
    /** 是否在加载时自动启用灰态（需配合dataWork使用） */
    @property({ displayName: '默认置灰' })
    autoGray: boolean = false;

    /** 是否使用遮罩效果替代普通灰态（需要shader支持） */
    @property({ displayName: '遮罩效果' })
    isMask: boolean = false;

    /** 是否反转控制逻辑（true时数据为false启用灰态） */
    @property({ displayName: '取反' })
    reverse: boolean = false;

    /** 是否递归影响子节点的灰态设置 */
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;

    /** 编辑器专用：自动为子节点添加灰态组件 */
    @property({ tooltip: '编辑器模式下自动为子节点添加SetGray组件' })
    autoSetChildren: boolean = false;

    /** 组件加载回调 */
    onLoad() {
        super.onLoad();
        // 编辑器环境下不执行自动置灰
        if (EDITOR) return;
        // 自动置灰且未设置过数据时触发
        this.autoGray && !this.dataSetted && this.setGray(true);
    }

    /**
     * 数据变化响应方法
     * @param data 灰态控制数据（true/false）
     * @流程说明
     * 1. 转换数据为布尔值
     * 2. 根据reverse属性反转控制逻辑
     * 3. 执行灰态设置
     */
    protected onDataChange(data: any) {
        data = Boolean(data);
        if (this.reverse) data = !data;
        this.setGray(data);
    }

    private _num = 30; // 材质加载重试计数器

    /**
     * 设置灰态核心方法
     * @param v 是否启用灰态
     * @实现原理
     * 1. 获取UIRenderer组件
     * 2. 检测自定义材质状态：
     *    - 无材质：使用Sprite内置灰态（最多重试30次等待材质加载）
     *    - 有材质：通过SetEffect组件设置shader参数
     * 3. 递归处理子节点（当recursive=true时）
     */
    private setGray(v: boolean) {
        let renderer = this.getComponent(UIRenderer);
        if (renderer) {
            if (!renderer.customMaterial) {
                // 延迟重试机制：等待材质加载完成
                if (this._num > 0) {
                    this._num--;
                    this.scheduleOnce(() => this.setGray(v));
                    return;
                }
                rendererUtils.gray(this.getComponent(Sprite), v);
            } else {
                if (this.isMask) {
                    rendererUtils.maskSample2D(renderer, v);
                } else {
                    rendererUtils.graySample2D(renderer, v);
                }
            }
        }
        // 递归处理子节点
        if (this.recursive) {
            let children = this.getComponentsInChildren(UIRenderer);
            let child: UIRenderer;
            for (let i = 0, n = children.length; i < n; i++) {
                child = children[i];
                if (renderer?.uuid == child.uuid) continue; // 跳过自身
                child.getComponent(SetGray)?.a_setData(v);
            }
        }
    }

    /**
     * 编辑器更新回调
     * @功能说明
     * 1. 自动为子节点添加SetGray组件
     * 2. 同步isMask属性到子节点
     */
    update() {
        if (!EDITOR) return;
        if (!this.autoSetChildren) return;
        this.autoSetChildren = false;

        if (this.recursive) {
            let children = this.getComponentsInChildren(UIRenderer);
            let child: UIRenderer;
            let comp: SetGray;
            for (let i = 0, n = children.length; i < n; i++) {
                child = children[i];
                comp = child.getComponent(SetGray) || child.addComponent(SetGray);
                comp.isMask = this.isMask;
            }
        }
    }
}
