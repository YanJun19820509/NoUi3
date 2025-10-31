import { YJWindowManager } from '../../base/node/YJWindowManager';
import { GuiManager } from '../../gui/GuiManager';
import { no } from '../../no';
import { Component, DEBUG, ccclass, property } from '../../yj';
import { GuiGuidePanel } from './GuiGuidePanel';

/**
 * Predefined variables
 * Name = YJGuideManager
 * DateTime = Mon May 16 2022 09:22:13 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGuideManager.ts
 * FileBasenameNoExtension = YJGuideManager
 * URL = db://assets/common/widget/guide/YJGuideManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 引导配置数据结构为：{id:步骤id,	next_id:下一步id,	type:引导类型,	sub_type:子类型,	target:绑定节点名,	content:对话内容,	event:监听事件,	lock:是否强制,	save:记录步骤}								

 */
@ccclass('YJGuideManager')
/**
 * 新手引导系统核心管理器
 * @example
 * // 编辑器配置示例：
 * // jsonPath: 'config/guide' 引导配置表路径（自动加载assets/config/guide.json）
 * // guidePanel: 'prefabs/GuidePanel' 引导用UI面板预制体路径
 * // isWork: true 是否启用引导系统
 * 
 * // 代码调用示例：
 * // 检查是否完成某个引导步骤
 * if (YJGuideManager.ins.finished('battle_guide')) {
 *     this.startBattle();
 * }
 * // 手动触发引导步骤检查
 * YJGuideManager.ins.check('main_quest_step3');
 */
export class YJGuideManager extends Component {
    /** 
     * 引导配置文件路径 
     * @description 支持两种格式：
     * 1. 完整路径：'db://assets/config/guide.json'
     * 2. 配置表key：直接通过no.dataCache获取已加载的配置
     */
    @property({ tooltip: '配置路径，可为配置文件路径或key，如果为key则直接通过no.dataCache获得' })
    jsonPath: string = '';

    /** 
     * 引导主窗口预制体类名 
     * @example 'prefabs/GuidePanel' 对应引导用UI面板的预制体路径
     */
    @property({ displayName: '引导主窗口类名' })
    guidePanel: string = '';
    @property({ displayName: '是否GuiPanel' })
    isGuiPanel: boolean = false;

    /** 是否启用引导系统 */
    @property({ tooltip: '总开关，控制整个引导系统是否工作' })
    isWork: boolean = true;

    @property({ displayName: '缓存key' })
    cacheKey: string = 'guide_steps';

    /** 已完成的引导步骤记录（持久化存储） 
     * @example ['step1_start', 'step2_dialog'] 表示已完成这两个步骤
     */
    public saveSteps: string[] = [];

    // 单例实例
    private static _ins: YJGuideManager;

    /** 单例访问点 */
    public static get ins(): YJGuideManager {
        return this._ins;
    }

    // 引导配置数据缓存
    private _config: any;

    /**
     * 组件加载时初始化
     * @description 初始化流程：
     * 1. 建立单例实例
     * 2. 加载引导配置表
     * 3. 初始化完成步骤记录
     */
    onLoad() {
        YJGuideManager._ins = this;
        if (this.isWork && this.jsonPath == '') {
            console.error('新手引导配置不可为空！');
            return;
        }
        // 处理配置文件路径（移除资源前缀和扩展名）
        // let path = this.jsonPath.replace('db://assets/', '').replace('.json', '');
        const path = this.jsonPath;
        // 异步加载配置文件
        no.assetBundleManager.loadJSON(path, item => {
            // 缓存配置数据
            this._config = item.json;
            item.decRef(); // 释放资源引用
        });
        // 初始化完成步骤记录
        this.saveSteps = no.dataCache.getLocal(this.cacheKey, []);
    }

    /** 组件销毁时清理单例 */
    onDestroy() {
        YJGuideManager._ins = null;
    }

    /**
     * 保存引导步骤
     * @param steps 要保存的步骤ID 
     * @example 
     * // 保存步骤ID为'shop_first_buy'
     * this.save('shop_first_buy');
     */
    public save(steps: string) {
        no.addToArray(this.saveSteps, steps);
    }

    /**
     * 获取引导配置信息
     * @param path 配置路径（支持点语法）
     * @returns 配置数据
     * @example
     * // 获取step1的配置
     * const stepConfig = getGuideInfo('guide_config.step1');
     */
    public getGuideInfo(path: string): any {
        return no.getValue(this._config, path);
    }

    /**
     * 检查是否需要触发引导
     * @param step 要检查的步骤ID
     * @returns 是否需要触发引导（true表示需要触发）
     * @description 检查逻辑：
     * 1. 系统未启用直接返回false
     * 2. 步骤已完成返回false
     * 3. 创建引导面板并返回true
     * @example
     * // 在打开商店时检查是否需要触发引导
     * if (YJGuideManager.ins.check('shop_first_open')) {
     *     this.showShopGuide();
     * }
     */
    public check(step: string): boolean {
        if (!this.isWork) return false;
        const pre_step = this.getGuideInfo('guide_config.' + step).pre_id;
        if (this.saveSteps.includes(step) || (pre_step && !this.saveSteps.includes(pre_step))) return false;
        if (!this.isGuiPanel) {
            YJWindowManager.createPanel(this.guidePanel, null, (panel: any) => {
                panel.curStep = step;
            });
        } else {
            GuiManager.createPanel<GuiGuidePanel>(this.guidePanel, 'dialog', null, (panel: GuiGuidePanel) => {
                panel.curStep = step;
            });
        }
        return true;
    }

    /**
     * 判断指定引导步骤是否已完成
     * @param step 引导步骤ID
     * @returns 是否已完成
     * @example
     * // 检查新手战斗引导是否完成
     * const isFinished = finished('battle_tutorial');
     */
    public finished(step: string): boolean {
        return this.saveSteps.indexOf(step) != -1;
    }

    /**
     * 获得有效引导步骤ID（处理步骤链）
     * @param step 起始步骤ID
     * @returns 实际需要执行的步骤ID（空字符串表示无需引导）
     * @description 处理逻辑：
     * 1. 如果当前步骤已完成，检查其后续步骤
     * 2. 递归查找第一个未完成的步骤
     * 3. 遇到不保存的步骤类型（save_type=0）则终止
     * @example
     * // 处理步骤链 step1 -> step2 -> step3
     * const validStep = getValidStep('step1'); // 返回第一个未完成的步骤
     */
    public getValidStep(step: string): string {
        if (!this.isWork) {
            return "";
        }
        step = step?.toString();
        let len = this.saveSteps.length;
        for (let i = 0; i < len; i++) {
            this.saveSteps[i] = this.saveSteps[i]?.toString();
        }
        if (this.saveSteps.indexOf(step) != -1) {
            let next = this.getGuideInfo(`guide_config.${step}`);
            if (next && next.save_type == 0) {
                return "";
            }
            if (next && next.next_id) {
                return this.getValidStep(next.next_id);
            }
        }
        return step;
    }

    /** 是否是首次引导（从未完成过任何步骤） */
    public get isFirst(): boolean {
        if (!this.isWork) return false;
        return this.saveSteps.length == 0;
    }

    /**
     * 测试方法（开发时使用）
     * @param step 要测试的步骤ID
     * @example
     * // 在控制台直接测试步骤
     * YJGuideManager.ins.test('debug_step');
     */
    public test(step: string) {
        if (!this.isWork) return;
        YJWindowManager.createPanel(this.guidePanel, null, (panel: any) => {
            panel.curStep = step;
        });
    }
}

if (DEBUG) {
    window['YJGuideManager'] = YJGuideManager;
}