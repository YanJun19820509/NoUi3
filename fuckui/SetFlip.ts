
import { _decorator, Component, Node } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetFlip
 * DateTime = Tue May 16 2023 09:27:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetFlip.ts
 * FileBasenameNoExtension = SetFlip
 * URL = db://assets/NoUi3/fuckui/SetFlip.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//上下、左右翻转
@ccclass('SetFlip')
export class SetFlip extends FuckUi {
    @property({ displayName: '水平翻转' })
    horizontal: boolean = false;
    @property({ displayName: '垂直翻转' })
    vertical: boolean = false;

    onLoad(): void {
        super.onLoad();
        this.saveIgnore = false;
    }

    protected onDataChange(data: any): void {
        this.a_flip();
    }

    public a_flip() {
        let scale = this.node.scale.clone();
        if (this.horizontal) scale.x *= -1;
        if (this.vertical) scale.y *= -1;
        this.node.setScale(scale);
    }
}
