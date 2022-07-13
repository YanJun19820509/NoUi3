
import { _decorator, Component, Node, Label } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetTypeWritting
 * DateTime = Wed Jul 13 2022 17:06:29 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTypeWritting.ts
 * FileBasenameNoExtension = SetTypeWritting
 * URL = db://assets/NoUi3/fuckui/SetTypeWritting.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 打字机组件
 * data: {
 *  content: string,
 *  stop?: boolean
 * }
 */
@ccclass('SetTypeWritting')
@requireComponent(Label)
export class SetTypeWritting extends FuckUi {
    @property({ displayName: '每秒打字个数' })
    speed: number = 3;
    @property(no.EventHandlerInfo)
    onStop: no.EventHandlerInfo[] = [];

    private _content: string[];

    protected onDataChange(data: any) {
        if (!data.stop) {
            this.getComponent(Label).string = '';
            this._content = String(data.content).split('');
            this.writing();
        } else {
            this.unscheduleAllCallbacks();
            this.getComponent(Label).string += this._content.join('');
            no.EventHandlerInfo.execute(this.onStop);
        }
    }

    private writing() {
        if (this._content.length == 0) {
            no.EventHandlerInfo.execute(this.onStop);
            return;
        }
        this.getComponent(Label).string += this._content.shift();
        this.scheduleOnce(() => {
            this.writing();
        }, 1 / this.speed);
    }
}
