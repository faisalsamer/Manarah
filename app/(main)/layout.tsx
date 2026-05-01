import Sidebar from '@/components/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div
        className="flex flex-col min-h-screen"
        style={{ marginRight: 'var(--sidebar-width)' }}
      >
        {children}
      </div>
    </>
  )
}
