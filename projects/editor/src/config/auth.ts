import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"

export const nextAuthConfig = {
    secret: "change-it",
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
            username: { label: "Email", type: "text", placeholder: "用户名" },
            password: { label: "Password", type: "password", placeholder: "密码" }
            },
            async authorize(credentials, req) {
            return {
                email: 'demo@agail.org',
                id: "demo"
            }
            }
        })
    ]
} satisfies NextAuthOptions