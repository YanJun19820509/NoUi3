
import { _decorator, Component, Node } from 'cc';
import { JSB } from 'cc/env';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJShowForWeb
 * DateTime = Tue Aug 09 2022 11:51:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForWeb.ts
 * FileBasenameNoExtension = YJShowForWeb
 * URL = db://assets/NoUi3/base/node/YJShowForWeb.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
 
@ccclass('YJShowForWeb')
export class YJShowForWeb extends Component {
    onLoad() {
        JSB && this.node.destroy();
    }
}
