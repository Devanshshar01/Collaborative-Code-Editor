import { create } from 'zustand';

const useToastStore = create((set) => ({
    toasts: [],
    addToast: (toast) => set((state) => ({
        toasts: [
            ...state.toasts,
            {
                id: Math.random().toString(36).substr(2, 9),
                createdAt: Date.now(),
                duration: 3000,
                ...toast,
            },
        ],
    })),
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
    })),
    dismissAll: () => set({ toasts: [] }),
}));

export const useToast = () => {
    const { addToast, removeToast, dismissAll } = useToastStore();

    return {
        toast: {
            success: (message, options) => addToast({ type: 'success', message, ...options }),
            error: (message, options) => addToast({ type: 'error', message, ...options }),
            warning: (message, options) => addToast({ type: 'warning', message, ...options }),
            info: (message, options) => addToast({ type: 'info', message, ...options }),
            custom: (message, options) => addToast({ type: 'custom', message, ...options }),
        },
        removeToast,
        dismissAll,
    };
};

export const useToastState = () => useToastStore((state) => state.toasts);
