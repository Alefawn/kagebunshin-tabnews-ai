'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'info';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface UIContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextValue | null>(null);

let openModals = 0;

function useModalOpenClass() {
  useEffect(() => {
    openModals += 1;
    document.body.classList.add('modal-open');
    return () => {
      openModals -= 1;
      if (openModals <= 0) {
        openModals = 0;
        document.body.classList.remove('modal-open');
      }
    };
  }, []);
}

export interface ModalProps {
  title: string;
  wide?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ title, wide, onClose, footer, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalOpenClass();

  useEffect(() => {
    const aoTeclar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', aoTeclar, true);
    return () => document.removeEventListener('keydown', aoTeclar, true);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const alvo =
      dialog.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea') ||
      dialog.querySelector<HTMLElement>('.modal-foot .btn-primary') ||
      dialog.querySelector<HTMLElement>('button');
    if (alvo) alvo.focus();
  }, []);

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={'modal' + (wide ? ' modal-wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-modal-title"
        ref={dialogRef}
      >
        <div className="modal-head">
          <h2 id="kb-modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmacao, setConfirmacao] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((valor: boolean) => void) | null>(null);
  const proximoId = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    proximoId.current += 1;
    const id = proximoId.current;
    setToasts((atuais) => [...atuais, { id, message, type, leaving: false }]);
    window.setTimeout(() => {
      setToasts((atuais) => atuais.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    }, 2600);
    window.setTimeout(() => {
      setToasts((atuais) => atuais.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setConfirmacao(options);
    });
  }, []);

  const fecharConfirmacao = useCallback((resultado: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setConfirmacao(null);
    if (resolver) resolver(resultado);
  }, []);

  const valor = useMemo<UIContextValue>(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UIContext.Provider value={valor}>
      {children}
      {toasts.length > 0
        ? createPortal(
            <div className="toast-root" aria-live="polite" aria-atomic="false">
              {toasts.map((item) => (
                <div
                  key={item.id}
                  className={'toast toast-' + item.type + (item.leaving ? ' toast-out' : '')}
                  role="status"
                >
                  {item.message}
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
      {confirmacao ? (
        <Modal
          title={confirmacao.title || 'Confirmar'}
          onClose={() => fecharConfirmacao(false)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => fecharConfirmacao(false)}>
                {confirmacao.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                className={'btn ' + (confirmacao.danger ? 'btn-danger' : 'btn-primary')}
                onClick={() => fecharConfirmacao(true)}
              >
                {confirmacao.confirmLabel || 'Confirmar'}
              </button>
            </>
          }
        >
          <p className="confirm-text">{confirmacao.message || ''}</p>
        </Modal>
      ) : null}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const contexto = useContext(UIContext);
  if (!contexto) throw new Error('useUI precisa estar dentro de UIProvider');
  return contexto;
}
