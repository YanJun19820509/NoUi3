import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { Color, EDITOR, RenderData, Node, Texture2D, UIRenderer, ccclass, isValid, math, property, Mat4, Vec3, size, v3 } from '../../yj';

@ccclass('YJBitmapLabel')
export class YJBitmapLabel extends UIRenderer {
    @property({ type: Texture2D })
    texture: Texture2D | null = null;
    @property
    public get atlasJson(): string {
        return this._atlasJson;
    }

    public set atlasJson(v: string) {
        if (this._atlasJson == v) return;
        this._atlasJson = v;
        this._atlasConfig = null;
        this.loadJson();
    }
    @property
    public get fontType(): string {
        return this._fontType;
    }

    public set fontType(v: string) {
        this._fontType = v;
        this.setLabel();
    }
    //文本内容
    @property({ multiline: true })
    set string(v: string) {
        if (v == this._string) return;
        this._string = v;
        this.setLabel();
    }
    get string() {
        return this._string;
    }
    @property
    public get size(): number {
        return this._size;
    }

    public set size(v: number) {
        this._size = v;
        this.setLabel();
    }
    @property
    public get lineHeight(): number {
        return this._lineHeight;
    }

    public set lineHeight(v: number) {
        this._lineHeight = v;
        this.setLabel();
    }
    @property
    public get spacingX(): number {
        return this._spacingX;
    }

    public set spacingX(v: number) {
        if (this._spacingX == v) return;
        this._spacingX = v;
        this.setLabel();
    }


    @property({ serializable: true })
    protected _atlasJson: string = '';
    @property({ serializable: true })
    protected _fontType: string = '';
    @property({ serializable: true })
    protected _string: string = '';
    @property({ serializable: true })
    protected _spacingX: number = 0;
    @property({ serializable: true })
    protected _size: number = 0;
    @property({ serializable: true })
    protected _lineHeight: number = 0;

    private _atlasConfig: any;

    onLoad() {
        if (EDITOR) return;
        this.loadJson();
    }

    private loadJson() {
        if (this._atlasConfig) {
            this.setLabel();
            return;
        }
        no.assetBundleManager.loadJSON(this.atlasJson, item => {
            this._atlasConfig = item.json;
            this.setLabel();
        });
    }

    public resetLabel() {
        this.setLabel();
    }

    private clearString() {
        this.destroyRenderData();
        no.size(this.node, math.size(0, this._lineHeight));
    }

    private setLabel() {
        if (!isValid(this.node)) {
            return;
        }
        if (this._string == '') {
            this.clearString();
            return;
        } else {
            this.toDraw();
        }
    }

    protected _render(render: any) {
        render.commitComp(this, this.renderData, this.texture, this._assembler!, null);
    }

    protected _flushAssembler() {
        if (this._assembler !== YJBitmapAssembler) {
            this.destroyRenderData();
            this._assembler = YJBitmapAssembler;
        }

        if (!this._renderData) {
            if (this._assembler && this._assembler.createData) {
                this._renderData = this._assembler.createData(this);
                this._renderData!.material = this.material;
            }
        }
    }

    private toDraw() {
        const renderData = this.renderData!;
        renderData.vertDirty = true;
        renderData.dataLength = 0;
        renderData.resize(0, 0);
        const arr = this.getCharConfigs();
        const anchorPoint = no.anchor(this.node);
        let width = 0, height = 0;
        for (let i = 0, n = arr.length; i < n; i++) {
            const letterInfo = arr[i];
            width += letterInfo.width + this.spacingX;
            if (letterInfo.height > height) height = letterInfo.height;
        }
        width -= this.spacingX;
        const s = no.scale(this.node).x * (this.size || height) / height;
        height = Math.max(height, this.lineHeight);
        no.size(this.node, size(width, height));
        no.scale(this.node, v3(s, s, 1))
        let appX = -anchorPoint.x * width;
        let appY = height * anchorPoint.y;
        for (let i = 0, n = arr.length; i < n; i++) {
            const letterInfo = arr[i],
                x = appX,
                y = letterInfo.height / 2,
                uv = letterInfo.uv;
            this.appendQuad(uv, letterInfo.rotated, x, y, letterInfo.width, letterInfo.height);
            appX += letterInfo.width + this.spacingX;
        }
    }

    private getCharConfigs() {
        let arr: any[] = [];
        for (let i = 0, n = this._string.length; i < n; i++) {
            const key = this.fontType + '/' + this._string.charCodeAt(i);
            arr[arr.length] = this._atlasConfig[key];
        }
        return arr;
    }

    private appendQuad(uv: number[], rotated: boolean, x: number, y: number, width: number, height: number) {
        const renderData = this.renderData;
        if (!renderData) {
            return;
        }

        const dataOffset = renderData.dataLength;

        renderData.dataLength += 4;
        renderData.resize(renderData.dataLength, renderData.dataLength / 2 * 3);

        const dataList = renderData.data;

        if (!rotated) {
            dataList[dataOffset].u = uv[0];
            dataList[dataOffset].v = uv[1];
            dataList[dataOffset + 1].u = uv[2];
            dataList[dataOffset + 1].v = uv[3];
            dataList[dataOffset + 2].u = uv[4];
            dataList[dataOffset + 2].v = uv[5];
            dataList[dataOffset + 3].u = uv[6];
            dataList[dataOffset + 3].v = uv[7];
        } else {
            dataList[dataOffset].u = uv[4];
            dataList[dataOffset].v = uv[5];
            dataList[dataOffset + 1].u = uv[0];
            dataList[dataOffset + 1].v = uv[1];
            dataList[dataOffset + 2].u = uv[6];
            dataList[dataOffset + 2].v = uv[7];
            dataList[dataOffset + 3].u = uv[2];
            dataList[dataOffset + 3].v = uv[3];
        }

        dataList[dataOffset].x = x;
        dataList[dataOffset].y = y - height;
        dataList[dataOffset + 1].x = x + width;
        dataList[dataOffset + 1].y = y - height;
        dataList[dataOffset + 2].x = x;
        dataList[dataOffset + 2].y = y;
        dataList[dataOffset + 3].x = x + width;
        dataList[dataOffset + 3].y = y;
    }
}

const vec3_temp = new Vec3();
const _worldMatrix = new Mat4();
const YJBitmapAssembler = {
    createData(comp: UIRenderer) {
        const renderData = comp.requestRenderData();
        renderData.dataLength = 0;
        renderData.resize(0, 0);
        return renderData;
    },

    updateRenderData(comp: UIRenderer) {
        const texture: Texture2D = comp['texture'];

        this.updateUVs(comp);// dirty need
        this.updateColor(comp);// dirty need

        const renderData = comp.renderData;
        if (renderData && texture) {
            if (renderData.vertDirty) {
                this.updateVertexData(comp);
            }
            renderData.updateRenderData(comp, texture);
        }
    },
    //更新顶点的世界坐标
    updateWorldVerts(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const dataList = renderData.data;
        const chunk = renderData.chunk;
        const vData = chunk.vb;
        const vertexCount = renderData.vertexCount;

        comp.node.getWorldMatrix(_worldMatrix);

        let vertexOffset = 0;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            Vec3.set(vec3_temp, vert.x, vert.y, 0);
            Vec3.transformMat4(vec3_temp, vec3_temp, _worldMatrix);
            vData[vertexOffset++] = vec3_temp.x;
            vData[vertexOffset++] = vec3_temp.y;
            vData[vertexOffset++] = vec3_temp.z;
            vertexOffset += 6;
        }
    },

    fillBuffers(comp: UIRenderer, renderer: any) {
        if (comp === null) {
            return;
        }

        const renderData = comp.renderData!;
        if (comp.node.hasChangedFlags || renderData.vertDirty) {
            this.updateWorldVerts(comp);
        }

        if (renderData.vertDirty) {
            this.updateUVs(comp);
            this.updateColor(comp);
            renderData.vertDirty = false;
        }
        this.updateIndexes(comp);
    },

    updateVertexData(comp: UIRenderer) {

    },

    updateUVs(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const dataList = renderData.data;

        let vertexOffset = 3;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            vData[vertexOffset++] = vert.u;
            vData[vertexOffset++] = vert.v;
            vertexOffset += 7;
        }
    },

    updateIndexes(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const chunk = renderData.chunk;
        const bid = chunk.bufferId;
        const vid = chunk.vertexOffset;
        const meshBuffer = chunk.vertexAccessor.getMeshBuffer(chunk.bufferId);
        const ib = chunk.vertexAccessor.getIndexBuffer(bid);
        const vertexCount = renderData.vertexCount;
        let indexOffset = meshBuffer.indexOffset;
        for (let i = 0, count = vertexCount / 4; i < count; i++) {
            const start = vid + i * 4;
            ib[indexOffset++] = start;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 2;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 3;
            ib[indexOffset++] = start + 2;
        }
        meshBuffer.indexOffset += renderData.indexCount;
    },

    updateColor(comp: UIRenderer) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;
        let colorOffset = 5;
        const color = comp.color;
        const colorR = color.r / 255;
        const colorG = color.g / 255;
        const colorB = color.b / 255;
        const colorA = color.a / 255;
        for (let i = 0; i < vertexCount; i++) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
            colorOffset += floatStride;
        }
    },
};