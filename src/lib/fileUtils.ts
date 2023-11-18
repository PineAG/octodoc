import {promises as fs} from "fs"
import path from "path"

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
    console.log(filePath)

    try {
        await fs.access(filePath, fs.constants.F_OK)
    } catch(ex) {
        console.log("SHIT")
        return null;
    }

    const stat = await fs.stat(root)

    if (stat.isDirectory()) {
        return {
            type: "dir",
            name: "test",
            parent: [],
            children: {
                dirs: [],
                files: []
            }
        }
    } else if (stat.isFile()) {
        return {
            type: "file",
            name: "test",
            parent: [],
        }
    } else {
        return null
    }
}
