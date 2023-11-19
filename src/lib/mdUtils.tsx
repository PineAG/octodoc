import remarkParse from "remark-parse"
import rehypeStringify from "rehype-stringify"
import remarkFrontMatter from "remark-frontmatter"
import * as unist from "unist"
import {visit} from "unist-util-visit"

import remarkRehype from "remark-rehype"
import yaml from "yaml"

import type { ReactNode } from "react";
import type { IFileLoaderExtractionContext, IFileRenderer } from "./loadUtils";
import { unified } from "unified";
import type * as mdast from "mdast"

export interface MarkdownResult {
    properties: Record<string, string[]>
    content: string
}

export class MarkdownRenderer implements IFileRenderer<MarkdownResult> {
    async loadFile(context: IFileLoaderExtractionContext, source: string, parentPath: string[]): Promise<MarkdownResult> {
        const headerData: {} = {}
        const html = await unified()
            .use(remarkFrontMatter, ['yaml'])
            .use(() => (tree) => {
                const root = tree as unist.Parent
                const yamlValues = root.children.filter(it => it.type === "yaml").map(it => (it as unknown as {value: string})["value"])
                root.children = root.children.filter(it => it.type !== "yaml")
                for(const obj of yamlValues) {
                    Object.assign(headerData, yaml.parse(obj))
                }
            })
            .use(() => (tree) => convertNode(tree, parentPath, context))
            .use(remarkParse)
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(source)
        
        return {
            properties: headerData,
            content: String(html)
        }
    }
    render(data: MarkdownResult): ReactNode {
        return <div>
            <pre>{JSON.stringify(data.properties, null, 2)}</pre>
            <div dangerouslySetInnerHTML={{__html: data.content}}/>
        </div>
    }
}

function convertNode(tree: unist.Node, parent: string[], context: IFileLoaderExtractionContext) {
    visit(tree, "link", (node: mdast.Link) => {
        if (!node.url.startsWith("http")) {
            node.url = `/view/${parent.join("/")}/${node.url}`
        }
    })

    visit(tree, "image", (node: mdast.Image) => {
        node.url = context.addMedia(node.url)
    })
}