"use client"

const preventDefaultPropagation = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
  e.nativeEvent.stopImmediatePropagation()
  e.nativeEvent.preventDefault()
  e.preventDefault()
  e.stopPropagation()
}

type PropagationStopperProps = React.HTMLAttributes<HTMLDivElement>

const PropagationStopper = ({ children, onClick, ...props }: PropagationStopperProps) => {
  return (
    <div
      {...props}
      onClick={(e) => {
        preventDefaultPropagation(e)
        if (onClick) onClick(e)
      }}
    >
      {children}
    </div>
  )
}

export { PropagationStopper }
