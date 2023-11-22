import {LRUCache} from "lru-cache"
import { IPartitionReadonlyBackend, PartitionReader } from "./partitionUtils";
import * as assetUtils from "@/lib/assetUtils"

const baseURI = ""

export class PartitionHttpBackend implements IPartitionReadonlyBackend {
    private readonly cache: LRUCache<string, {exists: true, value: string} | {exists: false}>

    constructor(private baseURI: string) {
        this.cache = new LRUCache({
            max: 26*26
        })
    }

    async read(name: string): Promise<string | null> {
        const cachedData = this.cache.get(name)
        if (cachedData) {
            console.debug(`Using cached data: ${name}`)
            return cachedData.exists ? cachedData.value : null
        }

        const url = `${this.baseURI}/${name}.json`
        const resp = await fetch(url)
        if (resp.status < 400) {
            const data = await resp.text()
            this.cache.set(name, {exists: true, value: data})
            return data
        } else if (resp.status === 404) {
            this.cache.set(name, {exists: false})
            return null
        } else {
            throw new Error(`Invalid request on ${url}: ${resp.status} ${resp.statusText}`)
        }
    }
}

const backendFullText = new PartitionHttpBackend(`${baseURI}/assets/${assetUtils.ASSET_FullText}`)

export async function fetchDocumentFullTextIndex(term: string): Promise<Record<string, number>> {
    const partition = new PartitionReader<Record<string, number>>(backendFullText)

    const documents = await partition.get(term)
    return documents ?? {}
}

const backendPropVal = new PartitionHttpBackend(`${baseURI}/assets/${assetUtils.ASSET_PropertyValues}`)

export async function fetchDocumentPropertyValues(property: string): Promise<Record<string, number>> {
    const partition = new PartitionReader<Record<string, number>>(backendPropVal)

    return await partition.get(property) ?? {}
}

const backendPropRef = new PartitionHttpBackend(`${baseURI}/assets/${assetUtils.ASSET_PropertyReferences}`)

export async function fetchDocumentPropertyReferences(property: string, value: string): Promise<string[]> {
    const partition = new PartitionReader<Record<string, 1>>(backendPropRef)

    return Object.keys(await partition.get(`${property}/${value}`) ?? {})
}
