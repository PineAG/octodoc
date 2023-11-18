import crypto from "crypto-js"

export interface IPartitionReadonlyBackend {
    read(name: string): Promise<string | null>
}

export interface IPartitionReadWriteBackend extends IPartitionReadonlyBackend {
    write(name: string, content: string): Promise<void>
    delete(name: string): Promise<void>
}

export interface IPartitionReader<T> {
    get(name: string): Promise<T | null>
}

export interface IPartitionWriter<T> extends IPartitionReader<T> {
    write(name: string, value: T): Promise<void>
    delete(name: string): Promise<void>
}

const PartitionPrefixLength = 2

interface PartitionDataset<T> {
    [key: string]: T | undefined
}

export function getPartitionName(name: string): string {
    return crypto.SHA256(name).toString().slice(0, PartitionPrefixLength)
}

export class PartitionReader<T> implements IPartitionReader<T> {
    private readonly readonlyBackend: IPartitionReadonlyBackend

    constructor(readonlyBackend: IPartitionReadonlyBackend) {
        this.readonlyBackend = readonlyBackend
    }

    async get(name: string): Promise<T | null> {
        const partition = await this.readPartition(name)
        if (partition === null) {
            return null
        }

        return partition[name] ?? null
    }

    protected async readPartition(name: string): Promise<PartitionDataset<T> | null> {
        const s = await this.readonlyBackend.read(getPartitionName(name))
        if (s === null) {
            return null
        }

        return JSON.parse(s) as PartitionDataset<T>
    }

}

export class PartitionWriter<T> extends PartitionReader<T> implements IPartitionWriter<T> {
    private readonly readwriteBackend: IPartitionReadWriteBackend

    constructor(readwriteBackend: IPartitionReadWriteBackend) {
        super(readwriteBackend)
        this.readwriteBackend = readwriteBackend
    }

    async write(name: string, value: T): Promise<void> {
        const partition = await this.readPartition(name) ?? {}
        partition[name] = value
        await this.writePartition(name, partition)
    }

    async delete(name: string): Promise<void> {
        const partition = await this.readPartition(name)
        if (partition === null) {
            return
        }

        delete partition[name]
        await this.writePartition(name, partition)
    }

    private async writePartition(name: string, partition: PartitionDataset<T>): Promise<void> {
        const s = JSON.stringify(partition, null, 2)

        if (s === "{}") { // partition is empty
            await this.readwriteBackend.delete(getPartitionName(name))
        } else {
            await this.readwriteBackend.write(getPartitionName(name), s)
        }
    } 

}