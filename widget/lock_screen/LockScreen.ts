import { _decorator } from 'cc';
import { YJPanel } from '../../../NoUi3/base/node/YJPanel';
import { panelPrefabPath } from '../../../NoUi3/types';
import { YJWindowManager } from '../../../NoUi3/base/node/YJWindowManager';
import { no } from '../../../NoUi3/no';
const { ccclass, property } = _decorator;

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Aug 10 2023 11:24:08 GMT+0800 (中国标准时间)
 *
 */

@ccclass('LockScreen')
@panelPrefabPath('db://assets/NoUi3/widget/lock_screen/lock_screen.prefab')
export class LockScreen extends YJPanel {
    private static _ins: LockScreen;
    private static _showing = 0;
    private _1 = 0;
    onLoad() {
        super.onLoad();
        LockScreen._ins = this;
    }

    onDestroy() {
        LockScreen._ins = null;
    }

    public static show() {
        this._showing = 1;
        YJWindowManager.createPanel<LockScreen>(LockScreen, 'mess');
    }

    public static async hide() {
        this._showing = 0;
        await no.waitFor(() => { return !!this._ins; });
        if (this._showing == 1) return;
        this._ins?.closePanel();
    }
}