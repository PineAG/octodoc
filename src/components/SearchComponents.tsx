import React, { createContext, useContext, useEffect, useState } from "react"
import { Container, Col, Form, Row, Button, ListGroup } from "react-bootstrap"
import {useRouter} from "next/navigation"
import {useAsync} from "react-use"
import {makeAutoObservable, observable, action, reaction} from "mobx"
import {Observer, useLocalObservable} from "mobx-react-lite"
import { fetchDocumentFullTextIndex } from "@/lib/searchUtils"
import {BsSearch} from "react-icons/bs"
import Link from "next/link"
import { ReplaySubject, debounceTime } from "rxjs"

export interface SearchPageProps {
    keywords: string
}

export function SearchPage(props: SearchPageProps) {
    return <SearchProvider initValue={props.keywords} autoSearch={true} navigateBySearching={true}>
        <SearchInput/>
        <SearchResultList/>
    </SearchProvider>
}

export function SearchWidget() {
    return <SearchProvider autoSearch={false}>
        <SearchInput/>
        <SearchButton/>
    </SearchProvider>
}

export function SearchButton() {
    const onSearch = useOnSearch()
    return <Button onClick={onSearch}> <BsSearch /> 搜索</Button>
}

export function SearchInput() {
    const store = useContext(SearchContext)

    return <Observer>{() => (
        <Form.Control type="text" value={store.keywords} onChange={
            evt => {
                store.setKeywords(evt.target.value)
            }} />
    )}</Observer>
}

export function useOnSearch(): () => void {
    const store = useContext(SearchContext)
    const router = useRouter()

    return () => {
        router.push(`/search/${encodeURI(store.keywords)}`)
    }
}

export function SearchResultList() {
    const store = useContext(SearchContext)
    const router = useRouter()
    return <Observer>{() => {
        const results = store.searchResult
        if (results.state === "success") {
            return <ListGroup>
                {results.result.map(it => (
                    <ListGroup.Item key={it}>
                        <Link onClick={() => {
                            router.replace(`/search/${store.searchingKeywords}`)
                        }} href={`/view/${it}`}>{it}</Link>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        } else {
            return <div>Loading...</div>
        }
    }}</Observer>
}

type SearchResults = {state: "pending"} | {state: "success", result: string[]}

class SearchStore {
    keywords: string = ""
    searchingKeywords: string = ""
    searchResult: SearchResults = {state: "success", result: []}

    private searchSource = new ReplaySubject<string>()
    private searchPipe = this.searchSource.pipe(debounceTime(200))

    constructor(private readonly autoSearch: boolean) {
        makeAutoObservable(this, {
            keywords: observable,
            searchingKeywords: observable,
            searchResult: observable,
            setKeywords: action,
            startSearch: action,
            stopSearch: action
        })

        this.searchPipe.subscribe(keywords => this.search(keywords))
    }

    setKeywords(keywords: string) {
        this.keywords = keywords
        console.log(keywords)

        if(this.autoSearch) {
            this.searchSource.next(keywords)
        }
    }

    startSearch(keywords: string) {
        this.searchingKeywords = keywords
        this.searchResult = {state: "pending"}
    }

    stopSearch(result: string[]) {
        this.searchResult = {state: "success", result}
    }

    async search(keywords: string) {
        console.debug(`Searching ${keywords}`)
        this.startSearch(keywords)
        const result = await invokeSearching(keywords)
        this.stopSearch(result)
    }
}

async function invokeSearching(keywords: string): Promise<string[]> {
    const list = keywords.split(/\s+/).filter(it => !!it)
    if (list.length === 0) {
        return []
    }

    const results: Record<string, number> = {}
    for(const term of list) {
        Object.assign(results, await fetchDocumentFullTextIndex(term))
    }

    return Object.keys(results)
}

const SearchContext = createContext(new SearchStore(false))

export function SearchProvider(props: {initValue?: string, children: React.ReactNode, autoSearch: boolean, navigateBySearching?: boolean}) {
    const store = useLocalObservable(() => new SearchStore(props.autoSearch))

    useEffect(() => {
        store.setKeywords(props.initValue ?? "")
    }, [store, props.initValue])

    return <SearchContext.Provider value={store}>
        {props.children}
    </SearchContext.Provider>
}


