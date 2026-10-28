import {
  AirVent,
  Bug,
  Car,
  Droplets,
  Drill,
  Hammer,
  House,
  Paintbrush,
  Plug,
  Scissors,
  ShieldCheck,
  Sparkles,
  WashingMachine,
  Wrench,
  Zap,
} from 'lucide-react';

const ICONS = {
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  AirVent,
  Sparkles,
  WashingMachine,
  Car,
  Bug,
  Scissors,
  Drill,
  Plug,
  House,
  ShieldCheck,
};

export function CategoryIcon({ name = 'Wrench', ...props }) {
  const Icon = ICONS[name] || Wrench;
  return <Icon {...props} />;
}

export default ICONS;
