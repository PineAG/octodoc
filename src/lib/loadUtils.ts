import {promises as fs} from "fs"
import path from "path"
import { IPartitionReadWriteBackend } from "./partitionUtils"
import type {ReactNode} from "react"

export interface IFileRenderersConfig {
    [key: string]: IFileRenderer<any>
}

export interface IFileRenderer<T> {
    loadFile(context: IFileLoaderExtractionContext): T
    render(data: T): ReactNode
}

export interface IFileLoaderExtractionContext {
    addProperty(name: string, value: string): void
    addMedias(name: string, value: string): void
    addFullTextTerm(term: string): void
}

export class PartitionFsBackend<T> implements IPartitionReadWriteBackend {
    constructor(private readonly rootDir: string) {
    }

    async write(name: string, content: string): Promise<void> {
        const p = this.getFilePath(name)
        await fs.writeFile(p, content, {encoding: "utf-8"})
    }

    async delete(name: string): Promise<void> {
        await fs.unlink(this.getFilePath(name))
    }

    async read(name: string): Promise<string | null> {
        const p = this.getFilePath(name)
        try {
            return await fs.readFile(p, {encoding: "utf-8"})
        } catch(e) {
            return null
        }
    }

    private getFilePath(name: string): string {
        return path.join(this.rootDir, `${name}.json`)
    }
}