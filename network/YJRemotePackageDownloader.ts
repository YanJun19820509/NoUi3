import { no } from "../no";
import { assetManager, ccclass } from "../yj";

/**
 * 远程包下载器
 */
@ccclass('YJRemotePackageDownloader')
export class YJRemotePackageDownloader {
    private _wx: any;
    private _bundleLoadCallback: { onProgress?: (p: number) => void, onComplete?: () => void, onError?: () => void } = { onProgress: null, onComplete: null, onError: null };
    private _completeNum: number = 0;
    private _allNum: number = 0;
    private _onlyDownload = false;

    public static get new(): YJRemotePackageDownloader {
        return new YJRemotePackageDownloader();
    }

    constructor() {
        this._wx = window['wx'];
    }

    private get server(): string {
        return assetManager.downloader.remoteServerAddress;
    }

    private get remoteBundles(): string[] {
        return assetManager.downloader.remoteBundles.slice();
    }

    private isRemoteBundle(bundleName: string): boolean {
        return this.remoteBundles.includes(bundleName);
    }

    private bundleVer(bundleName: string): string {
        return assetManager.downloader.bundleVers[bundleName];
    }

    private bundleUrl(bundleName: string): string {
        if (this.isRemoteBundle(bundleName)) {
            return this.server + 'remote/' + bundleName;
        }
        return bundleName;
    }

    private downloadBundleConfig(bundleName: string) {
        const bundlerUrl = this.bundleUrl(bundleName),
            configFileUrl = `${bundlerUrl}/config.${this.bundleVer(bundleName)}.json`;
        console.log('下载包config文件', configFileUrl);
        this.wxDownload(configFileUrl, (tempFilePath: string) => {
            const resVer = this.getBundleResVer(tempFilePath);
            this.saveBundleConfig(tempFilePath, bundleName)
            if (resVer)
                this.downloadBundleRes(bundleName, resVer);
            else
                this.loadDownloadedBundle(bundleName);
        });
    }

    private getBundleResVer(filePath: string) {
        const wx = this._wx;
        if (!wx) return;
        const fs = wx.getFileSystemManager(),
            txt = fs.readFileSync(filePath, 'utf8', 0),
            json = JSON.parse(txt);
        return json.zipVersion;
    }

    private downloadBundleRes(bundleName: string, ver: string) {
        const bundlerUrl = this.bundleUrl(bundleName),
            zipFileUrl = `${bundlerUrl}/res.${ver}.zip`;
        console.log('下载包res文件', zipFileUrl);
        this.wxDownload(zipFileUrl, (tempFilePath: string) => {
            this.wxUnzip(tempFilePath, bundleName);
        });
    }

    //网络下载的文件会保存到本地临时目录里
    private wxDownload(url: string, cb: (tempFilePath: string) => void) {
        const wx = this._wx;
        if (!wx) {
            cb(null);
            return;
        }
        // const onProgressUpdate = function (res: any) {
        //     console.log('下载进度', res.progress, res.totalBytesWritten + '/' + res.totalBytesExpectedToWrite);
        // }
        const downloadTask = wx.downloadFile({
            url: url, //仅为示例，并非真实的资源
            success(res: any) {
                // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                if (res.statusCode === 200) {
                    console.log('wxDownload下载完成：', res.tempFilePath);
                    cb(res.tempFilePath);
                }
            },
            fail(res) {
                console.log(res)
                console.log('下载失败：', res.tempFilePath);
                cb(null);
            },
            complete() {
                // downloadTask.offProgressUpdate(onProgressUpdate);
            }
        });

        // downloadTask.onProgressUpdate(onProgressUpdate);
    }

    private saveBundleConfig(tempFilePath: string, bundleName: string) {
        const wx = this._wx;
        if (!wx) return;
        const fs = wx.getFileSystemManager(),
            folder = this.localBundlePath(bundleName),
            filePath = folder + '/config.' + this.bundleVer(bundleName) + '.json',
            txt = fs.readFileSync(tempFilePath, 'utf8', 0),
            json = JSON.parse(txt);
        json.isZip = false;
        json.importBase = 'res/import';
        json.nativeBase = 'res/native';
        console.log('保存文件' + tempFilePath + '到' + filePath);
        if (!this.isExist(folder)) {
            fs.mkdirSync(folder, true);
        }
        fs.writeFileSync(filePath, JSON.stringify(json), 'utf8');
    }

    private wxUnzip(tempFilePath: string, bundleName: string) {
        const wx = this._wx;
        if (!wx) return;
        const fs = wx.getFileSystemManager(),
            bundlePath = this.localBundlePath(bundleName),
            me = this;
        console.log('解压zip文件' + tempFilePath + '到' + bundlePath);
        if (!this.isExist(bundlePath)) {
            fs.mkdirSync(bundlePath, true);
        }
        fs.unzip({
            zipFilePath: tempFilePath,
            targetPath: bundlePath,
            success(res) {
                if (!me._onlyDownload)
                    me.loadDownloadedBundle(bundleName);
            },
            fail(res) {
                console.log(res);
                me._bundleLoadCallback.onError?.();
            }
        })
    }

    private localBundlePath(bundleName: string) {
        const wx = this._wx;
        if (!wx) return;
        const ver = this.bundleVer(bundleName);
        return wx.env.USER_DATA_PATH + '/bundles/' + bundleName + '/' + ver + '/' + bundleName;
    }

    /**
     * 清除包老版本文件
     * @param bundleName 
     * @returns 
     */
    private clearOldBundleFiles(bundleName: string) {
        const wx = this._wx;
        if (!wx) return;
        const fs = wx.getFileSystemManager(),
            folder = wx.env.USER_DATA_PATH + '/bundles/' + bundleName;
        if (!this.isExist(folder)) return;
        const subs: string[] = fs.readdirSync(folder),
            ver = this.bundleVer(bundleName);
        for (let i = subs.length - 1; i >= 0; i--) {
            const sub = subs[i];
            if (sub != ver) {
                console.log('clearOldBundleFiles', folder + '/' + sub);
                fs.rmdirSync(folder + '/' + sub, true);
            }
        }
    }

    /**
     * 清除包所有版本的文件
     * @param bundleName 
     */
    private clearAllBundleFiles(bundleName: string) {
        const wx = this._wx;
        if (!wx) return;
        const fs = wx.getFileSystemManager(),
            folder = wx.env.USER_DATA_PATH + '/bundles/' + bundleName;
        if (!this.isExist(folder)) return;
        fs.rmdirSync(folder, true);
    }

    private isExist(path: string) {
        const wx = this._wx;
        if (!wx) return false;;
        const fs = wx.getFileSystemManager();
        try {
            fs.accessSync(path);
            return true;
        } catch (e) {
            return false;
        }
    }

    private loadLocalBundle(bundle: string) {
        no.assetBundleManager.loadBundles([bundle], p => {
            if (p >= 1) {
                this._completeNum++;
                this._bundleLoadCallback.onProgress?.(this._completeNum / this._allNum);
            }
        });
    }

    private loadRemoteBundle(bundleName: string) {
        //已经加载
        if (assetManager.getBundle(bundleName)) {
            this._completeNum++;
            this._bundleLoadCallback.onProgress?.(this._completeNum / this._allNum);
            return;
        }
        //非zip包加载
        if (this.isRemoteBundle(bundleName)) {
            no.assetBundleManager.loadRemoteBundle(this.bundleUrl(bundleName), { version: this.bundleVer(bundleName) }, () => {
                this._completeNum++;
                this._bundleLoadCallback.onProgress?.(this._completeNum / this._allNum);
            });
        } else this.loadLocalBundle(bundleName);
        return;
        //zip包加载
        const wx = this._wx;
        //本地加载
        if (!wx || !this.isRemoteBundle(bundleName)) {
            if (!this._onlyDownload)
                this.loadLocalBundle(bundleName);
            return;
        }
        //远程加载
        console.log('加载远程分包', bundleName);
        this.clearOldBundleFiles(bundleName);
        const path = this.localBundlePath(bundleName);
        //已经下载
        if (this.isExist(path)) {
            console.log('包已存在', bundleName);
            if (!this._onlyDownload)
                this.loadDownloadedBundle(bundleName);
        } else {
            //开始下载
            console.log('1包不存在，开始下载', bundleName);
            this.downloadBundleConfig(bundleName);
        }
    }
    //加载已经下载的包
    private loadDownloadedBundle(bundleName: string) {
        const path = this.localBundlePath(bundleName);
        assetManager.loadBundle(path, { scriptAsyncLoading: false }, (err, bundle) => {
            if (err) {
                console.log(err);
                console.log('2包不存在，开始下载', bundleName);
                this.downloadBundleConfig(bundleName);
            } else {
                this._completeNum++;
                this._bundleLoadCallback.onProgress?.(this._completeNum / this._allNum);
            }
        });
    }

    private async loadBundleOneByOne(bundleNames: string[]) {
        for (let i = 0; i < this._allNum; i++) {
            this.loadRemoteBundle(bundleNames[i]);
            await no.waitFor(() => { return this._completeNum == i + 1; });
            // await no.sleep(2);
        }
    }

    /**
     * 加载远程包
     * @param bundleNames 
     * @param onProgress 
     * @param onComplete 
     * @param onError 
     * @param needWait 
     */
    public loadBundles(bundleNames: string[] | string, onProgress?: (p: number) => void, onComplete?: () => void, onError?: () => void, needWait = false) {
        this._bundleLoadCallback.onComplete = onComplete;
        this._bundleLoadCallback.onError = onError;
        this._bundleLoadCallback.onProgress = onProgress;
        this._completeNum = 0;
        this._onlyDownload = false;
        bundleNames = [].concat(bundleNames);
        this._allNum = bundleNames.length;
        if (needWait) {
            this.loadBundleOneByOne(bundleNames);
        } else {
            for (let i = 0; i < this._allNum; i++) {
                this.loadRemoteBundle(bundleNames[i]);
            }
        }
        if (onComplete) {
            no.waitFor(() => {
                return this._completeNum == this._allNum;
            }).then(() => {
                onComplete();
            });
        }
    }

    /**
     * 只将远程包下载到本地而不加载到内存
     * @param bundleNames 
     * @param onProgress 
     * @param onComplete 
     * @param onError 
     */
    public downloadBundles(bundleNames: string[] | string, onProgress?: (p: number) => void, onComplete?: () => void, onError?: () => void) {
        this._bundleLoadCallback.onComplete = onComplete;
        this._bundleLoadCallback.onError = onError;
        this._bundleLoadCallback.onProgress = onProgress;
        this._completeNum = 0;
        this._onlyDownload = true;
        bundleNames = [].concat(bundleNames);
        this._allNum = bundleNames.length;
        this.loadBundleOneByOne(bundleNames);
        if (onComplete) {
            no.waitFor(() => {
                return this._completeNum == this._allNum;
            }).then(() => {
                onComplete();
            });
        }
    }

    private _allRemoteBundles: string[] = [];
    private _exceptBundles: string[] = [];
    /**
     * 加载所有远程包，适用于非zip包
     * @param except 排除不用加载的包
     */
    public loadAllRemoteBundles(except: string[] = []) {
        this._allRemoteBundles = this.remoteBundles;
        this._exceptBundles = except;
        this.loadRemoteBundleByJob();
    }

    private loadRemoteBundleByJob() {
        let bundleName: string = this._allRemoteBundles.shift();
        if (bundleName == undefined) return;
        if (this._exceptBundles.includes(bundleName) || assetManager.getBundle(bundleName)) this.loadRemoteBundleByJob();
        else {
            const bundleUrl = this.bundleUrl(bundleName);
            no.assetBundleManager.loadRemoteBundle(bundleUrl, { version: this.bundleVer(bundleName) }, () => {
                no.setTimeoutF(() => {
                    this.loadRemoteBundleByJob();
                }, 100);
            });
        }
    }

    public clearBundles(bundleNames: string[] | string) {
        bundleNames = [].concat(bundleNames);
        bundleNames.forEach(bundleName => {
            this.clearAllBundleFiles(bundleName);
        });
    }
}


