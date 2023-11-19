import {promises as fs} from "fs"
import path from "path"
import { IPartitionReadWriteBackend, PartitionWriter } from "./partitionUtils"
import { IDocumentCache, getModifyTime, readDocumentCacheModifyTime } from "./cacheUtils"
import { getDataRoot } from "./fileUtils"

export function getAssetsRoot(): string {
    return path.resolve(process.cwd(), "public/assets") 
}

export function getAssetDirPath(indexName: string): string {
    return path.join(getAssetsRoot(), indexName)
}

export async function ensureAssetDir(indexName: string) {
    await fs.mkdir(getAssetDirPath(indexName), {recursive: true})
}

export const ASSET_Media = "medias"
export const ASSET_FullText = "fullText"
export const ASSET_PropertyReferences = "propertyReferences"
export const ASSET_PropertyValues = "propertyValues"
// const ASSET_Links = "links"

export function getAssetUrl(type: string, name: string) {
    return `/assets/${type}/${name}`
}

export function getAssetPath(type: string, name: string) {
    return path.join(getAssetDirPath(type), name)
}

export async function shouldDocumentAssetsUpdate(docPath: string[]): Promise<boolean> {
    const srcMTime = await getModifyTime(path.join(getDataRoot(), ...docPath)) ?? 0
    const cacheMTime = await readDocumentCacheModifyTime(docPath.join("/"))
    return srcMTime > cacheMTime
}

export async function applyDocumentOnAssets(id: string, document: IDocumentCache) {
    const fullTextPart = await openFullTextPartitions()
    const propValPart = await openPropertyValuePartitions()
    const propRefPart = await openPropertyReferencePartitions()

    // full text
    for(const term of Object.keys(document.fullTextTerms)) {
        const docs = await fullTextPart.get(term) ?? {}
        docs[id] = document.fullTextTerms[term]
        await fullTextPart.write(term, docs)
    }

    // property
    for(const prop of Object.keys(document.properties)) {
        const values = document.properties[prop]
        const propValues = await propValPart.get(prop) ?? {}

        for(const v of values) {
            propValues[v] ++
            
            const propRefs = await propRefPart.get(`${prop}/${v}`) ?? {}
            propRefs[id] = 1
            await propRefPart.write(`${prop}/${v}`, propRefs)
        }
        
        await propValPart.write(prop, propValues)
    }
}

export async function revertDocumentChangesOnAssets(id: string, document: IDocumentCache) {
    const fullTextPart = await openFullTextPartitions()
    const propRefPart = await openPropertyReferencePartitions()
    const propValPart = await openPropertyValuePartitions()

    // full text
    for(const term of Object.keys(document.fullTextTerms)) {
        const ctr = document.fullTextTerms[term]
        const docs = await fullTextPart.get(term) ?? {}
        delete docs[id]
        if (isObjectEmpty(docs)) {
            await fullTextPart.delete(term)
        } else {
            await fullTextPart.write(term, docs)
        }
    }

    // property
    for(const prop of Object.keys(document.properties)) {
        const values = document.properties[prop]
        const propValues = await propValPart.get(prop) ?? {}

        for(const v of values) {
            propValues[v] --
            if (propValues[v] === 0) {
                delete propValues[v]
            }

            const propRefs = await propRefPart.get(`${prop}/${v}`) ?? {}
            delete propRefs[id]
            if (isObjectEmpty(propRefs)) {
                await propRefPart.delete(`${prop}/${v}`)
            } else {
                await propRefPart.write(`${prop}/${v}`, propRefs)
            }
        }

        if (isObjectEmpty(propValues)) {
            await propValPart.delete(prop)
        } else {
            await propValPart.write(prop, propValues)
        }
    }
}

function isObjectEmpty(obj: {}) {
    return JSON.stringify(obj) === "{}"
}

// {[doc]: count}
export async function openFullTextPartitions(): Promise<PartitionWriter<Record<string, number>>> {
    await ensureAssetDir(ASSET_FullText)
    const backend = new PartitionFsBackend(getAssetDirPath(ASSET_FullText))
    return new PartitionWriter(backend)
}

// {[value]: count}
export async function openPropertyValuePartitions(): Promise<PartitionWriter<Record<string, number>>> {
    await ensureAssetDir(ASSET_PropertyValues)
    const backend = new PartitionFsBackend(getAssetDirPath(ASSET_PropertyValues))
    return new PartitionWriter(backend)
}

// prop/value => {[doc]: 1}
export async function openPropertyReferencePartitions(): Promise<PartitionWriter<Record<string, 1>>> {
    await ensureAssetDir(ASSET_PropertyReferences)
    const backend = new PartitionFsBackend(getAssetDirPath(ASSET_PropertyReferences))
    return new PartitionWriter(backend)
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
