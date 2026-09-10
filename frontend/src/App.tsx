import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '@/styles/tailwind.css'
import '@/styles/global.scss'
import '@/styles/components.scss'
import '@/styles/responsive.scss'

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <DocumentTitle />
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  )
}
