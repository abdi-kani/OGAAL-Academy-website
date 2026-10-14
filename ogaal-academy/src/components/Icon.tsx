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
  Landmark,
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
  scale: Scale,
  eye: Eye,
  award: Award,
  building: Building2,
  briefcase: Briefcase,
  badge: BadgeCheck,
  clipboard: ClipboardCheck,
  clock: Clock,
  handshake: Handshake,
  landmark: Landmark,
  presentation: Presentation,
  refresh: RefreshCw,
  graduation: GraduationCap,
  pin: MapPin,
  book: BookOpen,
  people: Users,
} as const;

export type IconName = keyof typeof icons | ArmsIconName;

/** One outline icon set: Lucide plus the firearm-safety icons, all at 1.75 stroke. */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  if (isArmsIcon(name)) {
    const { size, strokeWidth, className, style } = props;
    return <ArmsIcon name={name} size={size} strokeWidth={strokeWidth} className={className} style={style} />;
  }
  const Cmp = icons[name];
  return <Cmp aria-hidden="true" strokeWidth={1.75} size={24} {...props} />;
}
