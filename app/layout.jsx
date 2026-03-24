import { ClerkProvider } from '@clerk/nextjs'
import Provider from './provider'
import './globals.css'

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
        </body>
      </html>
    </ClerkProvider>
  )
}
