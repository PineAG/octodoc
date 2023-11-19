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
        
        const properties = extractProperties(headerData)
        for(const key of Object.keys(properties)) {
            const values = properties[key]
            for(const v of values) {
                context.addProperty(key, v)
            }
        }

        for(const term of extractFullTextTerms(source)) {
            context.addFullTextTerm(term)
        }

        return {
            properties: properties,
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

function extractProperties(obj: any): Record<string, string[]> {
    return Object.fromEntries(extractPropertiesInternal(obj))
}

function* extractPropertiesInternal(obj: any, prefix: string = ""): Generator<[string, string[]]> {
    if(Array.isArray(obj)) {
        yield [prefix, obj.map(it => it.toString())]
    } else if(isPrimitive(obj)) {
        yield [prefix, [obj.toString()]]
    } else {
        for(const [k, v] of Object.entries(obj)) {
            yield* extractPropertiesInternal(v, `${prefix}/${k}`)
        }
    }
}

function isPrimitive(obj: {}): obj is object {
    return typeof obj != "object" && obj !== null
}

const FullTextTermMinLength = 2
const FullTextTermMaxLength = 20

function* extractFullTextTerms(source: string): Generator<string> {
    const segments = source.split(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~\s \n]+/g)
    for(const s of segments) {
        if (s.length === 0) continue;

        if(s.match(/^\w+$/)) {
            for(let len = FullTextTermMinLength; len <= Math.min(FullTextTermMaxLength, s.length); len++) {
                yield s.slice(0, len)
            }
        } else {    
            for(let len = FullTextTermMinLength; len <= Math.min(FullTextTermMaxLength, s.length); len++) {
                for(let start = 0; start < s.length - len + 1; start++) {
                    yield s.slice(start, start + len)
                }
            }
        }
    }
}
