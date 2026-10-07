import {
  Award, Building2, ChartColumn, CircleHelp, Columns2, FileText, Handshake, Images, Layers, LayoutTemplate, Mail, Map, Megaphone, MessageCircle, Minus, Newspaper,
  PanelTop, Play, Quote, Route, Type, Users, CalendarCheck, Contact, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  PanelTop, Type, Columns2, FileText, Quote, LayoutTemplate, Route, CircleHelp, ChartColumn, Users, Handshake, Layers, Building: Building2, MessageCircle, Newspaper, Megaphone, Mail, Map, Play, Images, Award, Minus, CalendarCheck, Contact,
};

export function SectionIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = MAP[name] ?? LayoutTemplate;
  return <Cmp className={className} aria-hidden />;
}
