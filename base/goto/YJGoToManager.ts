import { no } from '../../no';
import { ccclass, property, Component, Node, js } from '../../yj';
import { YJPanel } from '../node/YJPanel';
import { YJWindowManager } from '../node/YJWindowManager';
import { YJGoToConfigDelegate, YJGoToInfo } from './YJGoToConfigDelegate';
import { YJGoToTarget } from './YJGoToTarget';

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
/**
 * 跳转管理类,用于管理游戏中的功能跳转
 */
export class YJGoToManager extends Component {
    /** 跳转配置代理 */
    @property(YJGoToConfigDelegate)
    delegate: YJGoToConfigDelegate = null;

    /** 单例实例 */
    private static _ins: YJGoToManager;

    /** 组件加载时初始化单例实例 */
    onLoad() {
        YJGoToManager._ins = this;
    }

    /** 组件销毁时清空单例实例 */
    onDestroy() {
        YJGoToManager._ins = null;
    }

    /**
     * 执行跳转
     * @param alias 跳转别名
     * @param args 跳转参数
     * @param before 跳转前回调
     * @param after 跳转后回调
     */
    public static goTo(alias: string, args?: any, before?: () => void, after?: () => void): void {
        let info = YJGoToManager._ins?.delegate?.getInfoByAlias(alias);
        if (!info || !info.target) return;
        before?.();
        if (info.accompany != '') {
            this.goTo(info.accompany, null, null, () => {
                this.show(info, args, after);
            });
        } else this.show(info, args, after);
    }

    /**
     * 显示目标界面
     * @param info 跳转信息
     * @param args 跳转参数
     * @param cb 显示完成回调
     */
    private static show(info: YJGoToInfo, args: any, cb: () => void) {
        args = args || info.args;
        const clazz = js.getClassByName(info.target);
        if (typeof clazz['show'] == 'function') {
            no.evn.once(clazz['$super'] == YJPanel ? '_PanelOpen' : 'PopuPanelContent_create', (panel) => {
                this._ins.trigger(panel, args, cb);
            }, this);
            clazz['show'](info.data);
        } else if (clazz['$super'] == YJPanel) {
            let panel = YJWindowManager.opennedPanelByType(info.target);
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
    }

    /**
     * 触发目标界面的跳转行为
     * @param panel 目标界面
     * @param args 跳转参数
     * @param cb 触发完成回调
     */
    private trigger(panel: Component, args: any, cb: () => void) {
        if (args == null) {
            cb?.();
            return;
        }
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
