import { no } from "./no";

/**
 * 固定大小数组
 * @example
 * // 创建一个固定大小为10的数组
 * const array = new FixedSizeArray(10);
 */
export class FixedSizeArray<T> {
    private capacity: number;
    private buffer: T[];
    private head: number;
    private tail: number;
    private size: number;

    constructor(capacity: number) {
        if (capacity <= 0) throw new Error("Capacity must be positive");
        this.capacity = capacity; // 固定容量
        this.buffer = new Array(capacity); // 底层存储
        this.head = 0; // 下一个读取的位置（最旧元素）
        this.tail = 0; // 下一个写入的位置（当前空位）
        this.size = 0; // 当前元素数量（0 ≤ size ≤ capacity）
    }

    // 添加元素（自动覆盖旧数据，若数组已满）
    push(element: T) {
        // 写入位置：tail
        this.buffer[this.tail] = element;

        // 更新 tail：循环到头部（模运算）
        this.tail = (this.tail + 1) % this.capacity;

        // 若数组未满，size+1；若已满，size不变（覆盖旧数据）
        if (this.size < this.capacity) {
            this.size++;
        } else {
            // 数组已满时，head 后移（被覆盖的旧数据不再属于“有效数据”）
            this.head = (this.head + 1) % this.capacity;
        }
    }

    // 删除并返回最旧元素（类似 shift）
    shift(): T {
        if (this.size === 0) return undefined; // 数组为空

        const oldestElement = this.buffer[this.head];
        this.buffer[this.head] = undefined; // 可选：显式清空
        this.head = (this.head + 1) % this.capacity;
        this.size--;
        return oldestElement;
    }

    // 通过索引访问元素（0 ≤ index < size）
    get(index: number): T {
        if (index < 0 || index >= this.size) return undefined;
        // 实际物理位置 = (head + index) % capacity
        const physicalIndex = (this.head + index) % this.capacity;
        return this.buffer[physicalIndex];
    }

    length(): number {
        return this.size;
    }

    isEmpty(): boolean {
        return this.size === 0;
    }

    isFull(): boolean {
        return this.size === this.capacity;
    }

    indexOf(element: any, key?: string): number {
        let index = 0;
        if (key) {
            index = no.indexOfArray(this.buffer, element, key);
        } else
            index = this.buffer.indexOf(element);
        return (this.head + index) % this.capacity;
    }

    splice(index: number, count: number): void {
        for (let i = index; i < index + count; i++) {
            this.buffer[i] = undefined;
        }
    }

    remove(element: any, key?: string) {
        this.splice(this.indexOf(element, key), 1);
    }

    clear(): void {
        this.head = 0;
        this.tail = 0;
        this.size = 0;
        // 可选：清空底层存储（视需求）
        this.buffer.fill(undefined);
    }
}