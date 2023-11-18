import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"
import {walkDataRoot, PathData, getPathData} from "@/lib/fileUtils"
import { PathDataView } from "@/components/PathViews"

export const getStaticPaths = (async () => {
    const filePaths: string[][] = []
    // for await(const p of walkDataRoot()) {
    //     filePaths.push(p)
    // }

    return {
      paths: filePaths.map(p => ({
        params: {
          file: p
        }
      })),
      fallback: true, // false or "blocking"
    }
  }) satisfies GetStaticPaths

export const getStaticProps = (async (context) => {
    const propsPath: string[] = (context.params?.file as string[]) ?? ["unknown"]
    const data = await getPathData(propsPath)

    if (data === null) {
        return {notFound: true}
    }

    return {props: data}
}) satisfies GetStaticProps<PathData>
 
export default function Page(props: InferGetStaticPropsType<typeof getStaticProps>) {
    return <PathDataView {...props}/>
}
