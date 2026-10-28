import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const config = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: AlertCircle, ring: 'border-rose-200', iconColor: 'text-rose-600' },
  info: { icon: Info, ring: 'border-sky-200', iconColor: 'text-sky-600' },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (type, message, options = {}) => {
      idCounter += 1;
      const id = `toast-${idCounter}`;
      const toast = {
        id,
        type,
        title: options.title || '',
        message,
        duration: options.duration ?? 5000,
      };
      setToasts((current) => [...current.slice(-3), toast]);
      if (toast.duration > 0) {
        timers.current[id] = setTimeout(() => remove(id), toast.duration);
      }
      return id;
    },
    [remove]
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      info: (message, options) => push('info', message, options),
      remove,
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={{ toast, toasts, remove }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:left-auto sm:right-4 sm:top-4 sm:items-end">
          {toasts.map((item) => {
            const visual = config[item.type] || config.info;
            const Icon = visual.icon;
            return (
              <div
                key={item.id}
                role="status"
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lift animate-fade-up ${visual.ring}`}
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${visual.iconColor}`} />
                <div className="min-w-0 flex-1">
                  {item.title && <p className="text-sm font-semibold text-navy-900">{item.title}</p>}
                  <p className={`text-sm text-navy-600 ${item.title ? 'mt-0.5' : ''}`}>{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-navy-300 transition hover:text-navy-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context.toast;
}
