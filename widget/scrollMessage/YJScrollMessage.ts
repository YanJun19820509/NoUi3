import { YJPanel } from '../../base/node/YJPanel';
import { YJWindowManager } from '../../base/node/YJWindowManager';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
import { addPanelTo, panelPrefabPath } from '../../types';
import { ccclass, property, Node, view } from '../../yj';

/**
 * 跑马灯
 * Author mqsy_yj
 * DateTime Tue Dec 19 2023 17:52:00 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJScrollMessage')
@addPanelTo('mess')
@panelPrefabPath('db://assets/common/widget/scrollMessage/scroll_message.prefab')
/**
 * 跑马灯消息组件
 * 支持持续滚动显示多条消息，可控制消息插入位置（队首/队尾）
 * @example
 * // 基础使用示例：
 * // 显示单条消息（默认追加到队尾）
 * YJScrollMessage.show('新邮件到达！');
 * 
 * // 显示多条消息并优先显示
 * YJScrollMessage.show(['系统维护通知', '版本更新内容'], true);
 * 
 * // 监听消息显示状态
 * no.EventHandlerInfo.add(this.node, 'YJScrollMessage', 'show', (isShow) => {
 *     cc.log(`跑马灯${isShow ? '开始' : '结束'}显示`);
 * });
 */
export class YJScrollMessage extends YJPanel {
    /** 消息滚动容器节点 */
    @property(Node)
    container: Node = null;
    /** 消息项预制体节点 */
    @property(Node)
    msgItem: Node = null;
    /** 消息滚动速度（像素/秒） */
    @property({ displayName: '每秒移动距离', tooltip: '控制消息滚动速度，值越大移动越快' })
    speed: number = 100;

    /** 待显示消息队列 */
    private _list: string[] = [];
    /** 容器半宽（用于计算滚动终点） */
    private containerWidth: number;
    /** 消息项初始X坐标（屏幕右侧外） */
    private startX: number;
    /** 滚动状态标记 */
    private moving: boolean = false;
    /** 单例实例引用 */
    private static _ins: YJScrollMessage;

    /**
     * 显示跑马灯消息
     * @param msgs 要显示的消息内容（支持字符串或数组）
     * @param top 是否优先显示（true插入队首，false追加队尾）
     * @example
     * // 紧急消息插队示例：
     * YJScrollMessage.show('服务器即将重启！', true);
     */
    public static show(msgs: string | string[], top = false) {
        if (!this._ins) {
            // 首次调用时创建面板
            YJWindowManager.createPanel<YJScrollMessage>(YJScrollMessage, 'mess', null, panel => {
                panel.setInfo(msgs, top);
            });
        } else {
            // 已有实例直接设置消息
            this._ins.setInfo(msgs, top);
        }
    }

    /** 组件加载时初始化 */
    onLoad() {
        YJScrollMessage._ins = this;
        // 计算容器半宽和初始位置
        this.containerWidth = no.width(this.container) / 2;
        this.startX = view.getVisibleSize().width / 2;
    }

    /** 组件销毁时清理单例引用 */
    onDestroy() {
        YJScrollMessage._ins = null;
    }

    /**
     * 设置消息内容
     * @param msgs 消息内容
     * @param top 是否插入队列前端
     */
    public setInfo(msgs: string | string[], top: boolean) {
        // 根据插入位置处理消息队列
        this._list = top ? 
            [].concat(msgs, this._list) :  // 插入队首
            [].concat(this._list, msgs);   // 追加队尾
        
        if (this.moving) return; // 已有滚动进行中则等待
        
        this.moving = true; // 标记滚动开始
        this.setMsgItem();  // 启动第一条消息
    }

    /** 设置当前滚动消息项 */
    private setMsgItem() {
        // 初始化消息项位置
        no.x(this.msgItem, this.startX);
        
        // 从队列取出下一条消息
        const msg = this._list.shift();
        if (!msg) {
            // 队列为空时结束滚动
            this.moving = false;
            this.dataWork.setValue('show', false);
            return;
        }
        
        // 设置消息内容并延迟启动滚动
        this.msgItem.getComponent(YJDataWork).data = { msg: msg };
        this.scheduleOnce(this.move, .1); // 延迟0.1秒确保UI更新
    }

    /** 执行滚动动画 */
    private move() {
        // 计算滚动终点位置和所需时间
        const end = -no.width(this.msgItem) - this.containerWidth;
        const duration = -end / this.speed; // 根据速度计算持续时间
        
        // 启动移动动画
        this.msgItem.getComponent(YJDataWork).setValue('move', {
            duration: duration,
            to: 1,
            props: {
                pos: [end, 0] // X轴移动到终点，Y轴不变
            }
        });
        
        // 显示容器并计划下一条消息
        this.dataWork.setValue('show', true);
        this.scheduleOnce(this.setMsgItem, duration + .1); // 动画结束后间隔0.1秒播放下一条
    }
}