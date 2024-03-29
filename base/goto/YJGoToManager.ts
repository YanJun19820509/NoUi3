
import { _decorator, Component, Node } from 'cc';
import { YJPanel } from '../node/YJPanel';
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

    public static goTo(alias: string, args?: any, before?: () => void, after?: () => void): void {
        let info = YJGoToManager._ins?.delegate?.getInfoByAlias(alias);
        if (!info) return;
        before?.();
        if (info.accompany != '') {
            this.goTo(info.accompany, null, null, () => {
                this.show(info, args, after);
            });
        } else this.show(info, args, after);
    }

    private static show(info: YJGoToInfo, args: any, cb: () => void) {
        args = args || info.args;
        let panel = YJWindowManager.opennedPanel(info.target);
        if (panel && panel.node.activeInHierarchy) this._ins.trigger(panel, args, cb);
        else if (!info.isSub)
            YJWindowManager.createPanel(info.target, null, null, panel => {
                this._ins.trigger(panel, args, cb);
            });
        else {
            this._ins.scheduleOnce(() => {
                this.show(info, args, cb);
            });
        }
    }

    private trigger(panel: Component, args: any, cb: () => void) {
        if (!panel.node.activeInHierarchy) {
            this.scheduleOnce(() => {
                this.trigger(panel, args, cb);
            });
            return;
        }
        let a = panel.getComponent(YJGoToTarget) || panel.getComponentInChildren(YJGoToTarget);
        a?.trigger(args);
        cb?.();
    }
}
