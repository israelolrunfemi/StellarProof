declare module "lucide-react" {
  import type { FC, SVGAttributes } from "react";

  export interface LucideProps extends SVGAttributes<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = FC<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Award: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Camera: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const Clipboard: LucideIcon;
  export const Copy: LucideIcon;
  export const Cpu: LucideIcon;
  export const Database: LucideIcon;
  export const DiscIcon: LucideIcon;
  export const Download: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const FileCode2: LucideIcon;
  export const FileImage: LucideIcon;
  export const FileJson: LucideIcon;
  export const FileSignature: LucideIcon;
  export const FileText: LucideIcon;
  export const GripVertical: LucideIcon;
  export const Github: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Image: LucideIcon;
  export const Info: LucideIcon;
  export const Layers: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Menu: LucideIcon;
  export const Moon: LucideIcon;
  export const Music: LucideIcon;
  export const Network: LucideIcon;
  export const Newspaper: LucideIcon;
  export const Package: LucideIcon;
  export const Palette: LucideIcon;
  export const Plus: LucideIcon;
  export const Rocket: LucideIcon;
  export const Scale: LucideIcon;
  export const ScanLine: LucideIcon;
  export const Search: LucideIcon;
  export const SearchX: LucideIcon;
  export const Send: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShieldOff: LucideIcon;
  export const Sun: LucideIcon;
  export const Trash2: LucideIcon;
  export const Twitter: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const Video: LucideIcon;
  export const Wallet: LucideIcon;
  export const X: LucideIcon;
}
