import { DashboardLayout } from '@/components/DashboardLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner size={48} />
      </div>
    </DashboardLayout>
  )
} 