import { CCString } from "cc";
import { no } from "../no";
import { Component, ccclass, property } from "../yj";
import { YJRemotePackageDownloader } from "./YJRemotePackageDownloader";


@ccclass('YJLoadSubPackages')
/**
 * 子包加载组件
 * @example
 * // 在编辑器中将root设置为"subpackages"目录，勾选checkSub自动获取子包列表
 * // 在场景加载后调用loadSubBundles()进行子包下载
 */
export class YJLoadSubPackages extends Component {
    /** 子包根目录路径（相对于assets目录） */
    @property
    root: string = '';

    /** 
     * 编辑器检查开关（仅在编辑器模式下有效）
     * @example
     * // 在属性面板勾选此选项后，会自动扫描root目录下的所有bundle
     */
    @property
    public get checkSub(): boolean {
        return false;
    }

    public set checkSub(v: boolean) {
        if (!this.root) return;
        // 编辑器模式下异步获取指定目录下的所有bundle
        no.EditorMode.getBundlesUnderFolder(this.root).then(bundles => {
            this.subBundles = bundles;
        });
    }

    /** 需要加载的子包名称列表（CCString数组类型） */
    @property({ type: CCString })
    subBundles: string[] = [];

    onLoad() {
        // 可在此处取消注释实现自动加载
        // this.loadSubBundles();
    }

    /**
     * 开始加载所有子包
     * @example
     * // 手动触发子包加载
     * this.node.getComponent(YJLoadSubPackages)?.loadSubBundles();
     */
    private loadSubBundles() {
        no.log('YJLoadSubPackages loadSubBundles', this.subBundles);
        // 通过远程包下载器进行批量下载
        YJRemotePackageDownloader.new.downloadBundles(this.subBundles);
    }
}


