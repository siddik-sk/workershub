import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-navy-950 text-navy-200">
      <div className="page-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-300">
            Connecting households with trusted local professionals. Book verified experts for everyday home services
            with confidence.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[Facebook, Instagram, Linkedin].map((Icon, index) => (
              <span
                key={index}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-navy-300 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="transition hover:text-white" to="/services">Find professionals</Link></li>
            <li><Link className="transition hover:text-white" to="/worker/register">Become a worker</Link></li>
            <li><Link className="transition hover:text-white" to="/register">Create an account</Link></li>
            <li><Link className="transition hover:text-white" to="/login">Customer login</Link></li>
            <li><Link className="transition hover:text-white" to="/worker/login">Worker login</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Support</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="transition hover:text-white" to="/support">Help centre</Link></li>
            <li><Link className="transition hover:text-white" to="/support#contact">Contact support</Link></li>
            <li><Link className="transition hover:text-white" to="/privacy">Privacy policy</Link></li>
            <li><Link className="transition hover:text-white" to="/terms">Terms of service</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 text-brand-400" />
              <span>support@workconnect.local</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 text-brand-400" />
              <span>Mon–Sat, 9:00 AM – 6:00 PM</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 text-brand-400" />
              <span>Serving local communities, one booking at a time.</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-container flex flex-col items-center justify-between gap-3 py-6 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} WorkConnect. All rights reserved.</p>
          <p>Built for trusted local service professionals and the customers who need them.</p>
        </div>
      </div>
    </footer>
  );
}
