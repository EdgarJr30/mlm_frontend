import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/30 backdrop-blur-[3px] overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 relative w-full max-w-4xl mt-12 mx-4">

        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
