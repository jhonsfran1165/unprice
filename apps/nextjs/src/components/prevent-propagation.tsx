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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
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
