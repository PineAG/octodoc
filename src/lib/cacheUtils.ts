import path from "path";
import crypto from "crypto-js"
import { promises as fs } from "fs";

export function getCacheRoot(type: string) {
    return path.resolve(process.cwd(), "tmp", "cache", type)
}

export async function ensureCacheRoot(type: string) {
    const p = getCacheRoot(type)
    await fs.mkdir(p, {recursive: true})
}

const Type_Documents = "documents"

function getDocumentPath(name: string) {
    const shortName = crypto.SHA256(name).toString()
    const root = getCacheRoot(Type_Documents)
    return path.join(root, `${shortName}.json`)
}

export interface IDocumentCache {
    properties: Record<string, string[]>
    fullTextTerms: Record<string, number>
}

export async function readDocumentCacheModifyTime(name: string): Promise<number> {
    return await getModifyTime(getDocumentPath(name)) ?? 0
}

export async function readDocumentCache(name: string[]): Promise<IDocumentCache | null> {
    const p = getDocumentPath(name.join("/"))
    let content: string
    try {
        content = await fs.readFile(p, {encoding: "utf-8"})
    } catch(err) {
        return null
    }

    return JSON.parse(content)
}

export async function writeDocumentCache(name: string[], cache: IDocumentCache): Promise<void> {
    await ensureCacheRoot(Type_Documents)
    const p = getDocumentPath(name.join("/"))

    const content = JSON.stringify(cache, null, 2)
    await fs.writeFile(p, content, {encoding: "utf-8"})
}

export async function getModifyTime(fp: string): Promise<number | null> {
    let stat: Awaited<ReturnType<typeof fs.stat>>
    try {
        stat = await fs.stat(fp)
    } catch(ex) {
        return null
    }

    return stat.mtime.getTime()
}
