import myPako from '../pako/myPako.min.js';
/**解压数据 */
export function decompress(buffer: Uint8Array | ArrayBuffer): Uint8Array {
    // let myPako = globalThis.myPako;
    // if (!myPako) {
    //     console.error('myPako is not loaded');
    //     return null;
    // }
    return myPako.decompress(buffer);
}