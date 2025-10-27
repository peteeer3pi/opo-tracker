import { create } from "zustand";

type NotificationState = {
  message: string;
  visible: boolean;
  showNotification: (message: string) => void;
  hideNotification: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  message: "",
  visible: false,
  showNotification: (message: string) => {
    set({ message, visible: true });
  },
  hideNotification: () => {
    set({ visible: false });
  },
}));
