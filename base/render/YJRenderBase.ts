import { no } from '../../no';
import { Mat4, RenderData, Texture2D, UIRenderer, UIVertexFormat, Vec3, ccclass, property, Attribute, Color } from '../../yj';
/**
 * 自定义基础渲染组件
 */
export type RenderDataType = { uv?: number[], xy?: number[], rotated?: boolean, colors?: Color[], colors2?: Color[] };
@ccclass('YJRenderBase')
export class YJRenderBase extends UIRenderer {
    @property({ type: Texture2D })
    public get texture(): Texture2D {
        return this._texture;
    }

    public set texture(v: Texture2D) {
        this._texture = v;
        this.destroyRenderData();
        this._flushAssembler();
        if (this._texture)
            this.markForUpdateRenderData();
    }

    @property({ serializable: true })
    protected _texture: Texture2D = null;

    public renderColors: Color[] = [];
    public renderColors2: Color[] = [];
    public indexNumMap: number[] = []; //记录每个面的顶点下标数量

    protected renderable: boolean = true; //是否可渲染，默认true，当设置为false时，渲染器将不会渲染该组件。

    private dataOffset: number = 0;
    private indexOffset: number = 0;

    /**
     * 返回顶点数据结构，子类可根据需要重写此方法，返回自定义的顶点数据结构。
     * @returns {Attribute[]} 顶点数据结构。
     */
    protected vertexFormat(): Attribute[] {
        return UIVertexFormat.vfmtPosUvColor;
    }

    //在preload时引擎会自动调用此方法，当更换texture或material时需要调用此方法
    protected _flushAssembler() {
        if (this._assembler !== YJAssemblerBase) {
            this.destroyRenderData();
            this._assembler = YJAssemblerBase;
        }

        if (!this._renderData) {
            if (this._assembler && this._assembler.createData) {
                this._renderData = this._assembler.createData(this.vertexFormat());
                this._renderData!.material = this.material;
            }
        }
    }
    //引擎自动调用，无需手动调用
    protected _render(render: any) {
        if (!this._canRender()) return;
        render.commitComp(this, this._renderData, this._texture, this._assembler!, null);
    }

    protected _canRender() {
        if (!this.renderable || !super._canRender() || !this._texture) return false;
        return true;
    }

    /**
     * 初始化renderData，当需要改变顶点数据长度时，先调用此方法
     * @param planeNum 平面数量
     * @param vertextNum 顶点数量，默认为4，即四边形，如果为3，则表示三角形。
     */
    protected initRenderData(planeNum: number, vertextNum: 3 | 4 = 4) {
        const renderData = this._renderData;
        renderData.dataLength = planeNum * vertextNum;
        renderData.resize(renderData.dataLength, planeNum * (vertextNum == 3 ? 3 : 6));
        this.markForUpdateRenderData();
        this.indexOffset = 0;
        this.dataOffset = 0;
        this.renderColors.length = 0;
        this.renderColors2.length = 0;
        this.indexNumMap.length = 0;
        for (let i = 0; i < planeNum; i++) {
            this.indexNumMap[this.indexNumMap.length] = vertextNum;
        }
    }

    /**
     * 设置默认顶点数据
     */
    protected setDefaultRenderData() {
        this.addRenderData({
            uv: this.getDefaultUV(),
            xy: this.getDefaultXY()
        })
    }

    /**
     * 设置顶点数据，此方法不会改变顶点数据长度，如果需要改变顶点数据长度，请调用addRenderData 方法
     * @param d
     */
    protected setRenderData(d: RenderDataType) {
        if (this.indexOffset >= this.indexNumMap.length) {
            this.indexOffset = 0;
            this.dataOffset = 0;
        }
        this.updateCustomRenderData(d);
        this.updateCustomRenderDataColor(d.colors, d.colors2);
        this.dataOffset += this.indexNumMap[this.indexOffset];
        this.indexOffset++;
    }

    /**
     * 添加顶点数据，此方法会改变顶点数据长度，请先调用resetRenderData方法重置顶点数据
     * @param d
     */
    protected addRenderData(d: RenderDataType) {
        const renderData = this._renderData,
            vertexCount = renderData.vertexCount,
            indexCount = renderData.indexCount,
            n = d.uv.length / 2;
        renderData.dataLength = vertexCount + n;
        renderData.resize(renderData.dataLength, indexCount + (n - 2) * 3);
        this.indexNumMap[this.indexNumMap.length] = n;
        this.setRenderData(d);
    }

    /**
     * 修改指定dataOffset的顶点数据，dataOffset从0开始，如果dataOffset大于等于当前顶点数据长度，则不修改任何数据
     * @param dataOffset 
     * @param d
     */
    protected updateCustomRenderData(d: RenderDataType) {
        const renderData = this._renderData;
        const dataOffset = this.dataOffset;
        const dataList = renderData.data;
        const indexNum = this.indexNumMap[this.indexOffset];
        if (d.uv?.length > 0) {
            if (!d.rotated) {
                dataList[dataOffset].u = d.uv[0];
                dataList[dataOffset].v = d.uv[1];
                dataList[dataOffset + 1].u = d.uv[2];
                dataList[dataOffset + 1].v = d.uv[3];
                dataList[dataOffset + 2].u = d.uv[4];
                dataList[dataOffset + 2].v = d.uv[5];

                if (indexNum == 4) {
                    dataList[dataOffset + 3].u = d.uv[6];
                    dataList[dataOffset + 3].v = d.uv[7];
                }
            } else {
                dataList[dataOffset].u = d.uv[4];
                dataList[dataOffset].v = d.uv[5];
                dataList[dataOffset + 1].u = d.uv[0];
                dataList[dataOffset + 1].v = d.uv[1];
                dataList[dataOffset + 2].u = d.uv[6];
                dataList[dataOffset + 2].v = d.uv[7];

                if (indexNum == 4) {
                    dataList[dataOffset + 3].u = d.uv[2];
                    dataList[dataOffset + 3].v = d.uv[3];
                }
            }
        }
        if (d.xy?.length > 0) {
            for (let i = 0; i < indexNum; i++) {
                dataList[dataOffset + i].x = d.xy[i * 2];
                dataList[dataOffset + i].y = d.xy[i * 2 + 1];
            }
        }
    }

    /**
     * 更新顶点颜色数据
     * @param dataOffset 
     * @param colors 
     * @param colors2 
     */
    protected updateCustomRenderDataColor(colors: Color[], colors2?: Color[]) {
        const dataOffset = this.dataOffset;
        const indexNum = this.indexNumMap[this.indexOffset];
        if (colors?.length > 0) {
            this.renderColors[dataOffset] = colors[0];
            this.renderColors[dataOffset + 1] = colors[1] || colors[0];
            this.renderColors[dataOffset + 2] = colors[2] || colors[0];
            if (indexNum == 4)
                this.renderColors[dataOffset + 3] = colors[3] || colors[1] || colors[0];
        }
        if (colors2?.length > 0) {
            this.renderColors2[dataOffset] = colors2[0];
            this.renderColors2[dataOffset + 1] = colors2[1] || colors2[0];
            this.renderColors2[dataOffset + 2] = colors2[2] || colors2[0];
            if (indexNum == 4)
                this.renderColors2[dataOffset + 3] = colors2[3] || colors2[1] || colors2[0];
        }
    }

    /**
     * 4个顶点在节点内的坐标
     * @param x 左上角x坐标
     * @param y 左上角y坐标
     * @param width 
     * @param height 
     * @returns 
     */
    protected getXY(x: number, y: number, width: number, height: number): number[] {
        return [x, y - height, x + width, y - height, x, y, x + width, y];
    }

    /**
     * 4个顶点的uv坐标
     * @param u 左上角u坐标[0,1]
     * @param v 左上角v坐标[0,1]
     * @param width [0,1]
     * @param height [0,1]
     * @returns 
     */
    protected getUV(u: number, v: number, width: number, height: number): number[] {
        return [u, v + height, u + width, v + height, u, v, u + width, v];
    }

    /**
     * 默认uv
     * @returns 
     */
    protected getDefaultUV(): number[] {
        return [0, 1, 1, 1, 0, 0, 1, 0];
    }

    /**
     * 默认4个顶点坐标
     * @returns 
     */
    protected getDefaultXY(): number[] {
        const { width, height } = no.size(this.node),
            { x, y } = no.anchor(this.node);
        return [-width * x, -height * y, width * (1 - x), -height * y, -width * x, height * (1 - y), width * (1 - x), height * (1 - y)];
    }
}

const vec3_temp = new Vec3();
const _worldMatrix = new Mat4();
export const YJAssemblerBase = {
    createData(vertexFormat?: Attribute[]) {
        const renderData = RenderData.add(vertexFormat);
        renderData.dataLength = 0;
        renderData.resize(0, 0);
        return renderData;
    },

    fillBuffers(comp: YJRenderBase, renderer: any) {
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

    updateRenderData(comp: YJRenderBase) {
        const texture: Texture2D = comp['texture'];
        const renderData = comp.renderData;
        if (renderData && texture) {
            this.updateUVs(comp);// dirty need
            this.updateColor(comp);// dirty need
            if (renderData.vertDirty) {
                this.updateVertexData(comp);
            }
            renderData.updateRenderData(comp, texture);
        }
    },
    //更新顶点的世界坐标
    updateWorldVerts(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const dataList = renderData.data;
        const chunk = renderData.chunk;
        const vData = chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;

        comp.node.getWorldMatrix(_worldMatrix);

        let vertexOffset = 0;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            Vec3.set(vec3_temp, vert.x, vert.y, 0);
            Vec3.transformMat4(vec3_temp, vec3_temp, _worldMatrix);
            vData[vertexOffset] = vec3_temp.x;
            vData[vertexOffset + 1] = vec3_temp.y;
            vData[vertexOffset + 2] = vec3_temp.z;
            vertexOffset += floatStride;
        }
    },

    updateVertexData(comp: YJRenderBase) {

    },

    updateUVs(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;
        const dataList = renderData.data;

        let vertexOffset = 3;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            vData[vertexOffset] = vert.u;
            vData[vertexOffset + 1] = vert.v;
            vertexOffset += floatStride;
        }
    },

    updateIndexes(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const chunk = renderData.chunk;
        const bid = chunk.bufferId;
        const meshBuffer = chunk.vertexAccessor.getMeshBuffer(chunk.bufferId);
        const ib = chunk.vertexAccessor.getIndexBuffer(bid);
        const vertexCount = renderData.vertexCount;
        const indexNumMap = comp.indexNumMap;
        let vid = chunk.vertexOffset;
        let indexOffset = meshBuffer.indexOffset;
        for (let i = 0, count = indexNumMap.length; i < count; i++) {
            const start = vid;
            const indexNum = indexNumMap[i];
            ib[indexOffset++] = start;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 2;
            if (indexNum == 4) {
                ib[indexOffset++] = start + 1;
                ib[indexOffset++] = start + 3;
                ib[indexOffset++] = start + 2;
            }
            vid += indexNum;
        }
        meshBuffer.indexOffset += renderData.indexCount;
    },

    updateColor(comp: YJRenderBase) {
        const renderData = comp.renderData!;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        const floatStride = renderData.floatStride;
        let colorOffset = 5;
        for (let i = 0; i < vertexCount; i++) {
            //更新color
            const color: Color = comp.renderColors?.[i] || comp.color;
            Color.toArray(vData, color, colorOffset);

            //更新color2
            if (comp.renderColors2?.[i]) {
                Color.toArray(vData, comp.renderColors2[i], colorOffset + 4);
            }
            colorOffset += floatStride;
        }
    },
};

