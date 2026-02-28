// src/components/Modal.tsx
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
};

const Modal = ({ isOpen, title, description, children, onClose }: ModalProps) => {
  // close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[80vh] p-6 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div>{children}</div>
        </div>
    </div>,
    document.body
  );
};

export default Modal;