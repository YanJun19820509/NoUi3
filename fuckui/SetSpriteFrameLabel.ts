
import { _decorator, Component, Node, SpriteAtlas, SpriteFrame } from 'cc';
import { EDITOR } from 'cc/env';
import { YJCreateSpriteFrame } from '../engine/YJCreateSpriteFrame';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetSpriteFrameLabel
 * DateTime = Sat Feb 05 2022 23:11:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameLabel.ts
 * FileBasenameNoExtension = SetSpriteFrameLabel
 * URL = db://assets/NoUi3/fuckui/SetSpriteFrameLabel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSpriteFrameLabel')
@menu('NoUi/ui/SetSpriteFrameLabel(设置精灵文本:string)')
@requireComponent(YJCreateSpriteFrame)
@executeInEditMode()
export class SetSpriteFrameLabel extends FuckUi {
    @property(SpriteAtlas)
    atlas: SpriteAtlas = null;
    @property
    text: string = '';
    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    onLoad() {
        super.onLoad();
        if (EDITOR) return;
        !this.dataSetted && this.setData(JSON.stringify(this.text));
    }

    update() {
        if (!EDITOR) return;
        this.setData(JSON.stringify(this.text));
    }

    protected onDataChange(data: any) {
        if (!this.atlas) return;
        let s = '';
        if (typeof data == 'string') {
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') {
            s = no.formatString(this.formatter, { '0': data });
        } else {
            s = no.formatString(this.formatter, data);
        }
        this.createSpriteFrame(s);
    }

    private createSpriteFrame(s: string) {
        let sfs: SpriteFrame[] = [];
        for (let i = 0, n = s.length; i < n; i++) {
            let v = String(s[i].charCodeAt(0))
            sfs[sfs.length] = this.atlas.getSpriteFrame(v);
        }
        this.getComponent(YJCreateSpriteFrame)?.useSpriteFrames(sfs, this.atlas.name + '_' + s);
    }
}