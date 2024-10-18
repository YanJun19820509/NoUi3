import { no } from "../no";
import { js } from "../yj";

/**
 * json 配置读取
 */
class Database {
    private tables: any;
    private data: string[];
    private tableNames: string[];
    public name: string;
    public loaded: boolean = false;

    private cCode = 94;

    constructor(file: string | any) {
        if (typeof file == 'string') this.loadFile(file);
        else this.init(file);
    }

    private init(file: any) {
        this.name = file.name;
        this.tables = {};
        this.tableNames = [];
        this.data = this.initData(file.json.data);
        for (const name in file.json.tables) {
            const a = file.json.tables[name];
            this.tables[name] = { ids: a.ids.split(String.fromCharCode(this.cCode)), properties: a.properties.split(String.fromCharCode(this.cCode)), offset: a.offset };
            this.tableNames.push(name);
        }
        this.loaded = true;
    }

    private loadFile(file: string) {
        no.assetBundleManager.loadJSON(file, item => {
            this.init(item.json);
            item.decRef();
        });
    }

    private allTablesData() {
        let d: any = {};
        this.tableNames.forEach(tn => {
            d[tn] = this.read(tn);
        });
        return d;
    }

    private initData(data: string) {
        const arr: any[] = data.split(String.fromCharCode(this.cCode));
        return arr.map(a => a == '' || isNaN(a) ? a : Number(a));
    }

    /**
     * 读取某表的部分配置
     * @param tableName 表名,如果为空则读取所有表数据
     * @param exprotIds 需要读取id，如果为空则读取所有id
     * @param exportProperties 需要读取的属性，如果为空则读取所有属性
     * @returns 
     */
    public read(tableName?: string, exprotIds?: string[], exportProperties?: string[]) {
        if (!tableName) return this.allTablesData();
        if (!this.tableNames.includes(tableName)) {
            return null;
        }
        const { ids, properties, offset }: { ids: string[], properties: string[], offset: number } = this.tables[tableName];
        let data: any = {};
        for (let i = 0, n = ids.length; i < n; i++) {
            const id = ids[i];
            if (id == null) continue;
            if (exprotIds && !exprotIds.includes(id)) continue;
            let d: any = {};
            for (let j = 0, m = properties.length; j < m; j++) {
                const p = properties[j];
                if (exportProperties && !exportProperties.includes(p)) continue;
                d[p] = this.data[offset + i * m + j];
            }
            data[id] = d;
        }
        //如果需要读取id为空或个数大于1，则返回整个数据
        if (!exprotIds || exprotIds?.length > 1)
            return data;
        //此时需要读取id个数为1
        //如果需要读取的属性只有一个，则返回该属性值
        if (exportProperties?.length == 1)
            return data[exprotIds[0]]?.[exportProperties[0]];
        //如果需要读取的属性为空或个数大于1，则返回需要读取id的整个数据
        return data[exprotIds[0]];
    }
}
class JsonConfig {
    private database: Map<string, Database> = new Map<string, Database>();

    public async loadDatabase(file: string | any) {
        const database = new Database(file);
        this.database.set(database.name, database);
        await no.waitFor(() => { return database.loaded; });
    }

    public async loadDatabases(files: (string | any)[]) {
        for (const file of files) await this.loadDatabase(file);
    }

    /**
     * 读取某表的部分配置
     * @param path 格式：databaseName.tableName[.exprotIds(id1,id2,...)[.exportProperties(p1,p2,...)]]
     */
    public read(path: string | string[]): any;
    /**
     * 读取某表的部分配置
     * @param databaseName 数据库名称
     * @param tableName 表名
     * @param exprotIds 需要读取id
     * @param exportProperties 需要读取的属性
     */
    public read(databaseName: string, tableName: string, exprotIds?: string[], exportProperties?: string[]): any;
    public read(databaseName: string | string[], tableName?: string, exprotIds?: string[], exportProperties?: string[]) {
        let dbn: string;
        if (!tableName) {
            const paths = typeof databaseName == 'string' ? databaseName.split('.') : databaseName;
            dbn = paths[0];
            tableName = paths[1];
            exprotIds = paths[2] ? paths[2].split(',') : null;
            exportProperties = paths[3] ? paths[3].split(',') : null;
        } else dbn = databaseName as string;
        const database = this.database.get(dbn);
        if (!database) return null;
        return database.read(tableName, exprotIds, exportProperties);
    }
}

export const YJJsonConfig = new JsonConfig();

js.mixin(no['DataCache'].prototype, {
    getJSON(path?: string | string[]): any {
        const a = YJJsonConfig.read(path);
        if (!a) no.err('配置数据不存在：', path);
        return a;
    },
    setJSON(json: Object): void {
        for (const key in json) {
            YJJsonConfig.loadDatabase({ name: key, json: json[key] });
        }
    }
});