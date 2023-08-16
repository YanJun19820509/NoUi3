
import { no } from '../no';
import { js, StencilManager, Node, director, Layout, UITransform } from '../yj';

/**
 * Predefined variables
 * Name = fix
 * DateTime = Wed Apr 19 2023 21:15:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = fix.ts
 * FileBasenameNoExtension = fix
 * URL = db://assets/NoUi3/fix/fix.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
const _getStencilStage = StencilManager.prototype.getStencilStage;
js.mixin(StencilManager.prototype, {
    getStencilStage(stage: any, mat?: any) {
        if (!mat || !mat.passes) mat = null;
        return _getStencilStage.call(this, stage, mat);
    }
});

//渲染
const _a = setInterval(function () {
    const batcher2D = director.root.batcher2D;
    if (batcher2D) {
        clearInterval(_a);
        const _walk = batcher2D['__proto__'].walk;
        js.mixin(director.root.batcher2D['__proto__'], {
            walk(node: Node, level = 0) {
                if (no.visible(node))
                    _walk.call(this, node, level);
            }
        });
    }
}, 100);

//点击判断
const _hitTest = UITransform.prototype.hitTest;
js.mixin(UITransform.prototype, {
    hitTest(screenPoint, windowId) {
        if (!no.visible(this.node)) {
            // no.log('hitTest false', this.node.name)
            return false;
        }
        return _hitTest.call(this, screenPoint, windowId);
    }
});
//layout
js.mixin(Layout.prototype, {
    _checkUsefulObj() {
        this._usefulLayoutObj.length = 0;
        const children = this.node.children;
        for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            const uiTrans = child._uiProps.uiTransformComp;
            if (child.activeInHierarchy && uiTrans && no.visible(child)) {
                this._usefulLayoutObj.push(uiTrans);
            }
        }
    }
});


// const _commitIA: Function = cc['internal']?.['Batcher2D']['prototype']['commitIA'];
// js.mixin(cc['internal']?.['Batcher2D']['prototype'], {
//     commitIA(renderComp: any, ia: any, tex?: any, mat?: any, transform?: Node) {
//         if (!tex || !tex.getGFXSampler()) tex = null;
//         return _commitIA.call(this, renderComp, ia, tex, mat, transform);
//     }
// });