
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { ccclass, executeInEditMode, instantiate, math, property, UITransform, v3, Vec3, Node } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetCreateNodeInCircle
 * DateTime = Mon Jan 30 2023 16:47:50 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeInCircle.ts
 * FileBasenameNoExtension = SetCreateNodeInCircle
 * URL = db://assets/NoUi3/HackUi/SetCreateNodeInCircle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('CirclePositionInfo')
export class CirclePositionInfo {
    @property
    pos: Vec3 = v3();
    @property
    rotation: number = 0;
}
//创建圆形分布的节点
@ccclass('SetCreateNodeInCircle')
export class SetCreateNodeInCircle extends HackUi {
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;
    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    @property({ displayName: '起始角度' })
    startRotation: number = 0;
    @property({ displayName: '半径', min: 1 })
    radius: number = 0;
    @property({ displayName: '创建数量', min: 1, step: 1 })
    num: number = 1;
    @property({ displayName: '旋转子节点' })
    spinSub: boolean = true;
    @property({ displayName: '计算' })
    get run(): boolean {
        return false;
    }
    set run(v: boolean) {
        if (!this.container) return;
        const size = this.container.getComponent(UITransform).contentSize;
        const anchor = this.container.getComponent(UITransform).anchorPoint;
        this.posInfos.length = 0;
        const a = 360 / this.num, b = Math.PI / 180;
        const center = math.v2(size.width * (0.5 - anchor.x), size.height * (0.5 - anchor.y));
        for (let i = 0; i < this.num; i++) {
            let pi = new CirclePositionInfo();
            let ro = this.startRotation + a * i;
            pi.pos.x = this.radius * Math.sin(b * ro) + center.x;
            pi.pos.y = this.radius * Math.cos(b * ro) + center.y;
            pi.rotation = - ro;
            this.posInfos[this.posInfos.length] = pi;
        }
    }
    @property({ type: CirclePositionInfo, readonly: true })
    posInfos: CirclePositionInfo[] = [];
    @property({ displayName: '预览' })
    get preview() {
        return false;
    }
    set preview(v: boolean) {
        if (!this.template) return;
        this.container.removeAllChildren();
        for (let i = 0; i < this.num; i++) {
            let item = instantiate(this.template);
            this.setPos(item, i);
            item.parent = this.container;
            item.active = true;
        }
    }

    // ================== 效果相关 ==================
    /** 
     * 节点创建动画组件
     * @example 可配置淡入、缩放等入场动画效果
     */
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;/** 
    * 节点创建完成事件回调
    * @example 可用于：
    * - 播放音效
    * - 更新界面计数
    * - 触发后续流程
    */
    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];

    onDestroy() {
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    protected async onDataChange(data: any) {
        if (!this.container) this.container = this.node;
        if (!this.template) {
            this.template = await this.loadPrefab?.loadPrefab();
        }
        this.setItems([].concat(data));
    }

    protected setItems(data: any[]) {
        let l = this.container.children.length;
        if (l == 0) {
            for (let i = 0; i < this.num; i++) {
                let item = instantiate(this.template);
                this.setPos(item, i);
                item.parent = this.container;
            }

            l = this.num;
        }
        for (let i = 0; i < l; i++) {
            let item = this.container.children[i];
            if (data[i] == null) {
                item.active = false;
            } else {
                let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                a?.clear().initWithData(data[i]);
                item.active = true;
                if (this.uiAnim?.enabled) {
                    this.uiAnim.playOtherNode(item);
                }
            }
        }
        no.EventHandlerInfo.execute(this.onComplete);
    }

    private setPos(item: Node, idx: number) {
        item.setPosition(this.posInfos[idx].pos);
        if (this.spinSub)
            item.angle = this.posInfos[idx].rotation;
    }
}

