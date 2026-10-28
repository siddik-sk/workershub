import { Link } from 'react-router-dom';
import { BadgeCheck, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../../components/layout/Logo';

const defaults = {
  eyebrow: 'Trusted local services',
  headline: 'Trusted professionals, one simple booking away.',
  description:
    'WorkConnect brings verified local trades and home service experts together with customers who need them — quickly, safely and transparently.',
  bullets: [
    { icon: BadgeCheck, title: 'Admin-verified professionals', text: 'Every worker profile is reviewed before it goes live.' },
    { icon: Clock3, title: 'Real-time booking updates', text: 'Acceptance, progress and completion updates in one place.' },
    { icon: ShieldCheck, title: 'Built around trust', text: 'Role-based accounts and private booking records.' },
  ],
};

export default function AuthShell({ children, eyebrow, headline, description, bullets, footnote }) {
  const content = { ...defaults, eyebrow, headline, description, bullets: bullets || defaults.bullets };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-400/10 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(88,223,201,0.10),transparent_45%)]" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> {content.eyebrow}
          </span>
          <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white text-balance">
            {content.headline}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-navy-300">{content.description}</p>

          <ul className="mt-8 space-y-4">
            {content.bullets.map((bullet) => (
              <li key={bullet.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-300 ring-1 ring-white/10">
                  <bullet.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{bullet.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-navy-400">{bullet.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-navy-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          WorkConnect · Local services, professionally connected
        </div>
      </aside>

      <section className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:hidden">
          <Logo />
          <Link to="/" className="text-sm font-semibold text-navy-500 hover:text-navy-800">
            Back home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <div className="px-5 pb-6 text-center text-xs text-navy-400 sm:px-8">
          {footnote || (
            <>
              © {new Date().getFullYear()} WorkConnect ·{' '}
              <Link to="/privacy" className="hover:text-navy-700">Privacy</Link> ·{' '}
              <Link to="/terms" className="hover:text-navy-700">Terms</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
