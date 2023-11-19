import Link from "next/link"
import {ListGroup, ListGroupItem} from "react-bootstrap"
import { BsFolder, BsFileText, BsArrowUp } from 'react-icons/bs'

export interface ChildItem {
    title: string
    url: string
}

export interface DirChildrenListProps {
    parent: ChildItem | null
    dirs: ChildItem[]
    files: ChildItem[]
}

export function DirChildrenList(props: DirChildrenListProps) {
    let arrowUp: React.ReactNode = null
    if (props.parent) {
        arrowUp = <ListGroupItem>
            <Link href={props.parent.url}>
                <BsArrowUp className="me-2" />
                {props.parent.title}
            </Link>
        </ListGroupItem>
    }

    return <ListGroup>
        {arrowUp}
        {props.dirs.map(it => (
            <ListGroupItem key={it.url}>
                <Link href={it.url}>
                    <BsFolder className="me-2" />
                    {it.title}
                </Link>
            </ListGroupItem>
        ))}
        {props.files.map(it => (
            <ListGroupItem key={it.url}>
                <Link href={it.url}>
                    <BsFileText className="me-2" />
                    {it.title}
                </Link>
            </ListGroupItem>
        ))}
    </ListGroup>
}