import { IDirData, IFileData, PathData } from "@/lib/fileUtils";
import { renderData } from "@/lib/loadUtils";

export function PathDataView(props: PathData) {
    if (props.type === "dir") {
        return <DirDataView {...props}/>
    } else {
        return <FileDataView {...props}/>
    }
}

export function DirDataView(props: IDirData) {
    const indexContent = props.indexFile ? <FileContentView {...props.indexFile}/> : null
    return <div>
        <div>{JSON.stringify(props.children)}</div>
        <div>{indexContent}</div>
    </div>
}

export function FileDataView(props: IFileData) {
    return <FileContentView {...props}/>
}

export function FileContentView(props: IFileData) {
    return <div>
        <div>{renderData(props.content)}</div>
    </div>
}
