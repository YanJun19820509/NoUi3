import { no } from "../no";
import { base64 } from "./base64";
import { YJCrypto } from "./crypto/crypto";
import { rsa } from "./rsa/rsa";

/**
 * 加密
 * @param d 
 * @param encryptType 
 * @returns 
 */
export function encode(d: string | object, encryptType: 'base64' | 'aes' | 'rsa'): string | ArrayBufferLike {
    if (typeof d != 'string') d = JSON.stringify(d);
    switch (encryptType) {
        case 'base64':
            const buffer = no.string2ArrayBuffer(d);
            return base64.encode(buffer);
        case 'aes':
            return YJCrypto.aesEncode(d, true);
        case 'rsa':
            return rsa.encode(d);
    }
}
/**
 * 解密
 * @param d 
 * @param encryptType 
 * @returns 
 */
export function decode(d: string | ArrayBufferLike, encryptType: 'base64' | 'aes' | 'rsa'): string {
    switch (encryptType) {
        case 'base64':
            if (typeof d != 'string') d = no.arrayBuffer2String(d);
            let buffer = base64.decode(d);
            return no.arrayBuffer2String(buffer);
        case 'aes':
            return YJCrypto.aesDecode(d);
        case 'rsa':
            if (typeof d != 'string') d = no.arrayBuffer2String(d);
            return rsa.decode(d);
    }
}