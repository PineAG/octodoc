import {promises as fs} from "fs"
import path from "path"
import { IPartitionReadWriteBackend } from "./partitionUtils"

export function getAssetsRoot(): string {
    return path.resolve(__dirname, "../../../public/assets") 
}

export function getAssetDirPath(indexName: string): string {
    return path.join(getAssetsRoot(), indexName)
}

export async function ensureAssetDir(indexName: string) {
    await fs.mkdir(getAssetDirPath(indexName), {recursive: true})
}

const ASSET_Media = "medias"
const ASSET_FullText = "fullText"
const ASSET_Properties = "properties"
// const ASSET_Links = "links"

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
