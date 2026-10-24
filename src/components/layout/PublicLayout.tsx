import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}