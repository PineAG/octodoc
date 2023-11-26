import type { AppProps } from 'next/app'
import 'bootstrap/dist/css/bootstrap.min.css'
import { SessionProvider } from 'next-auth/react'


export default function MyApp({ Component, pageProps }: AppProps) {
  return <SessionProvider>
    <Component {...pageProps} />
  </SessionProvider>
}
