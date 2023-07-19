
import { _decorator, assetManager, BaseNode, Component, director, js, Layers, Material, Node, StencilManager } from 'cc';
import { no } from '../no';
const { ccclass, property } = _decorator;

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

const _dispatchEvent = BaseNode.prototype.dispatchEvent;
js.mixin(BaseNode.prototype, {
    dispatchEvent(event: Event) {
        if (no.visible(this))
            _dispatchEvent.call(this, event);
    }
});


// const _commitIA: Function = cc['internal']?.['Batcher2D']['prototype']['commitIA'];
// js.mixin(cc['internal']?.['Batcher2D']['prototype'], {
//     commitIA(renderComp: any, ia: any, tex?: any, mat?: any, transform?: Node) {
//         if (!tex || !tex.getGFXSampler()) tex = null;
//         return _commitIA.call(this, renderComp, ia, tex, mat, transform);
//     }
// });

// assetManager.pipeline.insert(function (task, done) {
//     task.output = task.input;
//     for (let i = 0; i < task.input.length; i++) {
//         console.log(task.input[i].content);
//     }
//     done();
// }, 1);