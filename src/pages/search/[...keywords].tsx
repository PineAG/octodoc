import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const DynSearch = dynamic(() => import("@/components/SearchComponents").then(it => it.SearchPage), {ssr: false})

export default function Page() {
    const params = useParams()
    let keywords: string
    if (!params) {
        keywords = ""
    } else {
        const query = params["keywords"]
        if (Array.isArray(query)) {
            keywords = query.join("/")
        } else {
            keywords = query
        }
    }
    return <DynSearch keywords={keywords}/>
}
