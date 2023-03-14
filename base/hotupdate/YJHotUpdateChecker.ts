
import { _decorator, sys, game } from 'cc';
import { JSB } from 'cc/env';
import { no } from '../../no';
import { YJAudioManager } from '../audio/YJAudioManager';
import { YJComponent } from '../YJComponent';
import { YJDataWork } from '../YJDataWork';
import { YJHotUpdate } from './YJHotUpdate';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJHotUpdateChecker
 * DateTime = Wed Jan 12 2022 23:59:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJHotUpdateChecker.ts
 * FileBasenameNoExtension = YJHotUpdateChecker
 * URL = db://assets/Script/NoUi3/base/hotupdate/YJHotUpdateChecker.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJHotUpdateChecker')
@menu('NoUi/hotupdate/YJHotUpdateChecker(热更检测组件)')
export class YJHotUpdateChecker extends YJComponent {
    @property({ type: YJDataWork, tooltip: '设置相关数据：需要更新文件大小updateSize，已下载文件大小downloadedBytes，下载进度progress' })
    dataWork: YJDataWork = null;

    @property({ type: no.EventHandlerInfo, displayName: '需要更新时触发的回调' })
    triggers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '不需要更新时触发的回调' })
    triggers1: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '下载完成回调' })
    downloadCompleteCall: no.EventHandlerInfo[] = [];


    onLoad() {
        if (JSB) this.check();
        else no.EventHandlerInfo.execute(this.triggers1);
    }

    private async check() {
        await this.waitFor(() => { return YJHotUpdate.ins && YJHotUpdate.ins.checkState == -99; });
        if (!YJHotUpdate.ins.checkUpdate()) no.EventHandlerInfo.execute(this.triggers1);
        else {
            await this.waitFor(() => { return YJHotUpdate.ins.checkState == 1; });
            let size = YJHotUpdate.ins.needUpdateFilesSize;
            if (size > 0) {
                this.dataWork.setValue('updateSize', size);
                no.EventHandlerInfo.execute(this.triggers);
            } else no.EventHandlerInfo.execute(this.triggers1);
        }
    }

    public a_download() {
        no.log('start updateFiles');
        YJHotUpdate.ins.updateFiles();
        this.addUpdateHandlerByFrame(this.checkDownload);
    }

    public a_cancel() {
        YJAudioManager.ins?.stopBGM();
        game.restart();
    }

    private checkDownload(): boolean {
        let d = YJHotUpdate.ins.updateProgressInfo;
        if (d && d.state == 0) {
            if (this.dataWork) {
                this.dataWork.data = {
                    downloadedBytes: d.downloadedBytes,
                    progress: d.bytesPer
                };
            }
            no.log('update progress' + d.bytesPer);
            return true;
        } else {
            no.EventHandlerInfo.execute(this.downloadCompleteCall);
            return false;
        }
    }
}
