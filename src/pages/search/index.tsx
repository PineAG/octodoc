import dynamic from "next/dynamic"

const DynSearch = dynamic(() => import("@/components/SearchComponents").then(it => it.SearchPage), {ssr: false})

export default function Page() {
    return <DynSearch keywords=""/>
}
