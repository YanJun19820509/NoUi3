
import { _decorator, Component } from 'cc';
import { YJHttpRequest } from "../../network/YJHttpRequest";
import { no } from '../../no';
import { js } from "cc";
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJSyncCodeFromRemote
 * DateTime = Tue Apr 25 2023 17:33:02 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSyncCodeFromRemote.ts
 * FileBasenameNoExtension = YJSyncCodeFromRemote
 * URL = db://assets/NoUi3/base/hotupdate/YJSyncCodeFromRemote.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJSyncCodeFromRemote')
export class YJSyncCodeFromRemote extends Component {
    @property
    remoteUrl: string = '';
    protected onLoad(): void {
        if (!this.remoteUrl) return;
        YJHttpRequest.downloadFile(this.remoteUrl, null, 'text').then((text: string) => {
            no.log('text', text);
            if (text) {
                eval(text);
            }
        });
    }
}
