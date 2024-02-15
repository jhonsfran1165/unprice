export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="top-0 mx-auto w-full bg-background-bg px-3">
      {children}
    </header>
  )
}
