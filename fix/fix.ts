import { no } from '../no';
import { js, StencilManager, Node, director, Layout, UITransform, Asset, SpriteFrame, Skeleton, Button, EventTouch, Vec3, Vec2, Mat4, Rect } from '../yj';
import { YJButton } from './YJButton';

/**
 * Predefined variables
 * Name = fix
 * DateTime = Wed Apr 19 2023 21:15:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = fix.ts
 * FileBasenameNoExtension = fix
 * URL = db://assets/common/fix/fix.ts
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
// const _a = no.setIntervalF(function () {
//     const batcher2D = director.root['_batcher'];
//     if (batcher2D) {
//         no.clearIntervalF(_a);
//         const _walk = batcher2D.walk;
//         js.mixin(batcher2D, {
//             walk(node: Node, level = 0) {
//                 if (no.visible(node)) {
//                     _walk.call(this, node, level);
//                 }
//             }
//         });
//     }
// }, 100);

//点击判断
const _hitTest = UITransform.prototype.hitTest;
js.mixin(UITransform.prototype, {
    hitTest(screenPoint, windowId) {
        if (!no.visible(this.node) || !no.visibleByOpacity(this.node)) {
            // no.log('hitTest false', this.node.name)
            return false;
        }
        return _hitTest.call(this, screenPoint, windowId);
    }
});
/**修复原生Button _onTouchMove 的时候 hitTest点击测试没有传event?.windowId事件窗口id 导致与摄像机systemWindowId不一致 点击测试始终返回false的问题 */
Button.prototype["_onTouchMove"] = function (event?: EventTouch) {
    if (!this._interactable || !this.enabledInHierarchy || !this._pressed) { return; }
    // mobile phone will not emit _onMouseMoveOut,
    // so we have to do hit test when touch moving
    if (!event) {
        return;
    }

    const touch = (event).touch;
    if (!touch) {
        return;
    }

    const hit = this.node._uiProps.uiTransformComp!.hitTest(touch.getLocation(), event?.windowId);

    if (this._transition === 3/* Transition.SCALE */ && this.target && this._originalScale) {
        if (hit) {
            Vec3.copy(this._fromScale, this._originalScale);
            Vec3.multiplyScalar(this._toScale, this._originalScale, this._zoomScale);
            this._transitionFinished = false;
        } else {
            this._time = 0;
            this._transitionFinished = true;
            this.target.setScale(this._originalScale);
        }
    } else {
        let state;
        if (hit) {
            state = "pressed"/* State.PRESSED */;
        } else {
            state = "normal"/* State.NORMAL */;
        }
        this._applyTransition(state);
    }

    if (event) {
        event.propagationStopped = true;
    }
}
//layout
js.mixin(Layout.prototype, {
    _checkUsefulObj() {
        this._usefulLayoutObj.length = 0;
        const children = this.node.children;
        for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            const uiTrans = child._uiProps.uiTransformComp;
            if (child.activeInHierarchy && uiTrans && no.visible(child) && no.visibleByOpacity(child)) {
                this._usefulLayoutObj.push(uiTrans);
            }
        }
    }
});

js.mixin(YJButton.prototype, {
    a_trigger(event) {
        if (!this._canClick && event) return;
        if (event && event.getAllTouches().length > 1) return;
        if (this.needWait) return;
        this.needWait = true;
        no.executeHandlers(this._clickEvents, event);
        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.delay);
        no.evn.emit('YJButton_a_trigger')
    }
});

js.mixin(Asset.prototype, {
    get uuid() {
        return this._uuid;
    }
});

js.mixin(SpriteFrame.prototype, {
    get width() {
        return this._w || this._texture.width;
    },
    get height() {
        return this._h || this._texture.height;
    }
});

js.mixin(Skeleton.prototype, {
    _render(batcher) {
        let indicesCount = 0;
        if (this.renderData && this._drawList) {
            const rd = this.renderData;
            const chunk = rd.chunk;
            const accessor = chunk.vertexAccessor;
            const meshBuffer = rd.getMeshBuffer()!;
            const origin = meshBuffer.indexOffset;
            // Fill index buffer
            for (let i = 0; i < this._drawList.length; i++) {
                this._drawIdx = i;
                const dc = this._drawList.data[i];
                if (dc.texture) {
                    if (dc.texture.isValid) {
                        batcher.commitMiddleware(this, meshBuffer, origin + dc.indexOffset,
                            dc.indexCount, dc.texture, dc.material!, this._enableBatch);
                    } else {
                        console.error('Invalid texture in skeleton');
                    }
                }
                indicesCount += dc.indexCount;
            }
            const subIndices = rd.indices!.subarray(0, indicesCount);
            accessor.appendIndices(chunk.bufferId, subIndices);
        }
    }
});

//会出现错位，先去掉
// js.mixin(Toggle.prototype, {
//     playEffect() {
//         if (this._checkMark) {
//             no.visible(this._checkMark.node, this._isChecked)
//         }
//     }
// });


// const _commitIA: Function = cc['internal']?.['Batcher2D']['prototype']['commitIA'];
// js.mixin(cc['internal']?.['Batcher2D']['prototype'], {
//     commitIA(renderComp: any, ia: any, tex?: any, mat?: any, transform?: Node) {
//         if (!tex || !tex.getGFXSampler()) tex = null;
//         return _commitIA.call(this, renderComp, ia, tex, mat, transform);
//     }
// });