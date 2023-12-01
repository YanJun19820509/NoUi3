
import { ccclass, requireComponent, property, sys, Widget, SafeArea, UITransform, widgetManager } from '../../yj';
import { EDITOR } from 'cc/env';
import { YJFitScreen } from '../YJFitScreen';

/**
 * Predefined variables
 * Name = YJSafeArea
 * DateTime = Mon Apr 11 2022 09:42:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSafeArea.ts
 * FileBasenameNoExtension = YJSafeArea
 * URL = db://assets/NoUi3/base/node/YJSafeArea.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 竖屏下原生SafeArea组件会留出顶部和底部空间，当useOrigin为false时，则不会留出底部空间。横屏时与原生效果无异。
 */
@ccclass('YJSafeArea')
@requireComponent(Widget)
export class YJSafeArea extends SafeArea {
    @property({ tooltip: '保留顶部' })
    safeTop: boolean = false;
    @property({ tooltip: '保留底部' })
    safeBottom: boolean = false;

    public updateArea() {
        // TODO Remove Widget dependencies in the future
        const widget = this.node.getComponent(Widget) as Widget;
        const uiTransComp = this.node.getComponent(UITransform) as UITransform;
        if (!widget || !uiTransComp) {
            return;
        }

        if (EDITOR) {
            widget.top = widget.bottom = widget.left = widget.right = 0;
            widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
            return;
        }
        // IMPORTANT: need to update alignment to get the latest position
        // widget.updateAlignment();
        //
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        const visibleSize = YJFitScreen.getVisibleSize();
        const screenWidth = visibleSize.width;
        const screenHeight = visibleSize.height;
        const safeArea = sys.getSafeAreaRect();
        if (screenHeight > screenWidth) {
            widget.top = this.safeTop ? screenHeight - safeArea.y - safeArea.height : 0;
            widget.bottom = this.safeBottom ? safeArea.y : 0;
        } else {
            // widget.left = safeArea.x;
            // widget.right = screenWidth - safeArea.x - safeArea.width;
        }
        // widget.updateAlignment();
        // set anchor, keep the original position unchanged
        const lastPos = this.node.position.clone();
        const lastAnchorPoint = uiTransComp.anchorPoint.clone();
        this.scheduleOnce(() => {
            const curPos = this.node.position.clone();
            const anchorX = lastAnchorPoint.x - (curPos.x - lastPos.x) / uiTransComp.width;
            const anchorY = lastAnchorPoint.y - (curPos.y - lastPos.y) / uiTransComp.height;
            uiTransComp.setAnchorPoint(anchorX, anchorY);
        });
        // IMPORTANT: restore to lastPos even if widget is not ALWAYS
        widgetManager.add(widget);
    }
}
