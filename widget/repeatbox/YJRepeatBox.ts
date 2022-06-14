
import { _decorator, Component, Node, instantiate, Sprite } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
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

    onLoad() { }

    protected afterInit() {
        let temp = this.templates[this.data.type || 0].tempNode;
        let fill = this.templates[this.fileType]?.tempNode;
        let n = Math.max(this.data.max, this.node.children.length);
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
                    let sf = i < this.data.count ? temp.getComponent(Sprite).spriteFrame : fill?.getComponent(Sprite).spriteFrame;
                    item.getComponent('YJDynamicTexture')['packSpriteFrame'](sf);
                    item.active = true;
                }
            }
        }
    }
}
