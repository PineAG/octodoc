import { SearchPage } from "@/components/SearchComponents";
import dynamic from "next/dynamic";

function Page() {
    const value = window.location.hash.slice(1, window.location.hash.length)
    const hash = decodeURI(value)
    return <SearchPage keywords={hash}/>
}

export default dynamic(() => Promise.resolve(Page), {ssr: false})
