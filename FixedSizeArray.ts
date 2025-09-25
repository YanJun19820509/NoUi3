
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
    private autoExpand: boolean;

    /**
     * 构造函数（支持初始容量和自动扩容）
     * @param {number} [initialCapacity=10] 初始容量（默认10）
     * @param {boolean} [autoExpand=true] 是否自动扩容（默认true）
     */
    constructor(initialCapacity = 10, autoExpand = true) {
        if (initialCapacity <= 0) throw new Error("Initial capacity must be positive");
        this.autoExpand = autoExpand; // 是否自动扩容
        this.capacity = initialCapacity; // 当前容量
        this.buffer = new Array(this.capacity); // 底层存储
        this.head = 0; // 下一个读取位置（最旧元素）
        this.tail = 0; // 下一个写入位置（当前空位）
        this.size = 0; // 当前有效元素数量（0 ≤ size ≤ capacity）
    }

    /**
     * 添加元素（自动扩容或覆盖旧数据）
     * @param {*} element 要添加的元素
     */
    push(element: T) {
        // 情况1：数组未填满，直接写入
        if (this.size < this.capacity) {
            this.buffer[this.tail] = element;
            this.tail = (this.tail + 1) % this.capacity;
            this.size++;
            return;
        }

        // 情况2：数组已满，根据是否自动扩容处理
        if (this.autoExpand) {
            this.expandCapacity(); // 扩容
            // 扩容后，数组未填满（新容量 > 原容量 ≥ size），继续写入
            this.buffer[this.tail] = element;
            this.tail = (this.tail + 1) % this.capacity;
            this.size++;
        } else {
            // 情况3：不自动扩容，覆盖最旧元素（原逻辑）
            this.buffer[this.tail] = element;
            this.tail = (this.tail + 1) % this.capacity;
            this.head = (this.head + 1) % this.capacity; // 头指针后移（覆盖旧数据）
        }
        return this;
    }

    /**
     * 扩容（按当前容量的2倍扩容，最小扩容至1）
     */
    expandCapacity() {
        const oldCapacity = this.capacity;
        const newCapacity = Math.max(oldCapacity * 2, 1); // 至少扩容至1（防止初始容量为0）

        // 创建新底层数组
        const newBuffer = new Array(newCapacity);

        // 迁移有效元素到新数组（从head开始，取size个元素，按顺序存储）
        for (let i = 0; i < this.size; i++) {
            const oldPhysicalIndex = (this.head + i) % oldCapacity;
            const newPhysicalIndex = i; // 新数组从0开始连续存储
            newBuffer[newPhysicalIndex] = this.buffer[oldPhysicalIndex];
        }

        // 更新属性
        this.capacity = newCapacity;
        this.buffer = newBuffer;
        this.head = 0; // 头指针重置为0（有效元素从0开始）
        this.tail = this.size; // 尾指针指向size位置（下一个写入位置）
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

    set(index: number, value: T) {
        if (index < 0) return;
        if (index >= this.size) {
            this.expandCapacity();
        }
        // 实际物理位置 = (head + index) % capacity
        const physicalIndex = (this.head + index) % this.capacity;
        this.buffer[physicalIndex] = value;
        return this;
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

    /**
     * 查找元素第一次出现的逻辑索引（支持对象属性匹配或自定义回调）
     * @param {any|Object|Function} targetOrOptions 匹配目标（可选配置或回调）
     * @param {string} [options.key] 属性名（当targetOrOptions为对象时）
     * @param {any} [options.value] 属性值（当targetOrOptions为对象时）
     * @returns {number} 逻辑索引（未找到返回-1）
     */
    indexOf(targetOrOptions: any | { key: string, value: any } | ((element: any) => boolean)): number {
        let matchFn: (element: any) => boolean; // 匹配函数

        // 解析匹配逻辑
        if (typeof targetOrOptions === 'function') {
            // 情况1：传入回调函数，直接使用
            matchFn = (element) => targetOrOptions(element);
        } else if (typeof targetOrOptions === 'object' && targetOrOptions !== null) {
            // 情况2：传入{ key, value }配置，检查属性值
            const { key, value } = targetOrOptions;
            if (key === undefined || value === undefined) {
                throw new Error('FixedSizeArray: Invalid options: must provide "key" and "value"');
            }
            matchFn = (element) => element[key] === value;
        } else {
            // 情况3：默认严格相等匹配
            matchFn = (element) => element === targetOrOptions;
        }

        // 遍历有效元素，查找第一个匹配项
        for (let i = 0; i < this.size; i++) {
            const physicalIndex = (this.head + i) % this.capacity;
            const element = this.buffer[physicalIndex];
            if (matchFn(element)) {
                return i; // 返回逻辑索引
            }
        }

        return -1; // 未找到
    }

    /**
     * 删除并插入元素（类似数组的splice）
     * @param {number} startIndex 起始删除位置（支持负数）
     * @param {number} deleteCount 要删除的元素数量
     * @param {...any} items 要插入的新元素
     * @returns {any[]} 被删除的元素数组
     */
    splice(startIndex: number, deleteCount = 0, ...items: T[]): T[] {
        // 1. 规范化startIndex（支持负数，范围0到size）
        startIndex = startIndex < 0
            ? Math.max(this.size + startIndex, 0)  // 负数转换为正数索引（如-1对应最后一个元素）
            : Math.min(startIndex, this.size);     // 超过size则取size（不删除）

        // 2. 计算实际删除数量（不超过剩余元素数）
        const actualDeleteCount = Math.min(deleteCount, this.size - startIndex);

        // 3. 收集被删除的元素（逻辑索引 -> 物理索引）
        const deleted: T[] = [];
        for (let i = startIndex; i < startIndex + actualDeleteCount; i++) {
            const physicalIndex = (this.head + i) % this.capacity;
            deleted.push(this.buffer[physicalIndex]);
        }

        // 4. 生成当前有效元素的逻辑数组（通过get方法确保正确性）
        const currentElements: T[] = [];
        for (let i = 0; i < this.size; i++) {
            currentElements.push(this.get(i)); // 通过get方法获取逻辑索引对应的元素
        }

        // 5. 执行splice操作（插入新元素并调整长度）
        currentElements.splice(startIndex, actualDeleteCount, ...items);
        const newSize = Math.min(currentElements.length, this.capacity); // 截断至容量限制

        // 6. 清空原缓冲区并重新填充新元素
        this.clear(); // 重置head、tail、size为0
        for (let i = 0; i < newSize; i++) {
            this.buffer[i] = currentElements[i]; // 直接填充前newSize个位置
        }
        this.size = newSize;
        this.tail = newSize % this.capacity; // 更新tail（head保持0，因为逻辑数组从0开始）
        this.head = 0; // 有效元素从head=0开始（因为逻辑数组是连续的）

        return deleted;
    }

    remove(element: T, key?: string) {
        if (key) {
            this.splice(this.indexOf({ key, value: element }), 1);
        } else {
            this.splice(this.indexOf(element), 1);
        }
    }

    /**
     * 遍历数组
     * @param callback 回调函数，返回true时终止遍历
     */
    forEach(callback: (element: T, index: number) => boolean) {
        for (let i = 0; i < this.size; i++) {
            const element = this.get(i);
            if (!element) continue;
            if (callback(element, i)) break;
        }
    }

    clear(): void {
        this.head = 0;
        this.tail = 0;
        this.size = 0;
        // 可选：清空底层存储（视需求）
        this.buffer.fill(undefined);
    }
}