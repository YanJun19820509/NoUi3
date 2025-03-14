
import { ccclass, Component, Node, JsonAsset } from '../yj';
import { YJPreload } from './YJPreload';

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
@ccclass('YJPreloadDelegate')
export class YJPreloadDelegate extends Component {
    /**
     * 预加载开始前的回调
     * @param preload YJPreload实例
     * @example
     * // 示例：在加载开始前修改配置
     * beforeStartLoad(preload: YJPreload) {
     *     preload.bundles.push('new_bundle');
     *     preload.files = ['base/textures/loading_bg'];
     * }
     */
    beforeStartLoad(preload: YJPreload) { }

    /**
     * JSON文件加载完成回调
     * @param assets 已加载的JSON资源数组
     * @example
     * // 示例：解析加载的JSON配置
     * onJsonLoaded(assets: JsonAsset[]) {
     *     assets.forEach(json => {
     *         const config = json.json;
     *         no.data.setConfig(json.name, config);
     *     });
     * }
     */
    onJsonLoaded(assets: JsonAsset[]) { }

    /**
     * 全部资源加载完成回调
     * @example
     * // 示例：加载完成后进入主场景
     * onLoadComplete() {
     *     no.asset.loadScene('main', (err, scene) => {
     *         director.loadScene(scene);
     *     });
     * }
     */
    onLoadComplete(): void { }
}
