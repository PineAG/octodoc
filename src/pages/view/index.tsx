import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"
import { PathData, getPathData } from "@/lib/fileUtils"
import { PathDataView } from "@/components/PathViews"

export const getStaticProps = (async (context) => {
    const data = await getPathData([])

    if (data === null) {
        return {notFound: true}
    }

    return {props: data}
}) satisfies GetStaticProps<PathData>

export default function Page(props: InferGetStaticPropsType<typeof getStaticProps>) {
    return <PathDataView {...props}/>
}
