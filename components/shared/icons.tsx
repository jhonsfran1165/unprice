import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Cloud,
  Command,
  CreditCard,
  ExternalLink,
  File,
  FileText,
  Github,
  HelpCircle,
  Image,
  Keyboard,
  Laptop,
  LifeBuoy,
  Loader2,
  LogOut,
  LucideProps,
  Mail,
  MessageSquare,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  PlusCircle,
  Search,
  Settings,
  SunMedium,
  Trash,
  Twitter,
  User,
  UserPlus,
  Users,
  X,
  type Icon as LucideIcon,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  search: Search,
  cloud: Cloud,
  keyboard: Keyboard,
  lifeBuoy: LifeBuoy,
  logOut: LogOut,
  mail: Mail,
  messageSquare: MessageSquare,
  plusCircle: PlusCircle,
  userPlus: UserPlus,
  users: Users,
  externalLink: ExternalLink,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  post: FileText,
  page: File,
  media: Image,
  settings: Settings,
  billing: CreditCard,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertTriangle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Pizza,
  gitHub: Github,
  check: Check,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  twitter: Twitter,
  chevronsupdown: ChevronsUpDown,
  divider: (props: LucideProps) => (
    <svg
      fill="none"
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M16.88 3.549L7.12 20.451" />
    </svg>
  ),
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
    </svg>
  ),
}
