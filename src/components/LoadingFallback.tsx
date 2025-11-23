/**
 * Loading fallback components for lazy-loaded components
 */

interface PanelSkeletonProps {
  width?: string
}

export function PanelSkeleton({ width = 'w-96' }: PanelSkeletonProps) {
  return (
    <div className={`${width} shrink-0 bg-background/50 backdrop-blur-sm animate-pulse p-4`}>
      <div className="h-8 bg-slate-700/50 rounded mb-4 w-3/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-700/30 rounded w-full"></div>
        <div className="h-4 bg-slate-700/30 rounded w-5/6"></div>
        <div className="h-4 bg-slate-700/30 rounded w-4/6"></div>
      </div>
    </div>
  )
}

export function FullscreenSkeleton() {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-300 animate-pulse">Loading 3D environment...</p>
      </div>
    </div>
  )
}

export function BackgroundSkeleton() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900" />
  )
}
