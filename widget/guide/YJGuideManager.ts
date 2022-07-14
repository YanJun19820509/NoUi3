
import { _decorator, Component, Node } from 'cc';
import { DEBUG } from 'cc/env';
import { YJWindowManager } from '../../base/node/YJWindowManager';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJGuideManager
 * DateTime = Mon May 16 2022 09:22:13 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGuideManager.ts
 * FileBasenameNoExtension = YJGuideManager
 * URL = db://assets/NoUi3/widget/guide/YJGuideManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 引导配置数据结构为：{id:步骤id,	next_id:下一步id,	type:引导类型,	sub_type:子类型,	target:绑定节点名,	content:对话内容,	event:监听事件,	lock:是否强制,	save:记录步骤}								

 */
@ccclass('YJGuideManager')
export class YJGuideManager extends Component {
    @property({ tooltip: '配置路径，可为配置文件路径或key，如果为key则直接通过no.dataCache获得' })
    jsonPath: string = '';
    @property({ displayName: '引导主窗口类名' })
    guidePanel: string = '';

    private static _ins: YJGuideManager;

    public static get ins(): YJGuideManager {
        return this._ins;
    }

    private _config: any;

    onLoad() {
        YJGuideManager._ins = this;
        if (this.jsonPath == '') {
            console.error('新手引导配置不可为空！');
            return;
        }
        let path = this.jsonPath.replace('db://assets/', '').replace('.json', '');
        this._config = no.dataCache.getJSON(path);
        if (!this._config)
            no.assetBundleManager.loadJSON(path, item => {
                this._config = item.json;
            });
    }

    onDestroy() {
        YJGuideManager._ins = null;
    }

    public save(step: string) {
        let a = no.dataCache.getLocal('guide_steps') || [];
        a[a.length] = step;
        no.dataCache.setLocal('guide_steps', a);
    }

    public getGuideInfo(path: string): any {
        return no.getValue(this._config, path);
    }

    public check(step: string): boolean {
        let a: string[] = no.dataCache.getLocal('guide_steps') || [];
        if (a.indexOf(step) != -1) return false;
        YJWindowManager.createPanel(this.guidePanel, null, (panel: any) => {
            panel.curStep = step;
        });
        return true;
    }

}

if (DEBUG) {
    window['YJGuideManager'] = YJGuideManager;
}