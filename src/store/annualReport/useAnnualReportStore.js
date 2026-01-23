import { create } from "zustand";

const getInitialState = () => ({
  userNickname: "",
  reportPageIndex: 0,
});

export const useAnnualReportStore = create((set) => ({
  ...getInitialState(),

  setUserNickname: (userNickname) => set({ userNickname }),
  setReportPageIndex: (reportPageIndex) => set({ reportPageIndex }),

  resetAnnualReport: () => set(getInitialState()),
}));
