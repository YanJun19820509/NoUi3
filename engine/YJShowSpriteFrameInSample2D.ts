import { ccclass, property, Component, Button, executeInEditMode, EDITOR } from '../yj';

/**
 * Predefined variables
 * Name = YJShowSpriteFrameInSample2D
 * DateTime = Mon Nov 28 2022 18:48:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowSpriteFrameInSample2D.ts
 * FileBasenameNoExtension = YJShowSpriteFrameInSample2D
 * URL = db://assets/NoUi3/engine/YJShowSpriteFrameInSample2D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//用来控制使用SetSpriteFrameInSample2D的Sprite显示/隐藏默认spriteFrame
/**
 * 
 * 注意：这个组件在3.7.2版本中被废弃，显示/隐藏默认spriteFrame操作移到YJLoadAssets组件中
 * 
 */
@ccclass('YJShowSpriteFrameInSample2D')
@executeInEditMode()
/**
 * 精灵帧显示控制组件（已废弃）
 * @deprecated 3.7.2版本起功能迁移至YJLoadAssets组件
 * @classdesc 用于批量控制子节点中各种类型精灵组件的默认spriteFrame显示状态
 * @example
 * // 在编辑器中使用：
 * // 1. 将组件挂载到父节点
 * // 2. 勾选/取消勾选"显示SpriteFrame"复选框
 * // 3. 将自动显示/隐藏所有子节点中的精灵组件默认帧
 */
export class YJShowSpriteFrameInSample2D extends Component {
    /**
     * 显示/隐藏精灵帧控制属性
     * @description 设置时会触发子组件状态更新
     * @example
     * // 代码控制显示：
     * this.showSpriteFrame = true;
     */
    @property({ displayName: '显示SpriteFrame' })
    public get showSpriteFrame(): boolean {
        return this._show;
    }

    public set showSpriteFrame(v: boolean) {
        this._show = v;
        this.showSubSpriteFrame(v);
    }

    @property({ serializable: true })
    private _show: boolean = false;

    /**
     * 递归更新所有子组件的精灵帧状态
     * @param v 是否显示精灵帧
     * @description 支持处理的组件类型：
     * - SetSpriteFrameInSampler2D: 采样器精灵组件
     * - YJLanguageSprite: 多语言精灵组件
     * - YJBitmapFont: 位图字体组件
     * - YJLanguageLabel: 多语言文本组件
     * - YJCharLabel: 字符文本组件
     * - SetMaterial: 材质设置组件
     * - SetSpriteFrame: 普通精灵组件
     * - Button: 按钮状态精灵组件
     */
    private showSubSpriteFrame(v: boolean) {
        // 处理采样器精灵组件
        let list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetSprite() : list[i].removeSprite();
        }

        // 处理多语言精灵组件
        list = this.getComponentsInChildren('YJLanguageSprite');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetSprite() : list[i].removeSprite();
        }

        // 处理位图字体组件
        list = this.getComponentsInChildren('YJBitmapFont');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetFont() : list[i].removeFont();
        }

        // 处理多语言文本组件
        list = this.getComponentsInChildren('YJLanguageLabel');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetLabel() : list[i].removeLabel();
        }

        // 处理字符文本组件
        list = this.getComponentsInChildren('YJCharLabel');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetLabel() : list[i].removeLabel();
        }

        // 处理材质设置组件
        list = this.getComponentsInChildren('SetMaterial');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetMaterial() : list[i].removeMaterial();
        }

        // 处理普通精灵组件
        list = this.getComponentsInChildren('SetSpriteFrame');
        for (let i = 0; i < list.length; i++) {
            v ? list[i].resetSprite() : list[i].removeSprite();
        }

        // 特殊处理按钮组件状态
        if (!v) {
            list = this.getComponentsInChildren(Button);
            for (let i = 0; i < list.length; i++) {
                // 仅处理没有普通Sprite组件或使用特殊精灵组件的按钮
                if (list[i].getComponent('SetSpriteFrameInSampler2D') || 
                    list[i].getComponent('SetSpriteFrame') || 
                    !list[i].getComponent('Sprite')) {
                    list[i].normalSprite = null;
                    list[i].hoverSprite = null;
                    list[i].pressedSprite = null;
                    list[i].disabledSprite = null;
                }
            }
        }
    }

    /**
     * 组件加载时处理（编辑器专用）
     * @description 在编辑模式下自动销毁组件避免残留
     */
    onLoad() {
        if (EDITOR) {
            this.destroy();
        }
    }
}
