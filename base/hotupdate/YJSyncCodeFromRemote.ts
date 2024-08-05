
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
//加载远程代码txt文件并执行，文件名为`${no.gameVersion()}.txt`
@ccclass('YJSyncCodeFromRemote')
export class YJSyncCodeFromRemote extends Component {
    @property({ displayName: '正式地址' })
    remoteUrl: string = '';
    @property({ displayName: '测试地址' })
    testRemoteUrl: string = '';
    @property
    autoLoad: boolean = false;

    protected onLoad(): void {
        if (this.autoLoad) this.syncCode();
    }

    public syncCode() {
        let url = no.isDebug() ? this.testRemoteUrl : this.remoteUrl;
        if (!url) {
            return;
        }

        YJHttpRequest.downloadFile(no.pathjoin(url, `${no.gameVersion()}.txt`), (loaded: number, total: number) => { }, (path: string, text: string) => {
            no.log('text', text);
            if (text) {
                eval(text);
            }
        }, 'text');
    }
}
