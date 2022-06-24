
import { _decorator, Component, Node } from 'cc';
import { YJWindowManager } from '../node/YJWindowManager';
import { YJGoToConfigDelegate, YJGoToInfo } from './YJGoToConfigDelegate';
import { YJGoToTarget } from './YJGoToTarget';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJGoToManager
 * DateTime = Fri Jun 24 2022 12:10:23 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGoToManager.ts
 * FileBasenameNoExtension = YJGoToManager
 * URL = db://assets/NoUi3/base/goto/YJGoToManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */


@ccclass('YJGoToManager')
export class YJGoToManager extends Component {
    @property(YJGoToConfigDelegate)
    delegate: YJGoToConfigDelegate = null;

    private static _ins: YJGoToManager;

    onLoad() {
        YJGoToManager._ins = this;
    }

    onDestroy() {
        YJGoToManager._ins = null;
    }

    public static goTo(alias: string): void {
        let info = YJGoToManager._ins?.delegate?.getInfoByAlias(alias);
        if (!info) return;
        if (info.accompany != '') {
            YJWindowManager.createPanel(info.accompany, null, null, () => {
                this.show(info);
            });
        } else this.show(info);
    }

    private static show(info: YJGoToInfo) {
        YJWindowManager.createPanel(info.target, null, null, panel => {
            let a = panel.getComponent(YJGoToTarget) || panel.getComponentInChildren(YJGoToTarget);
            a?.trigger(info.args);
        });
    }
}
