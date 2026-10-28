import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · WorkConnect` : 'WorkConnect — Trusted local professionals';
  }, [title]);
}
