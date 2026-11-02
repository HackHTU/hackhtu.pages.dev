import { useEffect, useState } from "react";

/** 延迟跟随变化的值；value 停止变化 delay 毫秒后才更新，用于搜索输入防抖。 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
};
