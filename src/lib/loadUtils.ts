import {promises as fs} from "fs"
import path from "path"
import crypto from "crypto-js"
import type {ReactNode} from "react"
import renderConfig from "@/config/render"
import * as assetUtils from "@/lib/assetUtils"
import { getDataRoot } from "./fileUtils"

export interface IFileRenderersConfig {
    [key: string]: IFileRenderer<any>
}

export interface IFileRenderer<T> {
    loadFile(context: IFileLoaderExtractionContext, source: string, parentPath: string[]): Promise<T>
    render(data: T): ReactNode
}

export interface ILoadFileResult {
    type: string
    title: string
    content: any
}

export function canBeRendered(fp: string): boolean {
    const category = path.extname(fp)
    return !!(renderConfig as Partial<IFileRenderersConfig>)[category]
}

export async function loadSourceFile(fp: string, parentPropsPath: string[]): Promise<ILoadFileResult> {
    const parentPath = path.dirname(fp)
    const defaultTitle = path.basename(fp)
    const category = path.extname(fp)

    const renderer = (renderConfig as Partial<IFileRenderersConfig>)[category]
    if (!renderer) {
        throw new Error(`Renderer not found for '${category}'`)
    }

    const ctx = new LoadFileContext(parentPropsPath)
    const source = await fs.readFile(fp, {encoding: "utf-8"})
    const content = await renderer.loadFile(ctx, source, parentPropsPath)
    await ctx.finalize()
    return {
        title: defaultTitle,
        type: category,
        content
    }
}

export function renderData(data: ILoadFileResult): ReactNode {
    const renderer = (renderConfig as Partial<IFileRenderersConfig>)[data.type]
    if (!renderer) {
        throw new Error(`Renderer not found for '${data.type}'`)
    }

    return renderer.render(data.content)
}

export interface IFileLoaderExtractionContext {
    setTitle(name: string): void
    addProperty(name: string, value: string): void
    addMedia(name: string): string
    addFullTextTerm(term: string): void
}


class LoadFileContext implements IFileLoaderExtractionContext {
    public title: string | null = null
    public properties: Map<string, string[]> = new Map()
    public medias: Map<string, string> = new Map<string, string>()
    public fullTextTerms: Map<string, number> = new Map()

    constructor(private readonly parentPath: string[]) {

    }

    setTitle(title: string): void {
        this.title = title
    }

    addProperty(name: string, value: string): void {
        throw new Error("Method not implemented.")
    }

    addMedia(name: string): string {
        const extname = path.extname(name)
        const relativePath = [...this.parentPath, name].join("/")
        const shortName = crypto.SHA256(relativePath).toString() + extname
        this.medias.set(relativePath, shortName)
        return assetUtils.getAssetUrl(assetUtils.ASSET_Media, shortName)
    }

    addFullTextTerm(term: string): void {
        throw new Error("Method not implemented.")
    }

    async finalize() {
        const dataRoot = getDataRoot()
        
        await assetUtils.ensureAssetDir(assetUtils.ASSET_Media)
        for(const [inName, outName] of this.medias.entries()) {
            const inPath = path.join(dataRoot, inName)
            const outPath = assetUtils.getAssetPath(assetUtils.ASSET_Media, outName)

            await lazyCopy(inPath, outPath)
        }
    }
    
}

async function lazyCopy(fromPath: string, toPath: string) {
    const fromStat = await fs.stat(fromPath)
    const fromTime = fromStat.mtime
    let toTime: Date
    try {
        const toStat = await fs.stat(toPath)
        toTime = toStat.mtime
    } catch (ex) {
        toTime = new Date(0)
    }

    if (fromTime.getTime() > toTime.getTime()) {
        console.debug("Copying file ", fromPath, toPath)
        await fs.copyFile(fromPath, toPath)
    }
}
