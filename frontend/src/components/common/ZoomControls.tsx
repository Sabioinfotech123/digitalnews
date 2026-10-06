import { Popover } from 'antd'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useZoom } from '@/app/providers/ZoomProvider'
import { cn } from '@/utils/cn'
import './ZoomControls.scss'

/** Magnifier with eye inside — default look/view mark at 100%. */
function LookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10.5" cy="10.5" r="6.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M15.2 15.2L20 20"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M7.1 10.5c.7-1.35 1.9-2.2 3.4-2.2s2.7.85 3.4 2.2c-.7 1.35-1.9 2.2-3.4 2.2s-2.7-.85-3.4-2.2z"
        fill="currentColor"
      />
      <circle cx="10.5" cy="10.5" r="1.15" fill="#fff" />
      <circle cx="10.95" cy="10.15" r="0.35" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

function ZoomFabIcon({ zoom }: { zoom: number }) {
  if (zoom > 1) {
    return <i className="fa-solid fa-magnifying-glass-plus" aria-hidden />
  }
  if (zoom < 1) {
    return <i className="fa-solid fa-magnifying-glass-minus" aria-hidden />
  }
  return <LookIcon className="zoom-fab__look-icon" />
}

/** Floating magnifier FAB — opens zoom panel on click (global, admin + public). */
export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = useZoom()
  const [open, setOpen] = useState(false)
  const percent = Math.round(zoom * 100)

  const panel = (
    <div className="zoom-fab__panel">
      <p className="zoom-fab__label">Page zoom</p>
      <div className="zoom-fab__row">
        <button
          type="button"
          className="zoom-fab__step"
          aria-label="Zoom out"
          disabled={!canZoomOut}
          onClick={zoomOut}
        >
          <i className="fa-solid fa-minus" aria-hidden />
        </button>
        <span className="zoom-fab__value">{percent}%</span>
        <button
          type="button"
          className="zoom-fab__step"
          aria-label="Zoom in"
          disabled={!canZoomIn}
          onClick={zoomIn}
        >
          <i className="fa-solid fa-plus" aria-hidden />
        </button>
      </div>
      <button type="button" className="zoom-fab__reset" onClick={resetZoom}>
        Reset
      </button>
    </div>
  )

  return createPortal(
    <div className="zoom-fab">
      <Popover
        content={panel}
        trigger="click"
        placement="topRight"
        open={open}
        onOpenChange={setOpen}
        arrow={false}
        getPopupContainer={() => document.body}
        overlayClassName="zoom-fab__popover"
      >
        <button
          type="button"
          className={cn('zoom-fab__trigger', open && 'is-open')}
          aria-label="Page zoom"
          aria-expanded={open}
          title="Page zoom"
        >
          <ZoomFabIcon zoom={zoom} />
        </button>
      </Popover>
    </div>,
    document.body,
  )
}
