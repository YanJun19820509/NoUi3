import { ccclass, property, Node, Vec2, v2, view } from '../../common/yj';
import { HackUi } from '../../common/ui/HackUi';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { nodeTargetManager } from '../NodeTargetManager';

/**
 * 相机跟随目标
 * Author mqsy_yj
 * DateTime Fri Jul 11 2025 11:35:26 GMT+0800 (中国标准时间)
 * data:string|{target:string,subTypes:string[]},目标节点标识符，子节点路径数组
 */

@ccclass('SetCameraFollowTarget')
export class SetCameraFollowTarget extends HackUi {
    @property({ type: Node, displayName: '边界节点', tooltip: '边界节点，用于限制相机移动范围' })
    boundaryNode: Node = null;
    /**
     * @example
     * // true - 根据距离和速度计算移动时间（移动时间 = 距离/速度）
     * // false - 直接使用指定的移动时间
     */
    @property({ displayName: '根据速度计算时间' })
    fixSpeed: boolean = true;

    /** 像素/秒，仅在fixSpeed为true时生效 */
    @property({ min: 1, displayName: '移动速度', tooltip: '移动速度', visible() { return this.fixSpeed; } })
    speed: number = 10;

    /** 固定移动时长，仅在fixSpeed为false时生效 */
    @property({ min: 0.01, displayName: '移动时间(s)', visible() { return !this.fixSpeed; } })
    time: number = 1;

    /** 
     * 目标位置偏移量 
     * @example
     * // 设置x:50,y:-30将在目标位置基础上向右偏移50像素，向下偏移30像素
     */
    @property
    offset: Vec2 = v2();

    @property({ type: no.EventHandlerInfo, displayName: '跟随开始前回调' })
    beforeCall: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '跟随完成回调' })
    endCall: no.EventHandlerInfo[] = [];

    private _cameraNode: Node;
    private _range: { xMin: number, xMax: number, yMin: number, yMax: number };
    private _followData: { duration: number, speed: number, radian: number };

    protected onDataChange(data: any) {
        if (this.boundaryNode && !this._range) {
            const viewSize = view.getVisibleSize();
            const size = no.size(this.boundaryNode);
            const width = (size.width - viewSize.width) / 2;
            const height = (size.height - viewSize.height) / 2;
            this._range = {
                xMin: -width,
                xMax: width,
                yMin: -height,
                yMax: height
            };
        }
        if (typeof data == 'string') {
            this.followTarget(data);
        } else if (typeof data == 'object') {
            const { target, subTypes } = data;
            this.followTarget(target, subTypes);
        }
    }

    private followTarget(targetType: string, subTypes?: string[]) {
        let target: YJNodeTarget;
        if (subTypes) {
            target = nodeTargetManager.getSub<YJNodeTarget>(targetType, subTypes);
        } else {
            target = nodeTargetManager.get<YJNodeTarget>(targetType);
        }
        if (!target) {
            // 目标节点未就绪时，延迟重试机制
            this.scheduleOnce(() => {
                this.followTarget(targetType, subTypes);
            });
            return;
        }
        const camera = no.getCamera(target.node.layer);
        if (!camera) {
            no.err('SetCameraFollowTarget 相机未找到');
            return;
        }
        this._cameraNode = camera.node;
        // 获取目标节点的世界坐标并转换为本地坐标系
        let pos = target.nodeWorldPosition;
        no.worldPositionInNode(pos, this.boundaryNode, pos);
        if (this._range) {
            pos.x = no.clamp(pos.x, this._range.xMin, this._range.xMax);
            pos.y = no.clamp(pos.y, this._range.yMin, this._range.yMax);
        }

        // 计算移动参数
        let p = this.node.position;
        let dis = no.distance(p, pos); // 三维空间距离计算
        let duration = this.fixSpeed ? dis / this.speed : this.time; // 持续时间计算策略
        const radian = no.angleTo(this._cameraNode.position, pos).radian;
        this._followData = { duration, speed: this.speed, radian };
    }

    lateUpdate(dt: number): void {
        if (!this._followData) return;
        const { duration, speed, radian } = this._followData;
        if (duration <= 0) {
            this._followData = null;
            return;
        }
        const p = this._cameraNode.position;
        const distance = speed * dt;
        const x = Math.cos(radian) * distance;
        const y = Math.sin(radian) * distance;
        this._cameraNode.setPosition(p.x + x, p.y + y);
        this._followData.duration -= dt;
    }
}
