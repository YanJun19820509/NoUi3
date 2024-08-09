import { CCString } from "cc";
import { no } from "../no";
import { Component, ccclass, property } from "../yj";
import { YJRemotePackageDownloader } from "./YJRemotePackageDownloader";


@ccclass('YJLoadSubPackages')
export class YJLoadSubPackages extends Component {
    @property
    root: string = '';
    @property
    public get checkSub(): boolean {
        return false;
    }

    public set checkSub(v: boolean) {
        if (!this.root) return;
        no.EditorMode.getBundlesUnderFolder(this.root).then(bundles => {
            this.subBundles = bundles;
        });
    }
    @property({ type: CCString })
    subBundles: string[] = [];

    onLoad() {
        // this.loadSubBundles();
    }

    private loadSubBundles() {
        no.log('YJLoadSubPackages loadSubBundles', this.subBundles);
        YJRemotePackageDownloader.new.downloadBundles(this.subBundles);
    }
}


