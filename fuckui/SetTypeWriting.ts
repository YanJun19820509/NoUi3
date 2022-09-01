
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
    @property({ displayName: '每秒打字个数', min: 1, step: 1 })
    speed: number = 3;
    @property({ displayName: '段落间隔时长(s)', min: 0 })
    duration: number = .5;
    @property(no.EventHandlerInfo)
    onStop: no.EventHandlerInfo[] = [];

    private _paragraphs: string[];
    private _content: string[];
    private _idx: number;

    protected onDataChange(data: any) {
        let label = this.getComponent(Label);
        if (data.stop) {
            this.unscheduleAllCallbacks();
            label.string = this._paragraphs.join('\n');
            no.EventHandlerInfo.execute(this.onStop);
        } else if (data.next) {
            this.unscheduleAllCallbacks();
            label.string = '';
            for (let i = 0, n = Math.min(this._idx, this._paragraphs.length - 1); i <= n; i++) {
                label.string += this._paragraphs[i] + '\n';
            }
            this.setParagraph();
        } else {
            label.string = '';
            this._paragraphs = [].concat(data.content);
            this._idx = -1;
            this.setParagraph();
        }
    }

    private setParagraph() {
        this._idx++;
        if (this._paragraphs[this._idx] == null) {
            no.EventHandlerInfo.execute(this.onStop);
            return;
        }
        this._content = String(this._paragraphs[this._idx]).split('');
        this.writing();
    }

    private writing() {
        this.setStr();
        this.scheduleOnce(() => {
            if (this._content.length == 0) {
                this.setWrap();
                this.scheduleOnce(() => {
                    this.setParagraph();
                }, this.duration);
            } else this.writing();
        }, 1 / this.speed);
    }

    private setStr() {
        this.getComponent(Label).string += this._content.shift();
    }

    private setWrap() {
        this.getComponent(Label).string += '\n';
    }
}
