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
  logo: Command,
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
}
