/**
 * client/src/components/Modal.jsx
 * Accessible modal dialog built on @headlessui/react.
 * Provides focus trap, Escape-to-close, return-focus, aria-modal, and a
 * scrollable backdrop — everything the hand-rolled modals were missing.
 */
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

/**
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title
 * @param {React.ReactNode} [description]
 * @param {React.ReactNode} children
 * @param {'sm'|'md'|'lg'|'xl'} [size='lg']
 * @param {React.ReactNode} [footer]
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'lg',
  footer,
}) {
  const maxW = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[size];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-3 scale-95"
            >
              <Dialog.Panel
                className={`glass w-full ${maxW} rounded-2xl p-6 shadow-2xl border border-theme-border/60 relative`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-theme-text0 hover:text-theme-text hover:bg-theme-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <Dialog.Title className="text-xl text-heading text-theme-text pr-8">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-sm text-theme-text0 mt-1.5">
                    {description}
                  </Dialog.Description>
                )}

                <div className="mt-5">{children}</div>

                {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
