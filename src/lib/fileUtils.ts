import {promises as fs} from "fs"
import path from "path"
import { ILoadFileResult, canBeRendered, loadSourceFile } from "./loadUtils"

export interface IDirData {
    type: "dir"
    name: string
    parent: string[]
    children: {
        dirs: string[]
        files: string[]
    },
    indexFile?: IFileData
}

export interface IFileData {
    type: "file"
    parent: string[]
    name: string
    content: ILoadFileResult
}

export type PathData = IDirData | IFileData

export function getDataRoot(): string {
    return path.resolve(__dirname, "../../../data") 
}

export async function* walkDataRoot(): AsyncGenerator<string[]> {
    const root = getDataRoot()
    console.warn(root)
    yield []
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
        let indexFile: string | undefined
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

        let indexData = indexFile ? await renderFile([...propsPath, indexFile]) : undefined

        return {
            type: "dir",
            name: propsPath[propsPath.length - 1] ?? "/",
            parent: propsPath.slice(0, propsPath.length - 1),
            children: {
                dirs,
                files
            },
            indexFile: indexData
        }
    } else if (stat.isFile()) {
        return renderFile(propsPath)
    } else {
        return null
    }
}

async function renderFile(propsPath: string[]): Promise<IFileData> {
    const root = getDataRoot()
    const filePath = path.join(root, ...propsPath)
    const content = await loadSourceFile(filePath, propsPath.slice(0, propsPath.length-1))

    return {
        type: "file",
        parent: propsPath.slice(0, propsPath.length - 1),
        name: propsPath[propsPath.length - 1],
        content
    }
}

function isIndexFile(name: string): boolean {
    return name.startsWith("index.")
}