export interface FooterComponentProps {
  links: { title: string; href: string }[]
  showThemeToggle?: boolean
  showLinks?: boolean
  children?: React.ReactNode
}
