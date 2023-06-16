
import { ccclass, Component, Node, JsonAsset } from '../yj';

/**
 * Predefined variables
 * Name = YJPreloadDelegate
 * DateTime = Wed Mar 23 2022 14:55:38 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPreloadDelegate.ts
 * FileBasenameNoExtension = YJPreloadDelegate
 * URL = db://assets/NoUi3/base/YJPreloadDelegate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJPreloadDelegate')
export class YJPreloadDelegate extends Component {
    async onJsonLoaded(assets: JsonAsset[]): Promise<void> { }
    onLoadComplete(): void { }
}
