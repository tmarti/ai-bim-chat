import { resolve } from "../ioc/inversify.config";

export const useSnapshotButtonVisibility = () => {
  const store = resolve('StateStoreService');

  store.subscribe(state => {
    const element = document.getElementById('button-take-snapshot')! as HTMLButtonElement;

    if (state.selection.ids.size > 0) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });
}