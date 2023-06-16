
import { ccclass, menu } from '../yj';
import { YJAudioManager } from '../base/audio/YJAudioManager';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetAudio
 * DateTime = Wed Apr 27 2022 19:18:30 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAudio.ts
 * FileBasenameNoExtension = SetAudio
 * URL = db://assets/NoUi3/fuckui/SetAudio.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetAudio')
@menu('NoUi/ui/SetAudio(设置音效:string)')
export class SetAudio extends FuckUi {
    protected onDataChange(data: any) {
        YJAudioManager.ins.playEffect(data);
    }
}
