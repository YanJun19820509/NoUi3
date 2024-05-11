import { no } from "../no";
import { Component, EDITOR, Prefab, assetManager, ccclass, instantiate, property, Node, Vec2, Vec3, Vec4, Quat, executeInEditMode, js, Color, Size, SpriteFrame, EventHandler, VideoClip, TTFFont, Font, Asset, Camera, RenderTexture, v3, v4, size, quat, color, v2 } from "../yj";
import { Range, UV } from "../types";

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
    'cc.Sprite': ['type', 'fillType', 'fillCenter', 'fillStart', 'fillRange', 'trim', 'grayscale', 'sizeMode', 'spriteFrame'],
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
    'cc.Graphics': ['lineWidth', 'lineJoin', 'lineCap', 'strokeColor', 'fillColor', 'miterLimit', 'color'],
    'cc.Mask': ['type', 'inverted', 'segments', 'spriteFrame', 'alphaThreshold'],
    'cc.RichText': ['string', 'horizontalAlign', 'verticalAlign', 'fontSize', 'fontFamily', 'font', 'useSystemFont', 'cacheMode', 'maxWidth', 'lineHeight', 'imageAtlas', 'handleTouchEvent'],
    'cc.Canvas': ['renderMode', 'cameraComponent', 'alignCanvasWithScreen'],
    'cc.Camera': ['priority', 'visibility', 'clearFlags', 'clearColor', 'clearDepth', 'clearStencil', 'projection', 'fovAxis', 'fov', 'orthoHeight', 'near', 'far', 'aperture', 'shutter', 'iso', 'rect', 'targetTexture'],
    'cc.Animation': ['clips', 'defaultClip', 'playOnLoad']
};

class YJCollectPrefabInfo {
    private _objInfos: any[] = [];
    private _objs: Node[] = [];
    private _assets: string[] = [];

    private toNormalValue(val: any): any {
        if (val instanceof Array) {
            if (val.length == 0) return null;
            let a: any[] = ['__type__'];
            val.forEach(b => {
                const c = this.toNormalValue(b);
                if (a.length == 1) a[1] = c[1];
                a[2] = a[2] || [];
                a[2].push(c[2]);
            });
            return a;
        }
        let out: any[] = [];
        if (val instanceof Vec2) {
            return ['__type__', 'Vec2', Vec2.toArray(out, val)];
        }
        if (val instanceof Vec3) {
            return ['__type__', 'Vec3', Vec3.toArray(out, val)];
        }
        if (val instanceof Vec4) {
            return ['__type__', 'Vec4', Vec4.toArray(out, val)];
        }
        if (val instanceof Quat) {
            return ['__type__', 'Quat', Quat.toArray(out, val)];
        }
        if (val instanceof Node) {
            return ['__type__', 'Node', this._objs.indexOf(val)];
        }
        if (val instanceof Color) {
            return ['__type__', 'Color', Color.toArray(out, val)];
        }
        if (val instanceof Size) {
            return ['__type__', 'Size', [val.width, val.height]];
        }
        if (val instanceof Range) {
            return ['__type__', 'Range', Range.toArray(val)];
        }
        if (val instanceof UV) {
            return ['__type__', 'UV', UV.toArray(val)];
        }
        if (val instanceof EventHandler) {
            return ['__type__', 'EventHandler', this.getComponentInfo(val)];
        }
        // if (val instanceof Camera) {
        //     return this.getComponentInfo(val);
        // }
        // if (val instanceof RenderTexture) {
        //     return this.getComponentInfo(val);
        // }
        if (val instanceof Asset) {
            no.addToArray(this._assets, val.uuid);
            return ['__type__', 'Asset', val.uuid];
        }
        if (val instanceof no.EventHandlerInfo) return ['__type__', 'no.EventHandlerInfo', this.getComponentInfo(val)];
        if (val instanceof Component) return ['__type__', 'Component', this.getBindComponent(val)];
        if (val instanceof Object) return ['__type__', 'CCClass', this.getComponentInfo(val)];
        return val;
    }

    private getBindComponent(comp: Component) {
        return [this._objs.indexOf(comp.node), js.getClassName(comp)];
    }

    private getComponentInfo(comp: any) {
        let info: { [k: string]: any } = {};
        const name = js.getClassName(comp);
        info['class_type'] = name;
        if (comp.active != undefined) info['active'] = comp.active;
        else if (comp.enabled != undefined) info['enabled'] = comp.enabled;
        if (ComponentProperties[name]) {
            info['node'] = this.toNormalValue(comp['node']);
            ComponentProperties[name].forEach(p => {
                info[p] = this.toNormalValue(comp[p]);
            });
        }
        else {
            const props: string[] = js.getClassByName(name)['__props__'];
            props.forEach(p => {
                if (['_name', '_objFlags', '__editorExtras__', '__scriptAsset', '_enabled', '__prefab'].includes(p)) return;
                info[p] = this.toNormalValue(comp[p]);
            });
        }
        return info;
    }

    private getNodes(node: Node) {
        let info = this.getComponentInfo(node);
        if (node.parent)
            info['parent'] = this.toNormalValue(node.parent);
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
            this._objInfos[this._objInfos.length] = info;
        }
    }

    private _getPrefabInfo(prefab: Prefab) {
        let node = instantiate(prefab);
        this.getNodes(node);
        for (let i = 0, n = this._objs.length; i < n; i++) {
            this.getComponents(i);
        }
        this._objInfos.push({ asset: this._assets });
        return this._objInfos;
    }

    public static getPrefabInfo(prefab: Prefab) {
        const a = new YJCollectPrefabInfo();
        return a._getPrefabInfo(prefab);
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
                this.queryAllPrefab();
            }
        }
    }

    private queryAllPrefab() {
        this.createPrefabConfig('db://assets/sub/common');
    }

    public async createPrefabConfig(dir?: string) {
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
                            infos[prefab.name] = YJCollectPrefabInfo.getPrefabInfo(prefab);
                        });
                        for (const name in infos) {
                            // console.log(infos[name]);
                            // console.log(JSON.stringify(infos[name]));
                            const file = `${path[name]}_prefab.json`;
                            console.log(`save ${file}`);
                            Editor.Message.send('asset-db', 'create-asset', file, JSON.stringify(infos[name]), { overwrite: true });
                        }
                    } else
                        console.log(err);
                    resolve();
                });
            });
        });
    }
}

export class YJCreateNodeByPrefabJson extends no.SingleObject {
    public static get ins(): YJCreateNodeByPrefabJson {
        return this.instance();
    }
    private _cache: { [path: string]: Node } = {};
    private _nodes: Node[] = [];
    private _assets: Asset[] = [];

    public async create(path: string): Promise<Node | null> {
        if (this._cache[path]) return instantiate(this._cache[path]);
        this._nodes.length = 0;
        return new Promise<Node>(resolve => {
            no.assetBundleManager.loadJSON(path, item => {
                if (item) {
                    this.parse(item.json).then(node => {
                        this._cache[path] = node;
                        resolve(instantiate(node));
                    })
                } else resolve(null);
            });
        });
    }

    private parse(arr: any): Promise<Node> {
        return new Promise<Node>(resolve => {
            const uuids: string[] = arr[arr.length - 1].asset;
            let re: any[] = []
            uuids.forEach(uuid => {
                re.push({ uuid: uuid });
            });
            no.assetBundleManager.loadAnyFiles(re, null, items => {
                this._assets = items;
                for (let i = 0, n = arr.length - 1; i < n; i++) {
                    const d = arr[i];
                    if (d["class_type"] == 'cc.Node') this.createNode(d);
                    else this.createComponent(d);
                }
                resolve(this._nodes[0]);
            });
        });
    }

    private createNode(d: any) {
        const node = new Node(d.name);
        for (const key in d) {
            if (key == "class_type") continue;
            this.toTargetVal(d[key], v => {
                node[key] = v;
            });
        }
        this._nodes[this._nodes.length] = node;
    }

    private createComponent(d: any) {
        this.toTargetVal(d['node'], (v: Node) => {
            const comp = v.addComponent(d["class_type"]);
            for (const key in d) {
                if (key == "class_type" || key == 'node') continue;
                this.toTargetVal(d[key], v => {
                    if (v != undefined)
                        comp[key] = v;
                });
            }
        });
    }

    private toTargetVal(val: any, cb: (v: any) => void) {
        let out: any;
        if (val instanceof Array && val[0] == '__type__') {
            const type: string = val[1];
            val = val[2];
            switch (type) {
                case 'Vec2':
                    out = v2();
                    Vec2.fromArray(out, val);
                    break;
                case 'Vec3':
                    out = v3();
                    Vec3.fromArray(out, val);
                    break;
                case 'Quat':
                    out = quat();
                    Quat.fromArray(out, val);
                    break;
                case 'Size':
                    out = size(val[0], val[1]);
                    break;
                case 'Color':
                    out = color();
                    Color.fromArray(val, out);
                    break;
                case 'Range':
                    Range.fromArray(val);
                    break;
                case 'UV':
                    UV.fromArray(val);
                    break;
                case 'Asset':
                    if (val) {
                        out = this.getAssetByUuid(val);
                    }
                    break;
                case 'Node':
                    if (val instanceof Array) {
                        out = [];
                        val.forEach(v => {
                            out.push(this._nodes[val]);
                        });
                    } else
                        out = this._nodes[val];
                    break;
                case 'EventHandler':
                    if (val instanceof Array) {
                        out = [];
                        val.forEach(v => {
                            let a = new EventHandler();
                            this.toTargetVal(v.target, v => {
                                a.target = v;
                            });;
                            a._componentId = v._componentId;
                            a.component = v.component;
                            a.handler = v.handler;
                            a.customEventData = v.customEventData;
                            out.push(a);
                        });
                    } else {
                        out = new EventHandler();
                        this.toTargetVal(val.target, v => {
                            out.target = v;
                        });
                        out._componentId = val._componentId;
                        out.component = val.component;
                        out.handler = val.handler;
                        out.customEventData = val.customEventData;
                    }
                    break;
                case 'Component':
                    if (val[0] instanceof Array) {
                        out = [];
                        const _a = setInterval(() => {
                            out.length = 0;
                            for (let i = 0, n = val.length; i < n; i++) {
                                const v = val[i];
                                const node = this._nodes[v[0]];
                                const comp = node.getComponent(v[1]);
                                if (comp)
                                    out.push(comp);
                                else break;
                            }
                            if (out.length == val.length) {
                                cb(out);
                                clearInterval(_a);
                            }
                        }, 1);
                    } else {
                        const node = this._nodes[val[0]];
                        const _a = setInterval(() => {
                            const comp = node.getComponent(val[1]);
                            if (comp) {
                                cb(comp);
                                clearInterval(_a);
                            }
                        }, 1);
                    }
                    return;
                case 'CCClass':
                    if (val instanceof Array) {
                        out = [];
                        for (let i = 0, n = val.length; i < n; i++) {
                            const v = val[i];
                            const clazz = js.getClassByName(v.class_type);
                            const obj = new clazz();
                            for (const key in v) {
                                if (key == 'class_type') continue;
                                this.toTargetVal(v[key], vv => {
                                    obj[key] = vv;
                                });
                            }
                            out.push(obj);
                        }
                    } else {
                        const clazz = js.getClassByName(val.class_type);
                        out = new clazz();
                        for (const key in val) {
                            if (key == 'class_type') continue;
                            this.toTargetVal(val[key], vv => {
                                out[key] = vv;
                            });
                        }
                    }
                    break;
                case "no.EventHandlerInfo":
                    out = [];
                    val.forEach(v => {
                        const a = new no.EventHandlerInfo();
                        this.toTargetVal(v.handler, vv => {
                            a.handler = vv;
                        });
                        out.push(a);
                    });
                    break;
                default: out = val;
            }
            cb(out);
        } else
            cb(val);
    }

    private getAssetByUuid(uuids: string | string[]): Asset | Asset[] {
        let ids = [].concat(uuids);
        let a: Asset[] = [];
        ids.forEach(id => {
            a.push(no.itemOfArray(this._assets, id, 'uuid'));
        })
        return (typeof uuids == 'string') ? a[0] : a;
    }
}