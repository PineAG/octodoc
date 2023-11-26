import * as IoTs from "io-ts"
import * as FpTs from "fp-ts"
import { NextApiRequest, NextApiResponse } from "next";
import { DefaultSession, getServerSession } from "next-auth";
import { nextAuthConfig } from "@/config/auth";

export interface UserInSession {
    email: string
    name: string
}

export type HttpVerb = "GET" | "POST" | "PUT" | "DELETE"

export function asAPI<TRequestDef extends IoTs.Any, TResponse>(
    expectedMethod: HttpVerb,
    requestType: TRequestDef,
    action: (req: IoTs.TypeOf<TRequestDef>, user: UserInSession) =>
        Promise<TResponse>) :
            (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
    return async (req, res) => {
        const session = await getServerSession(req, res, nextAuthConfig)
        const user = session?.user as DefaultSession["user"] | undefined
        if (!user) {
            res.status(401).json({message: "Unauthorized."})
            return
        }

        const extractedUser: UserInSession = {
            email: assertNotNullString(user.email, "email"),
            name: assertNotNullString(user.name, "name")
        }

        if (req.method !== expectedMethod) {
            res.status(405).json({message: `Method not allowed: ${req.method}`})
            return
        }

        const parseRequest = requestType.decode(req.body)
        return await FpTs.either.fold(
            async (err: IoTs.Errors) => {
                const message = err.map(it => it.message).join(";")
                res.status(400).json({message: `Invalid request : ${message}\n${JSON.stringify(req.body)}`})
            },
            async (value: IoTs.TypeOf<TRequestDef>) => {
                let result: TResponse
                try {
                    result = await action(value, extractedUser)
                    res.status(200).json(result)
                } catch(ex) {
                    res.status(500).json({message: ex?.toString()})
                }
            })(parseRequest)
    }
}

function assertNotNullString(v: string | undefined | null, name: string): string {
    if(!v) {
        throw new Error(`Invalid ${name}`)
    }
    return v
}
