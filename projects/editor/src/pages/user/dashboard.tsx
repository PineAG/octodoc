import {useSession} from "next-auth/react"

export default function Page() {
    const session = useSession()

    return <div>
        {JSON.stringify(session)}
    </div>
}