import { IDirData, IFileData, PathData } from "@/lib/fileUtils";
import { renderData } from "@/lib/loadUtils";
import Head from "next/head";
import { DirChildrenList } from "./FileComponents";
import dynamic from "next/dynamic";
import { SearchProvider, SearchWidget } from "@/components/SearchComponents";
import { DefaultNavBar } from "./Layouts";
import { Breadcrumb, Card, Col, Container, Row } from "react-bootstrap";
import React from "react";
import Link from "next/link";
import { BsHouse } from "react-icons/bs";

export function PathDataView(props: PathData) {
    if (props.type === "dir") {
        return <DirDataView {...props}/>
    } else if (props.type === "file") {
        return <FileDataView {...props}/>
    } else {
        return null
    }
}

export function DirDataView(props: IDirData) {
    const indexContent = props.indexFile ? <FileContentView {...props.indexFile}/> : null
    return <div>
        <Head>
            <title>{props.name}</title>
        </Head>
        <DefaultNavBar/>
        <Container fluid>
            <Row>
                <Col lg="4" md="12">
                    <ContentCard>
                        <PagePathBar path={props.path} />
                        <DirChildrenList
                            dirs={props.children.dirs.map(name => ({title: name, url: `/view/${[...props.path, name].join("/")}`}))}
                            files={props.children.files.map(name => ({title: name, url: `/view/${[...props.path, name].join("/")}`}))}
                        />
                    </ContentCard>
                </Col>
                {indexContent ? (
                    <Col lg="8" md="12">
                        <ContentCard>
                            <div>{indexContent}</div>
                        </ContentCard>
                    </Col>
                ) : null}
            </Row>
        </Container>
    </div>
}

export function FileDataView(props: IFileData) {
    return <>
        <Head>
            <title>{props.name}</title>
        </Head>
        <DefaultNavBar/>
        <ContentCard>
            <PagePathBar path={props.path} />
            <DirChildrenList
                dirs={[]}
                files={[]}
            />
            <FileContentView {...props}/>
        </ContentCard>
    </>
}

export function FileContentView(props: IFileData) {
    return <div>
        <div>{renderData(props.content)}</div>
    </div>
}

function ContentCard(props: {children: React.ReactNode}) {
    return <Card body style={{padding: '10px', margin: '10px'}}>
        {props.children}
    </Card>
}

function PagePathBar(props: {path: string[]}) {
    if (props.path.length === 0) {
        return <Breadcrumb>
            <Breadcrumb.Item active>
                <BsHouse/>
            </Breadcrumb.Item>
        </Breadcrumb>;
    }
    const parents = props.path.slice(0, -1)
    const current = props.path[props.path.length - 1]

    return <Breadcrumb>
        <Breadcrumb.Item href="/view">
            <BsHouse/>
        </Breadcrumb.Item>
        {parents.map((it, i) => (
            <Breadcrumb.Item key={i} href={`/view/${props.path.slice(0, i+1).join("/")}`}>
                {it}
            </Breadcrumb.Item>
        ))}
        <Breadcrumb.Item active>{current}</Breadcrumb.Item>
    </Breadcrumb>
}