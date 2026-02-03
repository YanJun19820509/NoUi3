
import { EDITOR, ccclass, property, executeInEditMode, instantiate, Node, Size, size } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { HackUi } from './HackUi';
import { SetCreateNode } from './SetCreateNode';
import { no } from '../no';
import { YJDataWork } from '../base/YJDataWork';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { YJPageView } from '../fix/YJPageView';
import { TweenSetPlay, parseTweenData } from '@hackUi/extend/TweenSet';

/**
 * Predefined variables
 * Name = SetPage
 * DateTime = Mon Jan 17 2022 12:00:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPage.ts
 * FileBasenameNoExtension = SetPage
 * URL = db://assets/Script/NoUi3/ui/SetPage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPage')
@executeInEditMode()
/**
 * 分页管理器
 * 功能：
 * 1. 根据数据动态创建/删除页面
 * 2. 支持异步加载资源和预制体
 * 示例用法：
 * data:{
 * list?:any[],//所有页面数据
 * show?:number,//显示第n个页面
 * remove?:number,//删除第n个页面
 * }
 */
export class SetPage extends HackUi {
    @property(YJPageView)
    pageView: YJPageView = null;
    @property({ type: YJLoadPrefab, displayName: '页面', tooltip: '需要挂载SetCreateNode组件' })
    pagePrefab: YJLoadPrefab = null;
    @property(Node)
    template: Node;
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;


    private itemSize: Size = size(); // 通过preInitItems计算的元素实际尺寸
    // private contentSize: number; // 主轴方向尺寸（横向=宽，纵向=高）
    private _loaded: boolean = false; // 资源加载完成标记
    // private pageViewContent: Node; // 滚动视图内容节点缓存
    // private isVertical: boolean; // 滚动方向缓存
    private listData: any[]; // 当前列表数据（支持数组/对象）
    // private lastIndex: number = 0; // 最后元素位置（横向=x，纵向=y）
    // private content: Node = null;
    // private showMax: number = 3;
    // private showNum: number;    // 可视区域最大显示数量
    // private allNum: number;     // 总数据量
    private _isFirst: boolean = false; // 是否第一个

    private _defaultTurningTime: number;

    /**
     * 数据变更处理入口
     * @param data 支持两种操作类型：
     * - 对象：创建新页面
     * - 数字：删除指定索引页面
     * @example 
     * // 创建3个页面后删除第2个
     * onDataChange([{a:1}, {b:2}, {c:3}, 1]); 
     */
    protected async onDataChange(data: any) {
        const { list, show, turningTime, remove } = data;
        if (list) {
            if (list.length == 0) {
                this._clear();
            } else {
                // 预加载预制体模板
                await this.initTemplate();
                // 初始化列表容器尺寸（当数据量变化时）
                // if (this.allNum != data.length) {
                //     this.allNum = data.length;
                //     this.showNum = Math.min(this.showMax, this.allNum);
                //     this.initItems();
                // }
                this.listData = list;
                this.setPages(show || 0);
            }
            this.clearDataValue(`${this.bind_keys}.list`);
            this.clearDataValue(`${this.bind_keys}.show`);
            this.clearDataValue(`${this.bind_keys}.turningTime`);
        } else if (show != undefined) {
            this.showPage(show, turningTime);
            this.clearDataValue(`${this.bind_keys}.show`);
            this.clearDataValue(`${this.bind_keys}.turningTime`);
        } else if (remove != undefined) {
            this._remove(remove);
            this.clearDataValue(`${this.bind_keys}.remove`);
        }
    }

    /**
     * 批量处理页面操作
     * @param data 操作队列，使用任务管理器分帧处理
     */
    private setPages(show: number) {
        let n = this.listData.length;
        this.pageView.initPageView(n, show);
        this.pageView.markNotUpdatePageView();
        let idxes: number[] = [];
        let i = 0;
        for (; i < n; i++) {
            idxes.push(i);
        }
        if (show > 0) {
            idxes.splice(show, 1);
            idxes.unshift(show);
            this.pageView.moveToPage(show);
        }
        i = 0;
        this._isFirst = true;
        this.schedule(() => this.setPage(idxes[i++]), 0.06, n - 1);
    }

    private showPage(i: number, turningTime?: number) {
        if (this._defaultTurningTime == null) this._defaultTurningTime = this.pageView.pageTurningSpeed;
        if (turningTime != null) this.pageView.pageTurningSpeed = turningTime;
        else this.pageView.pageTurningSpeed = this._defaultTurningTime;
        // 如果节点不存在则创建新节点
        if (this.pageView.getPages().length <= i) {
            this.pageView.markUpdatePageView();
            this.setPage(i);
            no.scheduleOnce(() => this.pageView.scrollToPage(i, this.pageView.pageTurningSpeed), 0.06, this)
        } else
            this.pageView.scrollToPage(i, this.pageView.pageTurningSpeed);
    }

    /**
     * 创建单个页面
     * @param data 页面数据对象
     * @example
     * setPage({ title: "新页面", content: "..." });
     */
    private setPage(i: number) {
        if (i >= this.listData.length) return;
        // 实例化模板节点并设置基础属性
        const node = instantiate(this.template);
        no.position(node, { x: 0, y: 0 });  // 重置位置

        // 创建容器节点并配置尺寸
        const box = no.newNode('box');
        no.size(box, this.itemSize);  // 设置容器尺寸

        // 同步锚点配置
        const a = no.anchor(node);
        no.anchor(box, a.x, a.y);  // 保持与模板相同的锚点

        // 构建节点层级
        box.addChild(node);  // 将模板节点放入容器
        // box.parent = this.content;  // 挂载到滚动容器
        this.pageView.insertPage(box, i);

        // 绑定数据（当数据存在时）
        this.setItemData(box, this.listData[i]);

        if (this._isFirst) {
            this._isFirst = false;
            if (this.uiAnim?.enabled) {
                // 播放预设动画
                this.uiAnim.playOtherNode(box.children[0]);
            } else {
                // 首次创建时播放默认缩放动画
                TweenSetPlay(parseTweenData([
                    {
                        set: 1,
                        props: { scale: [.8, .8] }  // 初始状态
                    }, {
                        duration: .1,
                        to: 1,
                        props: { scale: [1, 1] }  // 动画终点
                    }
                ], box.children[0]));
            }
        }
    }

    /// 页面删除操作 ///
    private _remove(index: number) {
        this.pageView?.removePageAtIndex(index);
    }

    /// 清空所有页面 ///
    private _clear() {
        this.pageView?.removeAllPages();
    }

    private async initTemplate() {
        if (this._loaded) return;
        this._loaded = true;
        // 加载预制体模板
        if (!this.template) {
            this.template = await this.pagePrefab.loadPrefab();
            if (!this?.node?.isValid) return;
        }

        // 计算模板元素实际尺寸
        this.itemSize = no.size(this.template);
    }

    private setItemData(item: Node, data: any) {
        if (data == null) {
            no.visible(item.children[0], false);
            return;
        } else {
            no.visible(item.children[0], true);
        }
        // 尝试获取YJDataWork组件
        let dataWork = item.children[0].getComponent(YJDataWork);
        if (dataWork) {
            dataWork.clear().initWithData(data);
        }
        else {
            // 备选获取SetCreateNode组件
            let setNode = item.children[0].getComponent(SetCreateNode);
            if (setNode)
                setNode.a_setData(data);
        }
    }

    ////////////////// 编辑器专用方法 ////////////////
    onLoad() {
        super.onLoad();
        if (!EDITOR) return;

        // 编辑器模式下自动获取组件引用
        if (!this.pageView) this.pageView = this.getComponent(YJPageView);
    }
}
