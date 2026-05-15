import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUiStore } from '../../store/ui.store'

export function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-full bg-stone-950">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-20 w-72 transition-transform duration-200
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={() => useUiStore.getState().setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto" data-scroll-container>
        <Outlet />
      </div>
    </div>
  )
}
