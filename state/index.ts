import { create } from "zustand";

// create an interface for the bear store to implement
interface BearStore {
  bears: number;
  increasePopulation(): void;
}

// create the bear store, implementing the BearStore interface
const useBearStore = create<BearStore>((set) => ({
  // set the initial value in the store to 0 bears
  bears: 0,
  // When this function is fired off, it increases the number of bears by 1
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));

// export the useBearStore hook
export default useBearStore;
