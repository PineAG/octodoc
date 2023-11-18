import {promises as fs} from "fs"
import path from "path"

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


