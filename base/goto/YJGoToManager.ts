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
 * @核心职责
 * - 通过配置代理获取跳转信息
 * - 管理跳转流程的生命周期
 * - 处理界面显示和参数传递
 * @依赖组件
 * - YJGoToConfigDelegate 配置代理
 * - YJWindowManager 窗口管理
 * - YJPanel/YJGoToTarget 界面组件
 */
export class YJGoToManager extends Component {
    /** 
     * 跳转配置代理，用于获取跳转配置信息
     * @配置流程
     * 1. 在编辑器中拖拽配置代理组件到该属性
     * 2. 通过代理获取指定别名的跳转配置
     * @example
     * // 在编辑器中将YJGoToConfigDelegate组件拖拽到该属性
     * this.delegate = GetComponent(YJGoToConfigDelegate);
     */
    @property(YJGoToConfigDelegate)
    delegate: YJGoToConfigDelegate = null;

    /** 单例实例（静态私有变量） */
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
     * 执行跳转流程
     * @param alias 跳转配置别名（需在配置代理中预先定义）
     * @param args 动态参数（将覆盖配置中的默认参数）
     * @param before 跳转前回调（用于前置处理如播放动画）
     * @param after 跳转后回调（用于后置处理如数据上报）
     * @流程说明
     * 1. 通过别名获取跳转配置
     * 2. 执行前置回调
     * 3. 检查并处理伴随跳转（accompany配置）
     * 4. 最终显示目标界面
     * @示例
     * // 跳转到商店界面并打开武器分页
     * YJGoToManager.goTo('main_store', { tab: 'weapon' }, 
     *   () => console.log('跳转开始'), 
     *   () => console.log('跳转完成')
     * );
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
     * 显示目标界面核心方法
     * @param info 跳转配置信息（包含目标类名、参数等）
     * @param args 动态参数（优先级高于配置参数）
     * @param cb 显示完成回调
     * @实现逻辑
     * 1. 参数合并（动态参数优先）
     * 2. 类加载检查
     * 3. 根据目标类型处理显示逻辑：
     *   - 直接调用show方法（标准界面）
     *   - 通过窗口管理器创建面板（复杂界面）
     * @配置示例
     * {
     *   alias: 'store_entry',
     *   target: 'StorePanel',
     *   accompany: 'check_login',
     *   args: { defaultTab: 'equip' },
     *   isSub: false
     * }
     */
    private static show(info: YJGoToInfo, args: any, cb: () => void) {
        args = args || info.args;
        const clazz = js.getClassByName(info.target);
        if (!clazz) {
            no.log('跳转目标不存在', info.target);
            return;
        }
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
     * 触发目标界面跳转行为
     * @param panel 目标界面组件实例
     * @param args 跳转参数（支持复杂对象）
     * @param cb 最终回调
     * @重试机制
     * - 当界面未激活时，通过定时器重试
     * - 最大重试次数由Cocos调度器管理
     * @组件要求
     * - 目标界面需包含YJGoToTarget组件
     * - 实现trigger方法处理参数
     * @示例
     * // 在目标界面的YJGoToTarget组件中：
     * trigger(args) {
     *   if(args.tab) this.switchTab(args.tab);
     * }
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
