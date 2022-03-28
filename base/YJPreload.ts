
import { _decorator, Component, Node, CCString, JsonAsset } from 'cc';
import { no } from '../no';
import { YJComponent } from './YJComponent';
import { YJDataWork } from './YJDataWork';
import { YJPreloadDelegate } from './YJPreloadDelegate';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJPreload
 * DateTime = Fri Jan 14 2022 18:07:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPreload.ts
 * FileBasenameNoExtension = YJPreload
 * URL = db://assets/Script/NoUi3/base/YJPreload.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

enum PreloadState {
    End = -1,
    LoadingBundles = 0,
    LoadingFiles,
    LoadingBundleFiles,
    LoadingFolderFiles,
    LoadingJsonFiles,
    LoadingScene
}

@ccclass('YJPreload')
@menu('NoUi/base/YJPreload(资源预加载)')
export class YJPreload extends YJComponent {
    @property({ type: CCString, displayName: '加载包' })
    bundles: string[] = [];

    @property({ type: CCString, displayName: '加载单个文件' })
    files: string[] = [];

    @property({ type: CCString, displayName: '加载包下所有文件' })
    bundleFiles: string[] = [];

    @property({ type: CCString, displayName: '加载文件夹下所有文件' })
    folderFiles: string[] = [];

    @property({ type: CCString, displayName: '加载json文件夹' })
    jsonFiles: string[] = [];

    @property({ displayName: '跳转的场景' })
    scene: string = '';

    @property({ displayName: '自动运行' })
    auto: boolean = true;

    @property({ type: YJDataWork, tooltip: '设置加载进度相关数据：总量total，完成量finished，阶段进度progress' })
    dataWork: YJDataWork = null;

    @property({ type: no.EventHandlerInfo, displayName: '加载前' })
    beforeCall: no.EventHandlerInfo[] = [];

    // @property({ type: no.EventHandlerInfo, displayName: '加载中',  })
    // progressingCall: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '加载完成' })
    completeCall: no.EventHandlerInfo[] = [];

    @property({ type: YJPreloadDelegate })
    delegate: YJPreloadDelegate = null;

    private fileInfo: Map<string, string[]>;
    private state: PreloadState;
    private loadNext: boolean;
    private progress: number = 0;
    private total: number = 0;
    private finished: number = 0;
    private showNewScene: boolean = false;

    protected onEnable(): void {
        this.auto && this.a_startLoad();
    }

    public a_startLoad(): void {
        no.EventHandlerInfo.execute(this.beforeCall);
        this.addUpdateHandlerByFrame(this.checkState, 1);
        this.init();
        this.loadBundles();
    }

    public showScene() {
        this.showNewScene && this.scheduleOnce(() => {
            no.assetBundleManager.loadScene(this.scene, null);
        }, 0.5);
    }

    private init() {
        this.finished = 0;
        this.progress = 0;
        this.fileInfo = new Map<string, string[]>();
        this.files.forEach(path => {
            let p = no.assetBundleManager.assetPath(path);
            let b = p.bundle;
            if (this.bundles.indexOf(b) == -1) {
                this.bundles.push(b);
            }
            if (!this.fileInfo.has(b)) {
                this.fileInfo.set(b, []);
            }
            let f = p.file;
            let i = this.fileInfo.get(b);
            if (i.indexOf(f) == -1) {
                i.push(f);
            }
        });
        this.total = 1 + this.fileInfo.size + this.bundleFiles.length + this.folderFiles.length + this.jsonFiles.length + (this.scene != '' ? 1 : 0);
    }

    protected loadBundles() {
        this.state = PreloadState.LoadingBundles;
        if (this.bundles.length == 0) {
            this.loadNext = true;
            return;
        }
        no.assetBundleManager.loadBundles(this.bundles, (p) => {
            if (p == 1) {
                this.finished++;
                this.loadNext = true;
            }
        });
    }

    protected loadFiles() {
        this.state = PreloadState.LoadingFiles;
        if (this.fileInfo.size == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadFilesInFileInfo(0);
        }
    }

    protected loadBundleFiles() {
        this.state = PreloadState.LoadingBundleFiles;
        if (this.bundleFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadFilesInBundle(0);
        }
    }

    protected loadFolderFiles() {
        this.state = PreloadState.LoadingFolderFiles;
        if (this.folderFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadFilesInFolder(0);
        }
    }

    protected loadJsonFiles() {
        this.state = PreloadState.LoadingJsonFiles;
        if (this.jsonFiles.length == 0) {
            this.loadNext = true;
            this.progress = 0;
        } else {
            this.loadJsonFilesInFolder(0);
        }
    }

    protected loadScene() {
        this.showNewScene = false;
        this.state = PreloadState.LoadingScene;
        if (this.scene == '') {
            this.finished = this.total;
            return;
        }
        this.progress = 0.9 / this.total;
        no.assetBundleManager.preloadScene(this.scene, (p) => {
            if (p == 1) {
                this.progress = 0;
                this.finished++;
                this.showNewScene = true;
            } else {
                this.progress = p / this.total;
            }
        });
    }

    update() {
        if (this.loadNext) {
            this.loadNext = false;
            switch (this.state) {
                case PreloadState.LoadingBundles:
                    this.loadFiles();
                    break;
                case PreloadState.LoadingFiles:
                    this.loadBundleFiles();
                    break;
                case PreloadState.LoadingBundleFiles:
                    this.loadFolderFiles();
                    break;
                case PreloadState.LoadingFolderFiles:
                    this.loadJsonFiles();
                    break;
                case PreloadState.LoadingJsonFiles:
                    this.loadScene();
                    break;
            }
        }
    }

    private checkState(): boolean {
        if (this.finished >= this.total) {
            // no.EventHandlerInfo.execute(this.progressingCall, this.total, this.finished, this.progress);
            if (this.dataWork) {
                this.dataWork.data = {
                    total: this.total,
                    finished: this.finished,
                    progress: this.progress,
                    allProgress: this.progress + this.finished / this.total
                }
            }
            this.delegate?.onLoadComplete();
            this.scheduleOnce(() => {
                no.EventHandlerInfo.execute(this.completeCall);
            }, 0.5);
            return false;
        } else {
            // no.EventHandlerInfo.execute(this.progressingCall, this.total, this.finished, this.progress);
            if (this.dataWork) {
                this.dataWork.data = {
                    total: this.total,
                    finished: this.finished,
                    progress: this.progress,
                    allProgress: this.progress + this.finished / this.total
                }
            }
            return true;
        }
    }

    private loadFilesInFileInfo(index: number) {
        let b = this.bundles[index];
        if (b == null) {
            this.loadNext = true;
            return;
        }
        let files = this.fileInfo.get(b);
        if (files == null) {
            this.loadFilesInFileInfo(index + 1);
            return;
        }
        no.assetBundleManager.preloadFiles(b, files, (p) => {
            if (p == 1) {
                this.progress = 0;
                this.finished++;
                this.loadFilesInFileInfo(index + 1);
            } else {
                this.progress = p / this.total;
            }
        });
    }

    private loadFilesInBundle(index: number) {
        let b = this.bundleFiles[index];
        if (b == null) {
            this.loadNext = true;
            return;
        }
        if (b == '') {
            this.loadFilesInBundle(index + 1);
            return;
        }
        no.assetBundleManager.preloadAllFilesInBundle(b, (p) => {
            if (p == 1) {
                this.progress = 0;
                this.finished++;
                this.loadFilesInBundle(index + 1);
            } else {
                this.progress = p / this.total;
            }
        });
    }

    private loadFilesInFolder(index: number) {
        let b = this.folderFiles[index];
        if (b == null) {
            this.loadNext = true;
            return;
        }
        if (b == '') {
            this.loadFilesInFolder(index + 1);
            return;
        }
        no.assetBundleManager.preloadAllFilesInFolder(b, (p) => {
            if (p == 1) {
                this.progress = 0;
                this.finished++;
                this.loadFilesInFolder(index + 1);
            } else {
                this.progress = p / this.total;
            }
        });
    }

    private loadJsonFilesInFolder(index: number) {
        let b = this.jsonFiles[index];
        if (b == null) {
            this.loadNext = true;
            return;
        }
        if (b == '') {
            this.loadJsonFilesInFolder(index + 1);
            return;
        }
        no.assetBundleManager.loadAllFilesInFolder(b, (p) => {
            if (p == 1) {
                this.progress = 0;
                this.finished++;
            } else {
                this.progress = p / this.total;
            }
        }, (items: JsonAsset[]) => {
            this.delegate?.onJsonLoaded(items);
            this.loadJsonFilesInFolder(index + 1);
        });
    }
}