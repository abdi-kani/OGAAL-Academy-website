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
import { ArmsIcon, isArmsIcon, type ArmsIconName } from "./ArmsIcon";

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

export type IconName = keyof typeof icons | ArmsIconName;

/** Consistent outline icons: Lucide (1.75 stroke) plus the animated firearm-safety set. */
export function Icon({ name, live, ...props }: { name: IconName; live?: boolean } & LucideProps) {
  if (isArmsIcon(name)) {
    const { size, strokeWidth, className, style } = props;
    return <ArmsIcon name={name} live={live} size={size} strokeWidth={strokeWidth} className={className} style={style} />;
  }
  const Cmp = icons[name];
  return <Cmp aria-hidden="true" strokeWidth={1.75} size={24} {...props} />;
}
