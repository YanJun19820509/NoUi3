
import { _decorator, Component, Node, instantiate, Sprite } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJRepeatBox
 * DateTime = Fri Apr 01 2022 16:40:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJRepeatBox.ts
 * FileBasenameNoExtension = YJRepeatBox
 * URL = db://assets/NoUi3/widget/repeatbox/YJRepeatBox.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * data--{
 *      count: number//需要重复创建个数
 *      max: number//最大重复创建个数
 *      type?: number,//需要创建的模板下标，默认0
 * }
 */

@ccclass('YJRepeatBoxTemplate')
export class YJRepeatBoxTemplate {
    @property(Node)
    tempNode: Node = null;
}

@ccclass('YJRepeatBox')
export class YJRepeatBox extends YJDataWork {
    @property(YJRepeatBoxTemplate)
    templates: YJRepeatBoxTemplate[] = [];
    @property({ step: 1, tooltip: '填充类型，当重复个数不足最大个数时，用来填充的templates下标，如果找不到则不填充' })
    fileType: number = 0;

    private _n: number = 0;
    private _max: number;
    protected afterDataInit() {
        this._max = Math.max(this.data.max, this.node.children.length);
        this._n = this._max;
        this.node.active = false;
        let temp = this.templates[this.data.type || 0].tempNode;
        let fill = this.templates[this.fileType]?.tempNode;
        let n = this._max;
        for (let i = 0; i < n; i++) {
            let item = this.node.children[i];
            if (!item) {
                item = i < this.data.count ? instantiate(temp) : (fill ? instantiate(fill) : null);
                if (item) {
                    item.parent = this.node;
                    item.active = true;
                }
            } else {
                if (i >= this.data.max) item.active = false;
                else {
                    let node = i < this.data.count ? temp : fill;
                    let sf: any = node.getComponent(Sprite).spriteFrame;
                    if (sf) {
                        if (item.getComponent('YJDynamicTexture'))
                            item.getComponent('YJDynamicTexture')['packSpriteFrame'](sf);
                        else if (item.getComponent('SetSpriteFrameInSampler2D')) {
                            item.getComponent('SetSpriteFrameInSampler2D')['setSpriteFrame'](sf.name);
                        }
                    } else if (node.getComponent('SetSpriteFrameInSampler2D')) {
                        sf = node.getComponent('SetSpriteFrameInSampler2D')['defaultName'];
                        item.getComponent('SetSpriteFrameInSampler2D')['setSpriteFrame'](sf);
                    }
                    item.active = true;
                }
            }
        }
        this.node.active = true;
    }

    private _set() {
        let temp = this.templates[this.data.type || 0].tempNode;
        let fill = this.templates[this.fileType]?.tempNode;
        let i = this._max - this._n;
        --this._n;
        let item = this.node.children[i];
        if (!item) {
            item = i < this.data.count ? instantiate(temp) : (fill ? instantiate(fill) : null);
            if (item) {
                item.active = false;
                item.parent = this.node;
            }
        } else {
            if (i >= this.data.max) item.active = false;
            else {
                let sf = i < this.data.count ? temp.getComponent(Sprite).spriteFrame : fill?.getComponent(Sprite).spriteFrame;
                item.getComponent('YJDynamicTexture')?.['packSpriteFrame'](sf);
                item.active = true;
            }
        }
    }

    // lateUpdate() {
    //     if (this._n == 0) return;
    //     this._set();
    // }
}
