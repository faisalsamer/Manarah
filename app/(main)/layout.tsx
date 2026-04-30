import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div
        className="flex flex-col min-h-screen"
        style={{ marginRight: 'var(--sidebar-width)' }}
      >
        <Header />
        {children}
      </div>
    </>
  )
}
