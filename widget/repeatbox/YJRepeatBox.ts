
import { _decorator, Component, Node, instantiate } from 'cc';
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

    onLoad() { }

    protected afterInit() {
        this.node.removeAllChildren();
        for (let i = 0, n = this.data.count; i < n; i++) {
            let item = instantiate(this.templates[this.data.type || 0].tempNode);
            item.active = true;
            item.parent = this.node;
        }
    }
}
