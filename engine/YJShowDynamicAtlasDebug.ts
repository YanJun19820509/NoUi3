
import { ccclass, Node, ScrollView, Sprite, SpriteFrame, UITransform, Layers, find, instantiate } from '../yj';
import { no } from '../no';
import { Atlas } from './atlas';
import { YJWindowManager } from '../base/node/YJWindowManager';
import { YJPanel } from '../base/node/YJPanel';

/**
 * Predefined variables
 * Name = YJShowDynamicAtlasDebug
 * DateTime = Thu May 05 2022 18:29:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowDynamicAtlasDebug.ts
 * FileBasenameNoExtension = YJShowDynamicAtlasDebug
 * URL = db://assets/common/engine/YJShowDynamicAtlasDebug.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowDynamicAtlasDebug')
/**
 * 动态图集调试信息显示组件
 * @classdesc 
 * - 管理所有动态图集的调试信息
 * - 提供图集可视化调试界面
 * - 记录图集内存占用等关键指标
 * 
 * @property {Object.<string, Atlas>} list 图集实例映射表（key: 图集名称，value: Atlas实例）
 * @property {string[]} names 当前管理的图集名称数组（维护添加顺序）
 * @property {Node} _debugNode 调试显示节点（包含滚动视图和预览元素）
 * 
 * @example
 * // 在材质创建时注册到调试系统：
 * const atlas = new Atlas(2048, 2048, 'ui_main');
 * YJShowDynamicAtlasDebug.ins.add(atlas, 'ui_main');
 * 
 * // 在控制台查看图集内存占用：
 * YJShowDynamicAtlasDebug.ins.showDebug('ui_main');
 * // 输出结果示例：
 * // show atlas ui_main {width: 2048, height: 2048, mem: "16M"}
 */
export class YJShowDynamicAtlasDebug {
    /** 单例实例 */
    private static _ins: YJShowDynamicAtlasDebug;

    /**
     * 获取单例实例
     * @example
     * // 获取调试管理器单例：
     * const debugMgr = YJShowDynamicAtlasDebug.ins;
     */
    public static get ins(): YJShowDynamicAtlasDebug {
        if (!this._ins)
            this._ins = new YJShowDynamicAtlasDebug();
        return this._ins;
    }

    /** 图集实例映射表（key: 图集名称，value: Atlas实例） */
    private list: any;
    /** 调试显示节点（包含滚动视图和预览元素） */
    private _debugNode: Node;
    /** 当前管理的图集名称数组（维护添加顺序） */
    private names: string[];

    constructor() {
        this.list = {};
        this.names = [];
        // 注册关闭调试节点事件监听
        no.evn.on('close_dynamic_atlas_debug_node', () => {
            this._clearDebugNode();
        }, this);
    }

    /**
     * 添加图集到调试列表
     * @param a 图集实例
     * @param name 图集名称
     * @example
     * // 添加角色图集：
     * debugMgr.add(roleAtlas, 'characters');
     */
    public add(a: Atlas, name: string): void {
        if (!a || !name) return;
        this.list[name] = a;
        this.names[this.names.length] = name;
    }

    /**
     * 移除指定图集
     * @param name 要移除的图集名称
     * @example
     * // 移除过期的BOSS图集：
     * debugMgr.remove('boss_effect');
     */
    public remove(name: string): void {
        if (!name) return;
        delete this.list[name];
        this.names.splice(this.names.indexOf(name), 1);
    }

    /**
     * 显示指定图集的调试信息
     * @param name 要调试的图集名称（不传则显示最新图集）
     * @example
     * // 显示UI主图集：
     * debugMgr.showDebug('main_ui');
     * // 显示最新创建的图集：
     * debugMgr.showDebug();
     */
    public showDebug(name?: string) {
        if (!no.isDebug()) return;
        if (!name) {
            return;
        }
        let texture = this.list[name]?._texture;
        if (!texture) {
            no.warn('show atlas not found', name);
            return;
        }
        // 输出内存占用信息（包含宽高和内存大小）
        no.warn('show atlas', name, {
            width: texture.width,
            height: texture.height,
            mem: texture.width * texture.height * 4 / 1024 / 1024 + 'M'
        });
        if (!this._debugNode || !this._debugNode.isValid) {

            no.assetBundleManager.loadPrefab('HackUi/engine/dynamic_atlas_debug_node', item => {
                this._debugNode = instantiate(item);
                this._debugNode.parent = find('Canvas');
                let scrollView = this._debugNode.getComponentInChildren(ScrollView);

                // 设置滚动视图内容尺寸匹配图集
                no.width(scrollView.content, texture.width);
                no.height(scrollView.content, texture.height);

                // 创建图集预览节点
                let node = new Node('ATLAS');
                node.addComponent(UITransform).setAnchorPoint(0, 1);
                node.layer = Layers.Enum.UI_2D;
                no.width(node, texture.width);
                no.height(node, texture.height);
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                // 添加精灵组件显示图集
                let sprite = node.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;

                node.parent = scrollView.content;
            });
        }
    }

    /** 清除调试节点 */
    private _clearDebugNode() {
        if (this._debugNode) {
            this._debugNode.removeFromParent();
            this._debugNode = null;
        }
    }

    /**
     * 打印所有图集信息到控制台
     * @example
     * // 输出示例：
     * // [
     * //   {name: "main_ui", width: 2048, height: 2048, mem: "16M"},
     * //   {name: "effects", width: 1024, height: 1024, mem: "4M"}
     * // ]
     */
    public logInfos(): void {
        let infos = [];
        for (const key in this.list) {
            let a: Atlas = this.list[key];
            infos[infos.length] = {
                name: key,
                width: a._texture.width,
                height: a._texture.height,
                mem: a._texture.width * a._texture.height * 4 / 1024 / 1024 + 'M'
            };
        }
        // let keys = Object.keys(this.list);
        console.log(infos);
    }

    /**
     * 显示最新图集（智能匹配当前面板）
     * @returns 当前显示的图集名称
     * @example
     * // 当打开角色面板时自动显示角色相关图集
     * debugMgr.showNewestAtlas();
     */
    public showNewestAtlas(): any {
        const topPanel = YJWindowManager.getTopPanel(3);
        if (topPanel) {
            const name = no.getPrototype(topPanel.getComponent(YJPanel))?.name || topPanel.name;
            if (this.names.includes(name)) {
                this.showDebug(name);
                return;
            }
        }
        this.showDebug(this.names[this.names.length - 1]);
    }
}

window['showDynamicAtlas'] = function (name?: string) {
    YJShowDynamicAtlasDebug.ins.showDebug(name);
};

window['showDynamicAtlasInfos'] = function () {
    YJShowDynamicAtlasDebug.ins.logInfos();
};