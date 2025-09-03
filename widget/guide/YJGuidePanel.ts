
import { ccclass, property, Node } from '../../yj';
import YJLoadPrefab from '../../base/node/YJLoadPrefab';
import { YJPanel } from '../../base/node/YJPanel';
import { YJDataWork } from '../../base/YJDataWork';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
import { no } from '../../no';
import { YJGuideManager } from './YJGuideManager';
import { panelPrefabPath } from '../../types';

/**
 * Predefined variables
 * Name = YJGuidePanel
 * DateTime = Mon May 16 2022 09:24:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGuidePanel.ts
 * FileBasenameNoExtension = YJGuidePanel
 * URL = db://assets/common/widget/guide/YJGuidePanel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJGuideTypeInfo')
export class YJGuideTypeInfo {
    @property(YJLoadPrefab)
    loadPrefab: YJLoadPrefab = null;
    @property
    type: string = '';
}

@ccclass('YJGuidePanel')
@panelPrefabPath('db://assets/common/widget/guide/guidePanel.prefab')
/**
 * 新手引导面板基类
 * @example
 * // 编辑器配置示例：
 * // dataWork: 绑定到负责引导步骤数据控制的YJDataWork组件
 * // guideTypes: 配置不同引导类型对应的预制体加载器（如对话框引导、箭头指引等）
 * // container: 指定引导元素的父节点容器
 * 
 * // 代码调用示例：
 * // 通过静态方法触发下一步引导
 * YJGuidePanel.next();
 * // 检查是否正在引导中
 * if (YJGuidePanel.isGuiding) return;
 */
export class YJGuidePanel extends YJPanel {
    /** 数据驱动组件，用于控制引导步骤的显示逻辑 */
    @property(YJDataWork)
    dataWork: YJDataWork = null;

    /** 引导类型配置数组（每种引导类型对应一个预制体加载器） */
    @property(YJGuideTypeInfo)
    guideTypes: YJGuideTypeInfo[] = [];

    /** 引导元素的父节点容器 */
    @property(Node)
    container: Node = null;

    /** 当前引导步骤ID */
    public curStep: string;
    /** 单例实例 */
    private static _ins: YJGuidePanel;
    /** 已加载的引导节点缓存（类型为键，节点为值） */
    private guideNodeMap: Object;
    /** 是否正在引导中 */
    protected isGuiding: boolean = false;

    onLoad() {
        super.onLoad();
        YJGuidePanel._ins = this;
    }

    onDestroy() {
        YJGuidePanel._ins = null;
    }

    /**
     * 面板加载完成回调
     * @description 初始化引导节点缓存并开始引导流程
     */
    protected onLoadPanel() {
        this.guideNodeMap = this.guideNodeMap || {};
        this.setGuide();
    }

    /**
     * 关闭面板时回调
     * @description 重置引导状态并移除所有事件监听
     */
    protected onClosePanel() {
        this.isGuiding = false;
        no.evn.targetOff(this);
    }

    /**
     * 获取当前引导步骤信息（需子类实现）
     * @returns 当前步骤的配置数据
     * @example
     * // 子类实现示例：
     * protected guideInfo() {
     *     return YJGuideManager.ins.getStepConfig(this.curStep);
     * }
     */
    protected guideInfo(): any {
        // 需子类实现具体逻辑
    }

    /**
     * 设置当前引导步骤
     * @description 处理引导逻辑：
     * 1. 设置锁定状态
     * 2. 保存进度（如果需要）
     * 3. 处理事件监听或显示引导界面
     */
    protected async setGuide() {
        let info = this.guideInfo();
        // 设置锁定状态（当lock=1时禁止其他操作）
        this.dataWork.setValue('lock', info.lock == 1);
        // 如果需要持久化保存进度
        if (info.save) YJGuideManager.ins.save(info.save);

        if (info.event) {
            // 显示对应类型的引导节点
            this.showGuideNode(info.type);
            // 等待指定事件触发
            if (info.content) {
                // 等待事件携带特定值（例如需要玩家达到指定等级）
                await no.waiForEventValueEqual(info.event, info.content, this);
            } else {
                // 等待普通事件触发（例如点击某个按钮）
                await no.waitForEvent(info.event, this);
            }
            if (!this?.node?.isValid) return;
            this.nextStep();
        } else {
            // 直接显示引导界面（例如剧情对话）
            this.showGuide(info);
        }
    }

    /**
     * 显示指定类型的引导界面
     * @param info 引导配置数据 
     * @description 处理流程：
     * 1. 检查是否已缓存对应类型的节点
     * 2. 未缓存时加载预制体并初始化
     * 3. 初始化数据驱动组件
     * 4. 显示对应类型的引导节点
     */
    protected async showGuide(info: any) {
        if (!this?.node?.isValid) return;
        let guideNode: Node = this.guideNodeMap[info.type];

        if (!guideNode) {
            // 获取对应引导类型的配置
            let a = no.itemOfArray<YJGuideTypeInfo>(this.guideTypes, info.type, 'type');
            // 加载预制体
            guideNode = await a.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
            // 加载附加资源（如图片、音效等）
            if (guideNode.getComponent(YJLoadAssets))
                await guideNode.getComponent(YJLoadAssets).load();
            if (!this?.node?.isValid) return;
            // 挂载到容器节点
            guideNode.parent = this.container;
            this.guideNodeMap[info.type] = guideNode;
        }

        // 初始化数据绑定
        let b = guideNode.getComponent(YJDataWork);
        b.clear().initWithData(info);
        this.showGuideNode(info.type);
    }

    /**
     * 显示指定类型的引导节点
     * @param type 引导类型 
     * @description 遍历所有已加载的引导节点，只显示匹配类型的节点
     */
    protected showGuideNode(type: string) {
        for (let k in this.guideNodeMap) {
            if (this.onShowGuideNode(k)) {
                // 使用no.visible代替直接设置active属性，兼容更多显示控制逻辑
                no.visible(this.guideNodeMap[k], k == type);
            }
        }
    }

    /**
     * 判断是否允许显示某个类型的引导节点
     * @param type 引导类型
     * @returns 默认返回true，子类可重写实现条件判断
     * @example
     * // 子类重写示例：特定类型只在白天显示
     * protected onShowGuideNode(type: string) {
     *     if(type === 'night_guide') return isNightTime;
     *     return true;
     * }
     */
    protected onShowGuideNode(type: string): boolean {
        return true;
    }

    /**
     * 进入下一步引导
     * @description 根据配置决定跳转到下一步或结束引导
     */
    protected nextStep() {
        let info = this.guideInfo();
        if (info.next_id) {
            // 存在后续步骤时更新当前步骤ID并继续引导
            this.curStep = info.next_id;
            this.setGuide();
        } else {
            // 没有后续步骤时关闭面板
            this.closePanel();
        }
    }

    /**
     * 静态方法触发下一步引导
     * @example
     * // 在按钮点击事件中调用：
     * YJGuidePanel.next();
     */
    public static next(): void {
        this._ins?.nextStep();
    }

    /**
     * 是否正在引导中（静态访问）
     */
    public static get isGuiding(): boolean {
        return !!this._ins?.isGuiding;
    }

    /**
     * 隐藏所有引导节点
     * @description 用于紧急重置界面状态或异常处理
     * @example
     * // 当游戏暂停时强制隐藏所有引导：
     * YJGuidePanel._ins?.hideAllGuideNodes();
     */
    public hideAllGuideNodes() {
        for (let k in this.guideNodeMap) {
            no.visible(this.guideNodeMap[k], false);
        }
    }
}
