import { TextAsset, _decorator } from 'cc';
import { no } from '../no';
import protobuf from './protobuf.js'
const { ccclass } = _decorator;

@ccclass('YJProtobuf')
export class YJProtobuf {
    private _root: any;
    private _pkgName: string;

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
        this._pkgName = pkgName;
    }

    public async loadProto(file: string) {
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadFile(file, TextAsset, (asset: TextAsset) => {
                let a = protobuf.parse(asset.text, { keepCase: true });
                this._root = a.root;
                this._pkgName = a.package;
                resolve();
            });
        });
    }

    public encode(msgName: string, data: any): Uint8Array {
        let msg_type = this.getMessageType(msgName);
        let err = msg_type.verify(data);
        if (err) {
            console.error(err);
            return null;
        }
        let msg = msg_type.create(data);
        return msg_type.encode(msg).finish();
    }

    public decode(msgName: string, buffer: Uint8Array): any {
        let msg_type = this.getMessageType(msgName);
        let msg = msg_type.decode(buffer);
        let a = msg_type.toObject(msg);
        no.log('YJProtobuf decode', msgName, a);
        return a;
    }

    public messagesToString(): string {
        let ns = this._root.lookup(this._pkgName);
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


    private getMessageType(msgName: string): any {
        return this._root.lookupType(`${this._pkgName}.${msgName}`);
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