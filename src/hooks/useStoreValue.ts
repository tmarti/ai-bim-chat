import { useEffect, useState } from "react";
import { IStateStoreService } from "../state/StoreService";

export function useStoreValue<T, S>(
    store: IStateStoreService<T>,
    selector: (state: T) => S
  ): S {
    const [value, setValue] = useState(() => selector(store.value));
  
    useEffect(() => {
      return store.subscribe(state => setValue(selector(state)));
    }, [store, selector]);
  
    return value;
  }