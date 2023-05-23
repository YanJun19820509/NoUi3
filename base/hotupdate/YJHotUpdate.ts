
import { _decorator, Component, Node, game } from 'cc';
import { JSB } from 'cc/env';
import { no } from '../../no';
import { YJAudioManager } from '../audio/YJAudioManager';
import { native } from 'cc';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJHotUpdate
 * DateTime = Wed Jan 12 2022 23:59:35 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJHotUpdate.ts
 * FileBasenameNoExtension = YJHotUpdate
 * URL = db://assets/Script/NoUi3/base/hotupdate/YJHotUpdate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

export class UpdateProgressInfo {
    /**[0下载中，1完成，2失败] */
    public state: number = 0;
    public totalBytes: number = 0;
    public totalFiles: number = 0;
    public downloadedBytes: number = 0;
    public downloadedFiles: number = 0;
    public bytesPer: number = 0;
    public filesPer: number = 0;

    constructor(totalBytes: number, totalFiles: number) {
        this.totalBytes = totalBytes;
        this.totalFiles = totalFiles;
    }
}

@ccclass('YJHotUpdate')
@menu('NoUi/hotupdate/YJHotUpdate(热更组件)')
export class YJHotUpdate extends Component {
    private static _instance: YJHotUpdate;
    private _am: native.AssetsManager;
    private _storagePath: string;
    public checkState: number;
    public needUpdateFilesSize: number;
    public updateProgressInfo: UpdateProgressInfo;

    public static get ins(): YJHotUpdate {
        return this._instance;
    }

    onLoad() {
        if (!JSB) return;
        YJHotUpdate._instance = this;
        this._storagePath = ((native.fileUtils ? native.fileUtils.getWritablePath() : '/') + 'yj-remote-asset');
        no.log(this._storagePath);
        this._am = new native.AssetsManager('', this._storagePath, this.versionCompareHandle);
        this._am.setVerifyCallback(function (path, asset) {
            return true;
        });
        this.checkState = -99;//初始化完成
        // this.copyFiles();
    }

    protected onDestroy(): void {
        YJHotUpdate._instance = null;
        this._am?.setEventCallback(null!);
    }

    // public copyFiles() {
    //     if (localStorage.getItem('init_game') == null) {
    //         let jf = native.fileUtils;
    //         this.checkState = -100;//开始初始化
    //         if (jf.isDirectoryExist(this._storagePath)) {
    //             jf.createDirectory(this._storagePath);
    //         }
    //         no.log('copy manifest Files');
    //         let list: string[] = [];
    //         jf.listFilesRecursively('/assets', list);
    //         let n = list.length;
    //         for (let i = 0; i < n; i++) {
    //             let path = list[i];
    //             no.log('copyFiles::', path);
    //             let p = path.split('assets')[1];
    //             if (p[p.length - 1] == '/') {
    //                 let dir = this._storagePath + p;
    //                 if (!jf.isDirectoryExist(dir)) {
    //                     jf.createDirectory(dir);
    //                 }
    //                 continue;
    //             }
    //             if (path.substring(p.length - 5) == '.json') {
    //                 if (!jf.writeStringToFile(jf.getStringFromFile(path), this._storagePath + p)) {
    //                     no.log(p, jf.isFileExist(this._storagePath + p));
    //                 }
    //             } else {
    //                 let data = jf.getValueVectorFromFile(path);
    //                 if (!jf.writeValueVectorToFile(data, this._storagePath + p)) {
    //                     no.log(p, jf.isFileExist(this._storagePath + p));
    //                 }
    //             }
    //         }
    //         localStorage.setItem('init_game', 'done');
    //     }
    //     this.checkState = -99;//初始化完成
    // }

    /**
     * 检查更新
     */
    public checkUpdate(): boolean {
        this.checkState = 0;
        this.needUpdateFilesSize = 0;
        if (this._am.getState() === native.AssetsManager.State.UNINITED) {
            let localVersionManifest = this.getLocalManifest('version.manifest');
            this._am.loadLocalManifest(localVersionManifest, this._storagePath);
            // no.log('本地version.manifest：：', localVersionManifest);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            no.log('Failed to load local manifest ...');
            return false;
        }
        this._am.setEventCallback(this.checkUpdateCallback.bind(this));
        this._am.checkUpdate();
        return true;
    }

    /**
     * 执行更新
     */
    public updateFiles(): void {
        if (this._am) {
            this.updateProgressInfo = new UpdateProgressInfo(this._am.getTotalBytes(), this._am.getTotalFiles());
            this._am.setEventCallback(this.updateFilesCallback.bind(this));

            if (this._am.getState() === native.AssetsManager.State.UNINITED) {
                let localManifest = this.getLocalManifest('project.manifest');
                this._am.loadLocalManifest(localManifest, this._storagePath);
            }
            let remoteManifest = this._am.getRemoteManifest();
            localStorage.setItem('version', remoteManifest.getVersion());
            let downloader = new native.Downloader();
            downloader.createDownloadFileTask(remoteManifest.getVersionFileUrl(), this._storagePath + '/' + 'version.manifest');
            this._am.update();
        }
    }

    private getLocalManifest(name: string): native.Manifest {
        let path = this._storagePath + '/' + name;
        if (!native.fileUtils.isFileExist(path)) {
            path = 'assets/' + name;
            no.log('getLocalManifest', path);
        } else {
            no.log('getLocalManifest', path);
        }
        let a = new native.Manifest(path);
        no.log(`${name} version:${a.getVersion()}`);
        localStorage.setItem('version', a.getVersion());
        return a;
    }

    private checkUpdateCallback(event) {
        switch (event.getEventCode()) {
            case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                no.log("No local manifest file found, hot update skipped.");
                break;
            case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
                no.log("Fail to download manifest file, hot update skipped.");
                break;
            case native.EventAssetsManager.ALREADY_UP_TO_DATE:
                no.log("Already up to date with the latest remote version.");
                break;
            case native.EventAssetsManager.NEW_VERSION_FOUND:
                no.log('New version found, please try to update. (' + this._am.getTotalBytes() + ')');
                this.needUpdateFilesSize = this._am.getTotalBytes();
                break;
            default:
                return;
        }
        this._am.setEventCallback(null);
        this.checkState = 1;
    }

    private updateFilesCallback(event) {
        switch (event.getEventCode()) {
            case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                no.log('No local manifest file found, hot update skipped.');
                this.updateProgressInfo.state = 2;
                break;
            case native.EventAssetsManager.UPDATE_PROGRESSION:
                this.updateProgressInfo.downloadedBytes = event.getDownloadedBytes();
                this.updateProgressInfo.downloadedFiles = event.getDownloadedFiles();
                this.updateProgressInfo.bytesPer = event.getPercent();
                this.updateProgressInfo.filesPer = event.getPercentByFile();
                // no.log(no.jsonStringify(this.updateProgressInfo));
                break;
            case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
                no.log('Fail to download manifest file, hot update skipped.');
                this.updateProgressInfo.state = 2;
                break;
            case native.EventAssetsManager.ALREADY_UP_TO_DATE:
                no.log('Already up to date with the latest remote version.');
                this.updateProgressInfo.state = 2;
                break;
            case native.EventAssetsManager.UPDATE_FINISHED:
                no.log('Update finished. ' + event.getMessage());
                this.updateProgressInfo.state = 1;
                break;
            case native.EventAssetsManager.UPDATE_FAILED:
                no.log('Update failed. ' + event.getMessage());
                this.updateProgressInfo.state = 2;
                break;
            case native.EventAssetsManager.ERROR_UPDATING:
                no.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            case native.EventAssetsManager.ERROR_DECOMPRESS:
                no.log(event.getMessage());
                break;
            default:
                break;
        }

        if (this.updateProgressInfo.state != 0) {
            this._am.setEventCallback(null);
        }

        if (this.updateProgressInfo.state == 1) {
            // Prepend the manifest's search path
            var searchPaths = native.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            newPaths.forEach(path => {
                if (searchPaths.indexOf(path) == -1) {
                    searchPaths.unshift(path);
                }
            });
            let a = no.jsonStringify(searchPaths);
            no.log(a);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            localStorage.setItem('HotUpdateSearchPaths', a);
            native.fileUtils.setSearchPaths(searchPaths);

            YJAudioManager.ins?.stopBGM();
            this.scheduleOnce(() => {
                game.restart();
            }, 1);
        }
    }

    private versionCompareHandle(versionA, versionB): number {
        no.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
        if (versionA == versionB) return 0;
        var vA = versionA.split('.');
        var vB = versionB.split('.');
        for (var i = 0; i < vA.length; ++i) {
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i] || 0);
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }
    }
}
