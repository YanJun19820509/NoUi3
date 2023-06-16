import { Component, EDITOR, Prefab, assetManager, ccclass, instantiate, property, Node, Vec2, Vec3, Vec4, Quat, executeInEditMode, js, Color, Size, SpriteFrame, EventHandler, VideoClip } from "../yj";


const ComponentProperties: { [k: string]: string[] } = {
    'cc.Node': ['position', 'rotation', 'scale', 'mobility', 'layer', 'active', 'name'],
    'cc.UITransform': ['contentSize', 'anchorPoint'],
    'cc.UIOpacity': ['opacity'],
    'cc.Widget': ['isAlignTop', 'isAlignBottom', 'isAlignLeft', 'isAlignRight', 'isAlignVerticalCenter', 'isAlignHorizontalCenter',
        'top', 'bottom', 'left', 'right', 'horizontalCenter', 'verticalCenter', 'alignMode', 'alignFlags', 'target'
    ],
    'cc.Label': ['string', 'horizontalAlign', 'verticalAlign', 'fontSize', 'lineHeight', 'spacingX', 'overflow', 'enableWrapText',
        'useSystemFont', 'fontFamily', 'font', 'cacheMode', 'isBold', 'isItalic', 'isUnderline', 'underlineHeight'],
    'cc.LabelOutline': ['color', 'width'],
    'cc.Layout': ['alignHorizontal', 'alignVertical', 'type', 'resizeMode', 'cellSize', 'startAxis', 'paddingLeft',
        'paddingRight', 'paddingTop', 'paddingBottom', 'spacingX', 'spacingY', 'verticalDirection', 'horizontalDirection',
        'padding', 'constraint', 'constraintNum', 'affectedByScale'],
    'cc.Sprite': ['spriteFrame', 'type', 'fillType', 'fillCenter', 'fillStart', 'fillRange', 'trim', 'grayscale', 'sizeMode', ''],
    'cc.Button': ['target', 'interactable', 'transition', 'normalColor', 'pressedColor', 'hoverColor', 'disabledColor', 'duration',
        'zoomScale', 'normalSprite', 'pressedSprite', 'hoverSprite', 'disabledSprite', 'clickEvents'],
    'cc.ClickEvent': ['target', 'component', '_componentId', 'handler', 'customEventData'],
    'cc.EditBox': ['string', 'placeholder', 'textLabel', 'placeholderLabel', 'backgroundImage', 'inputFlag', 'inputMode', 'returnType',
        'maxLength', 'tabIndex', 'editingDidBegan', 'textChanged', 'editingDidEnded', 'editingReturn'],
    'cc.ProgressBar': ['barSprite', 'mode', 'totalLength', 'progress', 'reverse'],
    'cc.ScrollBar': ['handle', 'direction', 'enableAutoHide', 'autoHideTime'],
    'cc.ScrollView': ['bounceDuration', 'brake', 'elastic', 'inertia', 'content', 'horizontal', 'vertical', 'cancelInnerEvents', 'scrollEvents'],
    'cc.Slider': ['handle', 'direction', 'progress', 'slideEvents'],
    'cc.Toggle': ['isChecked', 'checkMark', 'checkEvents'],
    'cc.SafeArea': [],
    'cc.BlockInputEvents': [],
    'cc.VideoPlayer': ['resourceType', 'remoteURL', 'clip', 'playOnAwake', 'playbackRate', 'volume', 'mute', 'loop', 'keepAspectRatio', 'fullScreenOnAwake', 'stayOnBottom', 'videoPlayerEvent'],
    'cc.WebView': ['url', 'webviewEvents'],

};

class YJCollectPrefabInfo {
    private _objInfos: any[] = [];
    private _objs: Node[] = [];

    private toNormalValue(val: any): any {
        if (val instanceof Array) {
            let a: any[] = [];
            val.forEach(b => {
                a[a.length] = this.toNormalValue(b);
            });
            return a;
        }
        let out: any[] = [];
        if (val instanceof Vec2) {
            return Vec2.toArray(out, val);
        }
        if (val instanceof Vec3) {
            return Vec3.toArray(out, val);
        }
        if (val instanceof Vec4) {
            return Vec4.toArray(out, val);
        }
        if (val instanceof Quat) {
            return Quat.toArray(out, val);
        }
        if (val instanceof Node) {
            return this._objs.indexOf(val);
        }
        if (val instanceof Color) {
            return Color.toArray(out, val);
        }
        if (val instanceof Size) {
            return [val.width, val.height];
        }
        if (val instanceof SpriteFrame) {
            console.log('SpriteFrame')
            console.log(val.nativeUrl)
            return val.nativeUrl;
        }
        if (val instanceof EventHandler) {
            return this.getComponentInfo(val);
        }
        if (val instanceof VideoClip) {
            return val.nativeUrl;
        }
        return val;
    }

    private getComponentInfo(comp: any) {
        let info: { [k: string]: any } = {};
        const name = js.getClassName(comp);
        info['__type__'] = name;
        if (comp.active != undefined) info['active'] = comp.active;
        else info['enabled'] = comp.enabled;
        if (ComponentProperties[name])
            ComponentProperties[name].forEach(p => {
                info[p] = this.toNormalValue(comp[p]);
            });
        else console.error(name);
        return info;
    }

    private getNodes(node: Node) {
        let info = this.getComponentInfo(node);
        if (node.parent)
            info['parent'] = this._objs.indexOf(node.parent);
        this._objs[this._objs.length] = node;
        this._objInfos[this._objInfos.length] = info;
        node.children.forEach(child => {
            this.getNodes(child);
        });
    }

    private getComponents(idx: number) {
        const node = this._objs[idx];
        for (let i = 0, n = node.components.length; i < n; i++) {
            const comp = node.components[i];
            let info = this.getComponentInfo(comp);
            info['node'] = idx;
            this._objInfos[this._objInfos.length] = info;
        }
    }

    private getPrefabInfo(prefab: Prefab) {
        let node = instantiate(prefab);
        this.getNodes(node);
        for (let i = 0, n = this._objs.length; i < n; i++) {
            this.getComponents(i);
        }
        return this._objInfos;
    }

    public static getPrefabInfo(prefab: Prefab) {
        const a = new YJCollectPrefabInfo();
        return a.getPrefabInfo(prefab);
    }
}

@ccclass('YJConvertPrefabToJson')
@executeInEditMode()
export class YJConvertPrefabToJson extends Component {
    @property({ displayName: '查找prefab文件并生成json' })
    preRun: boolean = false;

    update(deltaTime: number) {
        if (EDITOR) {
            if (this.preRun) {
                this.preRun = false;
                YJConvertPrefabToJson.queryAllPrefab();
            }
        }
    }

    private static queryAllPrefab() {
        this.createPrefabConfig('db://assets/sub/common/Tooltip/Tooltip');
    }

    private static getPrefabInfo(prefab: Prefab) {
        return YJCollectPrefabInfo.getPrefabInfo(prefab);
    }

    public static async createPrefabConfig(dir?: string) {
        return new Promise<void>(resolve => {
            Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.Prefab' }).then(assets => {
                let aa = [];
                let path = {};
                assets.forEach(a => {
                    // console.log(a.path);
                    if (dir && a.path.indexOf(dir) == -1) return;
                    aa[aa.length] = { uuid: a.uuid, type: Prefab };
                    const name = a.name.replace('.prefab', '');
                    path[name] = a.path;
                });
                let infos: { [k: string]: { [t: string]: any } } = {};
                assetManager.loadAny(aa, null, (err, prefabs: Prefab[] | Prefab) => {
                    prefabs = [].concat(prefabs);
                    if (!err) {
                        // console.log(prefabs.length);
                        prefabs.forEach(prefab => {
                            infos[prefab.name] = this.getPrefabInfo(prefab);
                        });
                        for (const name in infos) {
                            // console.log(infos[name]);
                            console.log(JSON.stringify(infos[name]));
                            // const file = `${path[name]}_prefab.json`;
                            // console.log(`save ${file}`);
                            // Editor.Message.send('asset-db', 'create-asset', file, JSON.stringify(infos[name]), { overwrite: true });
                        }
                    } else
                        console.log(err);
                    resolve();
                });
            });
        });
    }
}

