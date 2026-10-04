import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  Clock,
  Eye,
  GraduationCap,
  Handshake,
  LockKeyhole,
  MapPin,
  Presentation,
  RefreshCw,
  Scale,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideProps,
} from "lucide-react";

const icons = {
  shield: ShieldCheck,
  userCheck: UserCheck,
  lock: LockKeyhole,
  scale: Scale,
  eye: Eye,
  award: Award,
  building: Building2,
  briefcase: Briefcase,
  badge: BadgeCheck,
  clipboard: ClipboardCheck,
  clock: Clock,
  handshake: Handshake,
  presentation: Presentation,
  refresh: RefreshCw,
  graduation: GraduationCap,
  pin: MapPin,
  book: BookOpen,
  people: Users,
} as const;

export type IconName = keyof typeof icons;

/** Consistent outline icons (Lucide, 1.75 stroke). */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = icons[name];
  return <Cmp aria-hidden="true" strokeWidth={1.75} size={24} {...props} />;
}
