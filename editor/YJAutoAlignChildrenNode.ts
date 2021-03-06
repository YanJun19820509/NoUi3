
import { _decorator, Component, Widget, Enum, view } from 'cc';
import { EDITOR } from 'cc/env';
import { AlignType } from '../types';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJAutoAlignChildrenNode
 * DateTime = Wed Apr 06 2022 12:16:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAutoAlignChildrenNode.ts
 * FileBasenameNoExtension = YJAutoAlignChildrenNode
 * URL = db://assets/NoUi3/editor/YJAutoAlignChildrenNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 在编辑器状态下，自动设置所有子节点widget的纵向对齐方式：顶对齐、居中或底对齐,
 * 该组件适用于需要统一调整所有子节点的对齐方式 
 */
@ccclass('YJAutoAlignChildrenNode')
@executeInEditMode(true)
export class YJAutoAlignChildrenNode extends Component {
    @property({ type: Enum(AlignType), tooltip: 'Top,Middle,Bottom适用于竖屏模式，Left,Center,Right适用于横屏模式' })
    align: AlignType = AlignType.None;

    private lastAlign: AlignType;

    onLoad() {
        if (!EDITOR) this.destroy();
        this.lastAlign = this.align;
    }

    update() {
        if (!EDITOR) return;
        if (this.align == this.lastAlign) return;
        let wsize = view.getDesignResolutionSize();
        // console.log(wsize);
        let a = wsize.width / wsize.height;
        if (a > 1 && (this.align == AlignType.Bottom || this.align == AlignType.Middle || this.align == AlignType.Top)) return;
        if (a < 1 && (this.align == AlignType.Left || this.align == AlignType.Center || this.align == AlignType.Right)) return;
        this.lastAlign = this.align;
        this.node.children.forEach(child => {
            if (child.active) {
                let w = child.getComponent(Widget) || child.addComponent(Widget);
                if (w.isStretchHeight) return;
                switch (this.align) {
                    case AlignType.Bottom:
                        w.isAlignTop = false;
                        w.isAlignBottom = true;
                        break;
                    case AlignType.Top:
                        w.isAlignBottom = false;
                        w.isAlignTop = true;
                        break;
                    case AlignType.Middle:
                        w.isAlignBottom = false;
                        w.isAlignTop = false;
                        let y = child.getPosition().y;
                        w.isAlignVerticalCenter = true;
                        w.verticalCenter = y;
                        break;
                    case AlignType.Left:
                        w.isAlignRight = false;
                        w.isAlignLeft = true;
                        break;
                    case AlignType.Right:
                        w.isAlignLeft = false;
                        w.isAlignRight = true;
                        break;
                    case AlignType.Center:
                        w.isAlignLeft = false;
                        w.isAlignRight = false;
                        let x = child.getPosition().x;
                        w.isAlignHorizontalCenter = true;
                        w.horizontalCenter = x;
                        break;
                    default:
                        w.isAlignBottom = false;
                        w.isAlignTop = false;
                        w.isAlignVerticalCenter = false;
                        break;
                }
            }
        });
    }
}
