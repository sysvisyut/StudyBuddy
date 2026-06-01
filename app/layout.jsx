import { ClerkProvider } from '@clerk/nextjs'
import Provider from './provider'
import './globals.css'
import { Toaster } from 'sonner'


export const metadata = {
  title: 'Study Buddy',
  description: 'AI Study Material Generator',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Provider>
            {children}
          </Provider>
          <Toaster/>
        </body>
      </html>
    </ClerkProvider>
  )
}
