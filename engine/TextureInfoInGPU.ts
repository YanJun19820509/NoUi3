import { no } from "../no";
import { _AssetInfo, assetManager, EDITOR, gfx, Texture2D } from "../yj";


/**Bytes转换为MB */
function bytes2MB(size: number) {
    if (!size) {
        return 0;
    }
    size = (size / (1024 * 1024));
    return (isNaN(size) ? 0 : size).toFixed(5);
}
type ProfilerData = {
    uuid: string
    path: string
    size: number
}

const profiler = !EDITOR && no.isDebug();

class _TextureInfoInGPU {
    private uuids: ProfilerData[] = window["uuids"] = [];
    private panelTextureMap: { [panelName: string]: string[] } = {};

    public isWork: boolean = profiler;

    private getAssetInfo(uuid: string) {
        let info: any = null;
        assetManager.bundles.forEach((b) => {
            let bInfo = b.getAssetInfo(uuid)
            if (bInfo != null) {
                info = bInfo;
            }
        });
        return info;
    }

    // window["getAssetInfo"] = getAssetInfo;
    /**添加记录 */
    private addToArray(texture: any) {
        let uuid: string = texture.uuid;
        if (!uuid) {
            return;
        }
        const assetInfo = this.getAssetInfo(uuid);
        let data: ProfilerData = {
            uuid: uuid,
            path: assetInfo?.["path"] || "未知",
            size: texture._gfxTexture?.size,
        };
        no.addToArray(this.uuids, data);

        // console.log(`>>>>>>上传贴图: 
        //     ---UUID: ${data.uuid}
        //     ---路径: ${data.path}
        //     ---大小: ${bytes2MB(data.size)} MB
        //     ---总贴图数: ${this.uuids.length}
        // `);
    }
    /**删除记录 */
    private removeFromArray(texture: any) {
        let uuid: string = texture.uuid;
        if (!uuid) {
            return;
        }
        no.removeFromArray(this.uuids, uuid, "uuid");

        // let data: ProfilerData = no.itemOfArray(this.uuids, uuid, "uuid");
        // if (data) {
        //     console.log(`>>>>>>释放贴图: 
        //         ---UUID: ${data.uuid}
        //         ---路径: ${data.path}
        //         ---大小: ${bytes2MB(data.size)} MB
        //         ---总贴图数: ${this.uuids.length}
        //     `);
        // } else {
        //     console.log(`>>>>>>没有找到这个记录 ${uuid}`);
        // }
    }
    /**有时候调用的时候还没有uuid，延时添加记录 */
    public uploadGfx(texture: any) {
        setTimeout(() => {
            this.addToArray(texture);
        }, 0);
    }
    /**延时删除记录 */
    public destroyGfx(texture: any) {
        setTimeout(() => {
            this.removeFromArray(texture);
        }, 0);
    }

    public addTextureUuidToPanel(uuid: string, panelName: string) {
        if (!this.isWork) return;
        if (!this.panelTextureMap[panelName]) {
            this.panelTextureMap[panelName] = [];
        }
        no.addToArray(this.panelTextureMap[panelName], uuid);
    }

    public showTextureWhenPanelDestroy(panelName: string) {
        if (!this.isWork) return;
        const uuids = this.panelTextureMap[panelName];
        if (!uuids || uuids.length == 0) {
            return;
        }
        let infos: ProfilerData[] = [];
        uuids.forEach(uuid => {
            let data: ProfilerData = no.itemOfArray(this.uuids, uuid, "uuid");
            if (data) infos.push(data);
        });
        if (infos.length == 0) {
            console.log(`>>>>>>${panelName}资源已全部释放`);
            return;
        } else {
            console.log(`>>>>>>${panelName}资源未释放: ${infos.length}个`);
            infos.forEach(data => {
                let asset = no.assetBundleManager.getCachedImageInfo(data.uuid);
                console.log(`
                ---UUID: ${data.uuid}
                ---路径: ${data.path}
                ---大小: ${bytes2MB(data.size)} MB
                ---引用计数: ${asset?.ref}
            `);
            });
            console.log(`>>>>>>${panelName}结束`);
        }
        this.panelTextureMap[panelName].length = 0;
    }



    /**打印贴图信息 */
    public log_texture() {
        let uuids: ProfilerData[] = this.uuids.sort((a: ProfilerData, b: ProfilerData) => { return Number(a.size) - Number(b.size) });
        if (uuids) {
            let size = 0;
            for (let i = 0; i < uuids.length; i++) {
                // no.log(`贴图 uuid: ${uuids[i].uuid} path: ${uuids[i].path} size:${uuids[i].size}`);
                let data = uuids[i];
                let asset = no.assetBundleManager.getCachedImageInfo(data.uuid);
                console.log(`>>>>>>贴图: 
                    ---UUID: ${data.uuid}
                    ---路径: ${data.path}
                    ---大小: ${bytes2MB(data.size)} MB
                    ---计数: ${asset?.ref}
                `);
                size += Number(data.size);
            }
            console.log(`>>>>>>贴图数量: ${uuids.length}`);
            //  由于引擎会创建一些uuid为空的贴图，所以这个尺寸会与引擎统计的有细微差别
            console.log(`>>>>>>贴图内存: ${bytes2MB(size)} MB`);
        }
    }

    public clear_texture() { this.uuids.length = 0; };
}

export const TextureInfoInGPU = new _TextureInfoInGPU();
no.addToWindowForDebug('log_texture', TextureInfoInGPU.log_texture);
no.addToWindowForDebug('clear_texture', TextureInfoInGPU.clear_texture);

if (profiler) {

    /**
     * 贴图上传到gpu的时候
     * texture.image = image;
     * texture._setMipmapParams;
     * texture.reset;重置状态
     * texture._assignImage;上传到gpu
     */
    Texture2D.prototype["_getGfxTextureCreateInfo"] = function (presumed: any) {
        const texInfo = new gfx.TextureInfo(gfx.TextureType.TEX2D);
        texInfo.width = this._width;
        texInfo.height = this._height;
        Object.assign(texInfo, presumed);
        TextureInfoInGPU.uploadGfx(this);
        return texInfo;
    }

    /**
    * 贴图释放的时候
    */
    Texture2D.prototype["_tryDestroyTexture"] = function () {
        if (this._gfxTexture) {
            TextureInfoInGPU.destroyGfx(this);
            this._gfxTexture.destroy();
            this._gfxTexture = null;
        }
    }
}