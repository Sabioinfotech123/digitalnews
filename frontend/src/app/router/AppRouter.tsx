import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { RequireAdmin } from '@/app/router/RequireAdmin'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminNewsCreatePage, AdminNewsEditPage } from '@/pages/admin/AdminNewsFormPage'
import {
  AdminFeaturedNewsPage,
  AdminLatestNewsPage,
  AdminMoreNewsPage,
  AdminNewsPage,
  AdminTrendingNewsPage,
} from '@/pages/admin/AdminNewsPage'
import { AdminSectionPage } from '@/pages/admin/AdminSectionPage'
import { AdminTagsPage } from '@/pages/admin/AdminTagsPage'
import { HomePage } from '@/pages/public/HomePage'
import { LivePage } from '@/pages/public/LivePage'
import { NewsDetailPage } from '@/pages/public/NewsDetailPage'
import { ShortsPage } from '@/pages/public/ShortsPage'
import { VideoDetailPage } from '@/pages/public/VideoDetailPage'
import { VideosPage } from '@/pages/public/VideosPage'

function PublicPage({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}

function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-[1200px] px-5 py-8">
      <h1 className="m-0 border-l-4 border-primary pl-3 font-heading text-ink">{title}</h1>
    </main>
  )
}

function AdminModule({
  titleKey,
}: {
  titleKey: 'admin.blogs' | 'admin.videos' | 'admin.media' | 'admin.users' | 'admin.settings' | 'admin.profile'
}) {
  const { t } = useLanguage()
  return <AdminSectionPage title={t(titleKey)} />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage><HomePage /></PublicPage>} />
      <Route path="/live" element={<PublicPage><LivePage /></PublicPage>} />
      <Route path="/videos" element={<PublicPage><VideosPage /></PublicPage>} />
      <Route path="/videos/:slug" element={<PublicPage><VideoDetailPage /></PublicPage>} />
      <Route path="/shorts" element={<PublicPage><ShortsPage /></PublicPage>} />
      <Route path="/today-news" element={<PublicPage><Placeholder title="Today News" /></PublicPage>} />
      <Route path="/news" element={<PublicPage><Placeholder title="News" /></PublicPage>} />
      <Route path="/news/:slug" element={<PublicPage><NewsDetailPage /></PublicPage>} />
      <Route path="/blogs" element={<PublicPage><Placeholder title="Blogs" /></PublicPage>} />
      <Route path="/login" element={<PublicPage><Placeholder title="Login" /></PublicPage>} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="news" element={<AdminNewsPage />} />
          <Route path="news/featured" element={<AdminFeaturedNewsPage />} />
          <Route path="news/latest" element={<AdminLatestNewsPage />} />
          <Route path="news/trending" element={<AdminTrendingNewsPage />} />
          <Route path="news/more" element={<AdminMoreNewsPage />} />
          <Route path="news/create" element={<AdminNewsCreatePage />} />
          <Route path="news/create/:newsType" element={<AdminNewsCreatePage />} />
          <Route path="news/:newsType/edit/:id" element={<AdminNewsEditPage />} />
          <Route path="news/edit/:id" element={<AdminNewsEditPage />} />
          <Route path="blogs" element={<AdminModule titleKey="admin.blogs" />} />
          <Route path="videos" element={<AdminModule titleKey="admin.videos" />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
          <Route path="media" element={<AdminModule titleKey="admin.media" />} />
          <Route path="users" element={<AdminModule titleKey="admin.users" />} />
          <Route path="settings" element={<AdminModule titleKey="admin.settings" />} />
          <Route path="profile" element={<AdminModule titleKey="admin.profile" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
