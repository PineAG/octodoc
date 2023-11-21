import remarkParse from "remark-parse"
import rehypeStringify from "rehype-stringify"
import remarkFrontMatter from "remark-frontmatter"
import * as unist from "unist"
import {visit} from "unist-util-visit"

import config from "@/../next.config"

import remarkRehype from "remark-rehype"
import yaml from "yaml"

import type { ReactNode } from "react";
import type { IFileLoaderExtractionContext, IFileRenderer } from "./loadUtils";
import { unified } from "unified";
import type * as mdast from "mdast"
import { Accordion } from "react-bootstrap"

export interface MarkdownResult {
    properties: Record<string, string[]>
    content: string
}

const basePath = config.basePath ?? ""

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
            <div dangerouslySetInnerHTML={{__html: data.content}}/>
            <Accordion>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>
                        浏览属性
                    </Accordion.Header>
                    <Accordion.Body>
                        <pre>{JSON.stringify(data.properties, null, 2)}</pre>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    }
}

function convertNode(tree: unist.Node, parent: string[], context: IFileLoaderExtractionContext) {
    visit(tree, "link", (node: mdast.Link) => {
        if (!node.url.startsWith("http")) {
            if(!node.url.startsWith("/")) {
                node.url = "/" + node.url
            }
            node.url = `${basePath}/view${node.url}`
        }
    })

    visit(tree, "image", (node: mdast.Image) => {
        node.url = `${basePath}${context.addMedia(node.url)}`
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
    const segments = source.split(/[^\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AFa-zA-Z\u00C0-\u00FF]+/g)
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
