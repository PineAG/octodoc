import {promises as fs} from "fs"
import path from "path"
import { ILoadFileResult, canBeRendered, loadSourceFile } from "./loadUtils"

export interface IDirData {
    type: "dir"
    name: string
    parent: string[]
    path: string[]
    children: {
        dirs: string[]
        files: string[]
    },
    indexFile: IFileData | null
}

export interface IFileData {
    type: "file"
    parent: string[]
    path: string[]
    name: string
    content: ILoadFileResult
}

export type PathData = IDirData | IFileData

export function getDataRoot(): string {
    const absolute = path.resolve(process.cwd(), "data")
    return absolute 
}

export async function* walkDataRoot(): AsyncGenerator<string[]> {
    const root = getDataRoot()
    yield* walkDataRootInternal(root, [])
}

async function* walkDataRootInternal(root: string, prefix: string[]): AsyncGenerator<string[]> {
    yield prefix
    const p = path.join(root, ...prefix)

    for(const ch of await fs.readdir(p, {withFileTypes: true})) {
        if (ch.isDirectory()) {
            yield* walkDataRootInternal(root, [...prefix, ch.name])
        } else if (isIndexFile(ch.name)) {
            // pass
        } else if (canBeRendered(ch.name)) {
            yield [...prefix, ch.name]
        }
    }
}

export async function getPathData(propsPath: string[]): Promise<PathData | null> {
    const root = getDataRoot()
    const filePath = path.join(root, ...propsPath)

    try {
        await fs.access(filePath, fs.constants.F_OK)
    } catch(ex) {
        return null;
    }

    const stat = await fs.stat(filePath)

    if (stat.isDirectory()) {
        let indexFile: string | null = null
        let dirs: string[] = []
        let files: string[] = []

        for(const ch of await fs.readdir(filePath, {withFileTypes: true})) {
            if (ch.isDirectory()) {
                dirs.push(ch.name)
            } else if (isIndexFile(ch.name)) {
                if (indexFile) {
                    throw Error(`Multiple index files in ${filePath}`)
                }
                indexFile = ch.name
            } else if (canBeRendered(ch.name)) {
                files.push(ch.name)
            }
        }

        let indexData = indexFile ? await renderFile(propsPath, [...propsPath, indexFile]) : null

        return {
            type: "dir",
            name: propsPath[propsPath.length - 1] ?? "/",
            parent: propsPath.slice(0, propsPath.length - 1),
            path: propsPath,
            children: {
                dirs,
                files
            },
            indexFile: indexData
        }
    } else if (stat.isFile()) {
        return renderFile(propsPath, propsPath)
    } else {
        return null
    }
}

async function renderFile(propsPath: string[], filePropsPath: string[]): Promise<IFileData> {
    const root = getDataRoot()
    const filePath = path.join(root, ...filePropsPath)
    const content = await loadSourceFile(filePath, filePropsPath.slice(0, -1))

    return {
        type: "file",
        parent: propsPath.slice(0, propsPath.length - 1),
        path: propsPath,
        name: propsPath[propsPath.length - 1] ?? "/",
        content
    }
}

function isIndexFile(name: string): boolean {
    return name.startsWith("index.")
}