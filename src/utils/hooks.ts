import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Custom hook for debouncing values
 * @param value The value to be debounced
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling functions
 * @param callback The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  const lastCallArgs = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastCall.current;

      // Store the latest args
      lastCallArgs.current = args;

      // If we're within throttle period, schedule a call at the end
      if (elapsed < delay) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          if (lastCallArgs.current) {
            callback(...lastCallArgs.current);
          }
          timeoutRef.current = null;
        }, delay - elapsed);
      } else {
        // Otherwise call immediately
        lastCall.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );
}

/**
 * Hook for tracking element intersection with viewport
 * @param options IntersectionObserver options
 * @param freezeOnceVisible Stop observing once element is visible
 * @returns [ref, isIntersecting] - Ref to attach to element and boolean indicating visibility
 */
export function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit = {},
  freezeOnceVisible: boolean = false
): [React.RefObject<T>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const ref = useRef<T>(null);
  const freezeRef = useRef<boolean>(false);

  useEffect(() => {
    if (!ref.current || (freezeRef.current && freezeOnceVisible)) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isElementIntersecting = entry.isIntersecting;
      setIsIntersecting(isElementIntersecting);

      if (isElementIntersecting && freezeOnceVisible) {
        freezeRef.current = true;
        observer.disconnect();
      }
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [
    options,
    options.root,
    options.rootMargin,
    options.threshold,
    freezeOnceVisible,
  ]);

  return [ref, isIntersecting];
}

/**
 * Hook for detecting element resize
 * @returns [ref, size] - Ref to attach to element and current size
 */
export function useResizeObserver<T extends Element>(): [
  React.RefObject<T>,
  DOMRectReadOnly | undefined,
] {
  const resizeRef = useRef<T>(null);
  const [contentRect, setContentRect] = useState<DOMRectReadOnly>();

  useEffect(() => {
    if (!resizeRef.current) return;

    const element = resizeRef.current;
    let resizeObserver: ResizeObserver;

    try {
      resizeObserver = new ResizeObserver((entries) => {
        if (!entries.length) return;
        setContentRect(entries[0].contentRect);
      });

      resizeObserver.observe(element);
    } catch (error) {
      // Fallback for browsers without ResizeObserver
      console.warn("ResizeObserver not supported:", error);
      // Set initial size
      setContentRect(element.getBoundingClientRect());

      // Use resize event as fallback
      const handleResize = () => {
        setContentRect(element.getBoundingClientRect());
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, []);

  return [resizeRef, contentRect];
}

/**
 * Hook for memoizing expensive calculations with deep comparison
 * @param factory Function that returns the computed value
 * @param deps Dependencies array for the computation
 * @returns Memoized value
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>({
    deps: [],
    value: {} as T,
  });

  // Simple deep comparison function
  const depsChanged = !deps.every((dep, i) => {
    if (typeof dep === "object" && dep !== null) {
      return JSON.stringify(dep) === JSON.stringify(ref.current.deps[i]);
    }
    return dep === ref.current.deps[i];
  });

  if (depsChanged || ref.current.value === undefined) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * Hook for persisting state in localStorage with type safety
 * @param key Storage key
 * @param initialValue Default value if nothing is in storage
 * @returns [state, setState] - Current state and setter function
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Update stored value if key changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(
            `Error parsing localStorage change for key "${key}":`,
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook to measure and log component render times
 * Use in development to identify components with slow renders
 * @param componentName Name to identify the component in logs
 */
export function useRenderTiming(componentName: string): void {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const prevRenderTime = useRef(performance.now());

  useEffect(() => {
    // Skip in production for performance
    if (process.env.NODE_ENV === "production") return;

    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    const sinceLastRender = endTime - prevRenderTime.current;
    renderCount.current++;

    console.log(
      `[RENDER] ${componentName} rendered in ${renderTime.toFixed(2)}ms ` +
        `(#${renderCount.current}, +${sinceLastRender.toFixed(0)}ms)`
    );

    prevRenderTime.current = endTime;

    // Save initial render time after first render
    if (renderCount.current === 1) {
      console.log(
        `[RENDER] ${componentName} initial render: ${renderTime.toFixed(2)}ms`
      );
    }
  });
}
