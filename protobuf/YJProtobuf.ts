import { JsonAsset, TextAsset, ccclass } from '../yj';
import { no } from '../no';
import protobuf from './protobuf.js'

@ccclass('YJProtobuf')
export class YJProtobuf {
    private _root: any;

    public static new(): YJProtobuf;
    public static new(pkgName: string, protoDefine: string): YJProtobuf;
    public static new(pkgName: string, msgName: string, obj: any): YJProtobuf;
    public static new(pkgName?: string, msgName?: string, obj?: any): YJProtobuf {
        return new YJProtobuf(pkgName, msgName, obj);
    }

    constructor();
    constructor(pkgName: string, protoDefine: string);
    constructor(pkgName: string, msgName: string, obj: any);
    constructor(pkgName?: string, msgName?: string, obj?: any) {
        if (!pkgName) return;
        this.init(pkgName, msgName, obj);
    }

    public init(pkgName: string, protoDefine: string): void;
    public init(pkgName: string, msgName: string, obj: any): void;
    public init(pkgName: string, msgName: string, obj?: any): void {
        let pbd: string;
        if (typeof obj == 'object') {
            pbd = YJProtobuf.createProtoDefine(obj, msgName, pkgName);
        } else {
            pbd = msgName;
        }
        this._root = protobuf.parse(pbd, { keepCase: true }).root;
    }

    public async loadProtoJson(bundleName: string, files: string | string[]) {
        return new Promise<void>(resolve => {
            files = [].concat(files);
            no.assetBundleManager.loadFiles<JsonAsset>(bundleName, files, null, (assets: JsonAsset[]) => {
                assets.forEach(asset => {
                    const a = protobuf.Root.fromJSON(asset.json);
                    if (!this._root) this._root = a.root;
                    else {
                        for (const ns in a.root.nested) {
                            this._root.nested[ns] = a.root.nested[ns];
                        }
                    }
                });
                resolve();
            });
        });
    }

    public async loadProto(bundleName: string, files: string | string[]) {
        return new Promise<void>(resolve => {
            files = [].concat(files);
            no.assetBundleManager.loadFiles<TextAsset>(bundleName, files, null, (assets: TextAsset[]) => {
                assets.forEach(asset => {
                    const a = protobuf.parse(asset.text, { keepCase: true });
                    if (!this._root) this._root = a.root;
                    else {
                        for (const ns in a.root.nested) {
                            this._root.nested[ns] = a.root.nested[ns];
                        }
                    }
                });
                resolve();
            });
        });
    }

    public encode(msgName: string, data: any, pkgName: string): Uint8Array {
        let msg_type = this.getMessageType(msgName, pkgName);
        let err = msg_type.verify(data);
        if (err) {
            console.error(err);
            return null;
        }
        let msg = msg_type.create(data);
        return msg_type.encode(msg).finish();
    }

    public decode(msgName: string, buffer: Uint8Array, pkgName: string): any {
        try {
            let msg_type = this.getMessageType(msgName, pkgName);
            let msg = msg_type.decode(buffer);
            let a = msg_type.toObject(msg);
            // no.log('YJProtobuf decode', msgName, a);
            return a;
        } catch (e) {
            no.err('YJProtobuf decode', e.stack);
            return null;
        }
    }

    public messagesToString(pkgName: string): string {
        let ns = this._root.lookup(pkgName);
        let arr = ns.nestedArray;
        let s: string[] = [];
        let t = 'export type {name} = { {props} };';
        arr.forEach((a: { name: string, fields: any }) => {
            s[s.length] = no.formatString(t, { name: a.name, props: this.fieldsToString(a.fields) });
        });
        return s.join('|');
    }

    private fieldsToString(fields: any): string {
        let p = '{name}{required}: {type}{repeated}';
        let m = '{ [k: {keyType}]: {type} }';
        let s: string[] = [];
        for (const key in fields) {
            let f: { name: string, type: string, repeated: boolean, required: boolean, map: boolean, keyType: string } = fields[key];
            s[s.length] = no.formatString(p, { name: f.name, repeated: f.repeated ? '[]' : '', required: f.required ? '' : '?', type: f.map ? no.formatString(m, { keyType: this.typeMap(f.keyType), type: this.typeMap(f.type) }) : this.typeMap(f.type) });
        }
        return s.join(', ');
    }

    private typeMap(key: string): string {
        return {
            string: 'string',
            sint32: 'number',
            sint64: 'number',
            int32: 'number',
            int64: 'number',
            bytes: 'Uint8Array',
            bool: 'boolean'
        }[key] || key;
    }


    private getMessageType(msgName: string, pkgName: string): any {
        return this._root.lookupType(`${pkgName}.${msgName}`);
    }

    public static createProtoDefine(jsonObject: any, msgName: string, pkgName: string): string {
        let df = `syntax = "proto3";
        package ${pkgName};`;
        this.createMessage(msgName, jsonObject, df);
        return df;
    }

    private static createMessage(msgName: string, msgObject: any, protoDefine: string) {
        let s = '', id = 1;
        for (const key in msgObject) {
            let v = msgObject[key];
            let datatype = typeof v;
            s += `${this.createAttr(key, datatype, v, id, protoDefine)}\n`;
            id++;
        }
        protoDefine += `
            message ${msgName}
            {
                ${s}}
        `;
    }

    private static createAttr(key: string, datatype: string, value: any, id: number, protoDefine: string): string {
        let t = '';
        switch (datatype) {
            case 'bigint':
                t = 'int64';
                break;
            case 'boolean':
                t = 'bool';
                break;
            case 'number':
                if (`${value}`.indexOf('.') != -1) t = 'double';
                else t = 'int32';
                break;
            case 'string':
                t = 'string';
                break;
            case 'object'://数组
                if (value instanceof Array) {
                    return `repeated ${this.createAttr(key, typeof value[0], value[0], id, protoDefine)}`;
                } else if (value instanceof Object) {
                    let name = `msg_${key}`;
                    this.createMessage(name, value, protoDefine);
                    return `${name} ${key} = ${id};`
                }
                break;
        }
        return `${t} ${key} = ${id};`;
    }
}