
import { ccclass, property, executeInEditMode, EDITOR, Node, math, UITransform, instantiate, Vec3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJJobManager } from '../base/YJJobManager';

/**
 * Predefined variables
 * Name = SetCreateNodeInCircle
 * DateTime = Mon Jan 30 2023 16:47:50 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeInCircle.ts
 * FileBasenameNoExtension = SetCreateNodeInCircle
 * URL = db://assets/common/ui/SetCreateNodeInCircle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('CirclePositionInfo')
export class CirclePositionInfo {
    @property
    pos: Vec3 = math.v3();
    @property
    rotation: number = 0;
}
//创建圆形分布的节点
@ccclass('SetCreateNodeInCircle')
@executeInEditMode()
/**
 * 创建圆形分布的节点
 * @description 根据起始角度和半径，计算并设置节点在圆形上的位置和旋转角度
 * @example
 * // 在UI编辑器中配置：
 * // startRotation: 0
 * // radius: 100
 * // num: 6
 */
export class SetCreateNodeInCircle extends HackUi {
    // 预制体加载组件，用于动态加载节点模板
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;
    // 实际使用的节点模板（当预制体加载完成后自动赋值）
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;
    // 节点容器，用于存放生成的圆形排列节点
    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    // 起始角度（单位：度），0度对应正上方
    @property({ displayName: '起始角度' })
    startRotation: number = 0;
    // 分布半径（单位：像素）
    @property({ displayName: '半径', min: 1 })
    radius: number = 0;
    // 需要创建的节点总数
    @property({ displayName: '创建数量', min: 1, step: 1 })
    num: number = 1;

    // 计算按钮属性（仅在编辑器生效）
    @property({ displayName: '计算' })
    public get run(): boolean {
        return false;
    }

    /**
     * 计算圆形坐标信息
     * @param v 按钮触发值
     * @执行流程：
     * 1. 计算容器中心点坐标
     * 2. 根据数量和半径计算每个节点的位置和旋转角度
     * 3. 存储计算结果到posInfos数组
     * @示例 当num=6时，将生成正六边形布局坐标
     */
    public set run(v: boolean) {
        if (!this.container) return;
        const size = this.container.getComponent(UITransform).contentSize;
        const anchor = this.container.getComponent(UITransform).anchorPoint;
        this.posInfos.length = 0;
        const angleStep = 360 / this.num; // 角度间隔
        const radianFactor = Math.PI / 180; // 角度转弧度系数
        const center = math.v2(
            size.width * (0.5 - anchor.x),
            size.height * (0.5 - anchor.y)
        );

        // 计算每个节点的位置信息
        for (let i = 0; i < this.num; i++) {
            const positionInfo = new CirclePositionInfo();
            const currentAngle = this.startRotation + angleStep * i;
            
            // 计算极坐标转笛卡尔坐标
            positionInfo.pos.x = this.radius * Math.sin(radianFactor * currentAngle) + center.x;
            positionInfo.pos.y = this.radius * Math.cos(radianFactor * currentAngle) + center.y;
            positionInfo.rotation = -currentAngle; // 设置节点旋转角度
            
            this.posInfos.push(positionInfo);
        }
    }

    // 存储所有节点的位置/旋转信息
    @property({ type: CirclePositionInfo, readonly: true })
    posInfos: CirclePositionInfo[] = [];

    // 预览按钮属性（仅在编辑器生效）
    @property({ displayName: '预览' })
    public get preview(): boolean {
        return false;
    }

    /**
     * 在编辑器预览布局效果
     * @param v 按钮触发值
     * @功能说明：
     * - 实例化模板节点
     * - 设置节点位置和旋转
     * - 显示在容器中
     * @注意事项 仅用于编辑器快速布局验证
     */
    public set preview(v: boolean) {
        if (!this.template) return;
        for (let i = 0; i < this.num; i++) {
            const item = instantiate(this.template);
            this.setPos(item, i);
            item.parent = this.container;
            item.active = true;
        }
    }

    ///////////////////////////EDITOR///////////////
    /**
     * 组件加载时初始化
     * @编辑器专用逻辑：
     * - 自动获取YJLoadPrefab组件
     * - 设置默认容器为当前节点
     */
    onLoad() {
        super.onLoad();
        if (!EDITOR) return;
        
        if (!this.loadPrefab) 
            this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) 
            this.container = this.node;
    }

    /**
     * 组件销毁时清理资源
     * @注意事项 运行时需要销毁模板节点
     */
    onDestroy() {
        if (EDITOR) return;
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
    }

    /**
     * 数据变更处理
     * @param data 输入数据数组 
     * @示例 [ {id:1}, {id:2} ] 每个元素对应一个节点
     * @流程：
     * 1. 加载预制体模板
     * 2. 开始批量创建节点
     */
    protected async onDataChange(data: any) {
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
        }
        this.setItems([].concat(data));
    }

    /**
     * 批量设置节点
     * @param data 数据数组
     * @流程：
     * - 使用任务管理器分帧创建节点
     * - 避免一次性创建大量节点造成卡顿
     */
    protected async setItems(data: any[]) {
        const total = data.length;
        let index = 0;
        YJJobManager.ins.addTask(() => {
            this.setItem(data, index++);
            return index >= total;
        });
    }

    /**
     * 设置单个节点
     * @param data 数据数组
     * @param i 当前索引
     * @功能说明：
     * - 复用已有节点或创建新节点
     * - 隐藏无数据节点
     * - 绑定数据到YJDataWork组件
     */
    private setItem(data: any[], i: number) {
        let item = this.container.children[i];
        if (data[i] == null) {
            if (item) no.visible(item, false);
            return;
        }

        if (!item) {
            item = instantiate(this.template);
            this.setPos(item, i);
            item.parent = this.container;
            no.visible(item, true);
        }

        const dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (dataWork) {
            dataWork.initWithData(data[i]);
        }
    }

    /**
     * 设置节点位置和旋转
     * @param item 目标节点
     * @param idx 位置索引
     */
    private setPos(item: Node, idx: number) {
        item.setPosition(this.posInfos[idx].pos);
        item.angle = this.posInfos[idx].rotation;
    }
}

