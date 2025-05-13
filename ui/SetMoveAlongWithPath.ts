
import { ccclass, property, menu, v3, Vec2, Vec3, game } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJMoveAlongWithPathDelegate } from './YJMoveAlongWithPathDelegate';

/**
 * Predefined variables
 * Name = SetMoveAlongWithPath
 * DateTime = Mon Jan 17 2022 11:49:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetMoveAlongWithPath.ts
 * FileBasenameNoExtension = SetMoveAlongWithPath
 * URL = db://assets/Script/common/ui/SetMoveAlongWithPath.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* 沿路线移动的代理
*/
@ccclass('SetMoveAlongWithPath')
@menu('NoUi/ui/SetMoveAlongWithPath(设置沿路线移动:{speed:number, paths:[Vec2]})')
/**
 * 沿路线移动的代理
 * 
 * 功能说明：
 * - 管理沿路线移动的逻辑
 * - 支持速度控制和路径管理
 * - 提供暂停/恢复移动功能
 * 
 */
export class SetMoveAlongWithPath extends HackUi {

    @property({ displayName: '是否循环' })
    circular: boolean = false;
    /**
     * @example
     * // 设置是否循环移动：
     * // true - 到达终点后重新开始移动
     * // false - 到达终点后停止移动
     */

    @property(YJMoveAlongWithPathDelegate)
    delegate: YJMoveAlongWithPathDelegate = null;
    /**
     * @example
     * // 代理使用示例：
     * // 实现onStart/onEnd等回调方法处理移动事件
     * // 在onSpecialStep中处理特殊路径点逻辑
     */

    private paths: Vec2[];            // 移动路径坐标数组（世界坐标系）
    public speed: number;             // 当前移动速度（像素/秒）
    private originSpeed: number;      // 初始移动速度（用于速度变化后恢复）
    private step: number;             // 当前路径点索引
    private paused: boolean = false;  // 是否暂停移动
    private moveDuration: number = 0; // 当前段移动预计耗时（秒）
    private moveVector: Vec3;         // 移动方向向量（包含速度分量）
    public speedChanged: boolean = false; // 速度是否被临时修改

    /**
     * 处理数据变更
     * @param data 配置数据 {speed: number, paths: {[key:string]: Vec2[]}}
     * @example
     * // 设置移动参数：
     * component.a_setData({
     *   speed: 200,
     *   paths: {
     *     path1: [new Vec2(0,0), new Vec2(100,100)],
     *     path2: [new Vec2(100,100), new Vec2(200,0)]
     *   }
     * })
     */
    protected onDataChange(data: any) {
        // 更新移动速度
        if (data.speed != null) {
            this.speed = data.speed;
            this.originSpeed = data.speed; // 保存原始速度用于重置
        }
        
        // 更新移动路径
        if (data.paths != null) {
            // 获取所有路径的键名
            const pathKeys = Object.keys(data.paths);
            // 随机选择一条路径（当存在多条时）
            const randomIndex = no.floor(Math.random() * pathKeys.length);
            this.paths = data.paths[pathKeys[randomIndex]] as Vec2[];
            this.startMove(); // 开始新的移动
        }
    }

    /**
     * 执行单段移动逻辑
     * @流程说明
     * 1. 获取当前节点位置和目标路径点
     * 2. 计算移动时间和方向向量
     * 3. 触发方向改变回调
     * 4. 启动动画帧更新
     * @示例
     * // 当移动到索引1的路径点时：
     * // 计算从起点到path[1]的移动向量和耗时
     * // 通过requestAnimationFrame实现平滑移动
     */
    private move(): void {
        const currentPos = this.node.position;
        const targetPoint = this.paths[this.step];
        
        // 终点处理逻辑
        if (targetPoint == null) {
            this.delegate?.onEnd(); // 触发结束回调
            // 循环移动处理
            if (this.circular) {
                this.scheduleOnce(() => {
                    this.startMove(); // 1秒后重新开始移动
                }, 1);
            }
            return;
        }
        
        // 特殊路径点处理（由代理决定是否跳过）
        if (this.delegate?.onSpecialStep(targetPoint)) return;
        
        // 计算移动参数
        const targetPos = v3(targetPoint.x, targetPoint.y);
        this.moveDuration = Vec3.distance(currentPos, targetPos) / this.speed;
        // 计算方向向量（包含速度分量）
        this.moveVector = targetPos.clone()
            .subtract(currentPos)
            .divide3f(this.moveDuration, this.moveDuration, this.moveDuration);
        
        // 触发方向改变回调
        this.delegate?.onChangeDirection(currentPos, targetPos, this.moveVector);
        // 启动动画更新
        this.requestAnimationFrameMove();
    }

    /**
     * 初始化并开始路径移动
     * @流程说明
     * 1. 重置暂停状态
     * 2. 将节点定位到路径起点
     * 3. 设置当前移动步数为第二步（路径数组索引1）
     * 4. 开始移动流程
     * 5. 当存在第二个路径点时触发开始回调
     * @示例
     * // 当路径为[A,B,C]时：
     * // 节点定位到A点，准备向B点移动
     * // 触发onStart回调通知移动开始
     */
    private startMove() {
        this.paused = false;
        this.node.position = v3(this.paths[0].x, this.paths[0].y);
        this.step = 1;
        this.move();
        this.paths[1] != null && this.delegate?.onStart(this);
    }

    /**
     * 暂停当前移动
     * @示例
     * // 游戏暂停时调用：
     * // 停止位置更新
     * // 触发onPause回调更新UI状态
     */
    public a_pauseMove(): void {
        this.paused = true;
        this.delegate?.onPause();
    }

    /**
     * 恢复被暂停的移动
     * @示例
     * // 游戏恢复时调用：
     * // 重新启动动画帧更新
     * // 触发onResume回调更新UI状态
     */
    public a_resumeMove(): void {
        this.paused = false;
        this.requestAnimationFrameMove();
        this.delegate?.onResume();
    }

    /**
     * 临时改变移动速度
     * @param sub 速度缩放系数（例如2表示双倍速度）
     * @param duration 效果持续时间（秒）
     * @流程说明
     * 1. 如果已有速度修改，只延长持续时间
     * 2. 计算新的移动速度和方向向量
     * 3. 记录修改参数用于后续恢复
     * @示例
     * // 加速道具生效时：
     * // a_changeSpeedForDuration(2, 5) 使速度翻倍5秒
     * // 移动时间减半，方向向量加倍
     */
    public a_changeSpeedForDuration(sub: number, duration: number) {
        if (this.speedChanged) {
            this.speedChangeDuration = duration;
            return;
        }
        this.speedChanged = true;
        let s = sub;
        this.speed = this.originSpeed * s;
        if (this.moveDuration > 0) {
            this.moveDuration *= 1 / s;
            this.moveVector.multiplyScalar(s);
        }
        this.speedChangeDuration = duration;
        this.speedChangeScale = s;
    }

    private speedChangeDuration: number = 0;
    private speedChangeScale: number;
    
    /**
     * 检测并处理速度修改结束
     * @param dt 帧时间差（秒）
     * @流程说明
     * 1. 倒计时持续时间
     * 2. 时间到后恢复原始速度
     * 3. 调整移动参数保持位置连续性
     */
    private checkSpeedChangeEnd(dt: number) {
        if (!this.speedChanged) return;
        if (this.speedChangeDuration > 0) {
            this.speedChangeDuration -= dt;
            return;
        }
        this.speed = this.originSpeed;
        if (this.moveDuration > 0) {
            this.moveDuration *= this.speedChangeScale;
            this.moveVector.multiplyScalar(1 / this.speedChangeScale);
        }
        this.speedChanged = false;
    }

    /**
     * 清除所有移动状态
     * @示例
     * // 角色死亡时调用：
     * // 重置移动参数
     * // 清空路径数据
     */
    public a_clear() {
        this.moveDuration = 0;
        this.moveVector = null;
        this.speedChanged = false;
        this.paths.length = 0;
    }

    /**
     * 强制进入下一个路径点
     * @示例
     * // 跳过当前障碍点时：
     * // 直接递增step索引
     * // 下次moveByFrame检测时会处理新目标点
     */
    public a_toNextStep() {
        this.step++;
    }

    /**
     * 按帧更新移动位置
     * @param dt 帧时间差（秒）
     * @流程说明
     * 1. 检查节点有效性
     * 2. 处理速度修改状态
     * 3. 更新节点位置
     * 4. 检测是否到达当前目标点
     * 5. 触发移动中回调
     */
    private moveByFrame(dt: number) {
        if (!no.checkValid(this.node)) return;
        this.checkSpeedChangeEnd(dt);
        if (this.paused || this.moveDuration <= 0) return;
        this.node.position = this.node.position.clone().add(this.moveVector.clone().multiplyScalar(dt));
        this.delegate?.onMoving(this);
        this.moveDuration -= dt;
        if (this.moveDuration <= 0) {
            this.delegate?.onReach(this.paths[this.step]);
            this.step++;
            this.move();
        } else {
            this.requestAnimationFrameMove();
        }
    }

    /**
     * 请求下一帧动画更新
     * @实现说明
     * 使用游戏引擎的时间系统转换帧时间
     * 保持60FPS下移动速度一致
     */
    private requestAnimationFrameMove() {
        requestAnimationFrame(() => {
            this?.moveByFrame(game.frameTime * .001);
        });
    }
}