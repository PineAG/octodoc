import { IDirData, IFileData, PathData } from "@/lib/fileUtils";
import { renderData } from "@/lib/loadUtils";
import Head from "next/head";
import { DirChildrenList } from "./FileComponents";
import dynamic from "next/dynamic";
import { SearchProvider, SearchWidget } from "@/components/SearchComponents";

export function PathDataView(props: PathData) {
    if (props.type === "dir") {
        return <DirDataView {...props}/>
    } else if (props.type === "file") {
        return <FileDataView {...props}/>
    } else {
        return null
    }
}

export function DirDataView(props: IDirData) {
    const indexContent = props.indexFile ? <FileContentView {...props.indexFile}/> : null
    return <div>
        <Head>
            <title>{props.name}</title>
        </Head>
        <SearchWidget/>
        <DirChildrenList
            parent={props.name !== "/" ? {
                title: props.parent[props.parent.length - 1] ?? "首页",
                url: `/view/${props.parent.join("/")}`
            } : null}
            dirs={props.children.dirs.map(name => ({title: name, url: `/view/${[...props.path, name].join("/")}`}))}
            files={props.children.files.map(name => ({title: name, url: `/view/${[...props.path, name].join("/")}`}))}
        />
        <div>{indexContent}</div>
    </div>
}

export function FileDataView(props: IFileData) {
    return <>
        <Head>
            <title>{props.name}</title>
        </Head>
        <SearchWidget/>
        <DirChildrenList
            parent={{
                title: props.parent[props.parent.length - 1],
                url: `/view/${props.parent.join("/")}`
            }}
            dirs={[]}
            files={[]}
        />
        <FileContentView {...props}/>
    </>
}

export function FileContentView(props: IFileData) {
    return <div>
        <div>{renderData(props.content)}</div>
    </div>
}
