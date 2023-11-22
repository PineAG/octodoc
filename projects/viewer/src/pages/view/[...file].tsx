import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"
import {walkDataRoot, PathData, getPathData} from "@/lib/fileUtils"
import { PathDataView } from "@/components/PathViews"

export const getStaticPaths = (async () => {
    const filePaths: string[][] = []
    for await(const p of walkDataRoot()) {
        if(p.length === 0) continue;
        filePaths.push(p)
    }

    return {
      paths: filePaths.map(p => ({
        params: {
          file: p
        }
      })),
      fallback: false, // false or "blocking"
    }
  }) satisfies GetStaticPaths

export const getStaticProps = (async (context) => {
    const propsPath: string[] | undefined = (context.params?.file as string[])
    if (!propsPath) {
      throw new Error(`Missing property file`)
    }

    const data = await getPathData(propsPath)

    if (data === null) {
        return {notFound: true}
    }

    return {props: data}
}) satisfies GetStaticProps<PathData>
 
export default function Page(props: InferGetStaticPropsType<typeof getStaticProps>) {
    return <PathDataView {...props}/>
}
