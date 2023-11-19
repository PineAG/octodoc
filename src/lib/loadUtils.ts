import {promises as fs} from "fs"
import path from "path"
import type {ReactNode} from "react"
import renderConfig from "@/config/render"

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

    const ctx = new LoadFileContext()
    const source = await fs.readFile(fp, {encoding: "utf-8"})
    const content = await renderer.loadFile(ctx, source, parentPropsPath)
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
    addMedia(name: string, value: string): string
    addFullTextTerm(term: string): void
}


export class LoadFileContext implements IFileLoaderExtractionContext {
    public title: string | null = null
    public properties: Map<string, string[]> = new Map()
    public medias: Set<string> = new Set()
    public fullTextTerms: Map<string, number> = new Map()

    setTitle(title: string): void {
        this.title = title
    }

    addProperty(name: string, value: string): void {
        throw new Error("Method not implemented.")
    }

    addMedia(name: string, value: string): string {
        throw new Error("Method not implemented.")
    }

    addFullTextTerm(term: string): void {
        throw new Error("Method not implemented.")
    }
    
}

