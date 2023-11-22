import { SearchInput, SearchProvider, SearchResultConsumer, UpdateHashBySearchKeywords } from "@/components/SearchComponents";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card, Spinner, Stack } from "react-bootstrap";

function Page() {
    const value = window.location.hash.slice(1, window.location.hash.length)
    const hash = decodeURI(value)
    return <SearchProvider autoSearch initValue={hash}>
        <UpdateHashBySearchKeywords/>
        <Stack style={{marginLeft: '20px', marginRight: "20px"}}>
            <Card body style={{margin: "10px"}}>
                <Stack>
                    <Logo/>
                    <SearchInput/>
                </Stack>
            </Card>
            <SearchResultConsumer>{results => {
                if (results.state === "pending") {
                    return <div style={{display: 'grid', placeItems: "center"}}>
                        <Spinner/>
                    </div>
                }

                return <Stack>
                    {results.result.map(it => (
                        <Card body key={it} style={{margin: "10px"}}>
                            <Link href={`/view/${it}`}>/{it}</Link>
                        </Card>
                    ))}
                </Stack>
            }}</SearchResultConsumer>
        </Stack> 
    </SearchProvider>
}

function Logo() {
    return <div style={{width: "100%", height: "200px", display: "grid", placeItems: "center"}}>
        <div style={{fontSize: "64px"}}>
            OctoDoc
        </div>
    </div>
}


export default dynamic(() => Promise.resolve(Page), {ssr: false})
