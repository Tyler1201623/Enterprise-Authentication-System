/**
 * Resource prefetching utilities to improve loading performance
 */

type ResourceType = "script" | "style" | "image" | "font" | "document";

interface PrefetchOptions {
  type: ResourceType;
  crossOrigin?: boolean;
  as?: string;
  importance?: "high" | "low" | "auto";
  media?: string;
}

/**
 * Prefetch a resource with browser hints
 */
export const prefetchResource = (
  url: string,
  options: PrefetchOptions
): HTMLLinkElement | null => {
  if (!url || typeof window === "undefined") return null;

  try {
    const linkElement = document.createElement("link");
    linkElement.rel = "prefetch";
    linkElement.href = url;

    if (options.crossOrigin) {
      linkElement.crossOrigin = "anonymous";
    }

    if (options.as) {
      linkElement.setAttribute("as", options.as);
    }

    if (options.importance) {
      linkElement.setAttribute("importance", options.importance);
    }

    if (options.media) {
      linkElement.media = options.media;
    }

    document.head.appendChild(linkElement);
    return linkElement;
  } catch (error) {
    console.debug("Prefetch failed:", error);
    return null;
  }
};

/**
 * Preconnect to a domain to speed up future requests
 */
export const preconnect = (
  domain: string,
  crossOrigin: boolean = false
): HTMLLinkElement | null => {
  if (!domain || typeof window === "undefined") return null;

  try {
    const linkElement = document.createElement("link");
    linkElement.rel = "preconnect";
    linkElement.href = domain;

    if (crossOrigin) {
      linkElement.crossOrigin = "anonymous";
    }

    document.head.appendChild(linkElement);
    return linkElement;
  } catch (error) {
    console.debug("Preconnect failed:", error);
    return null;
  }
};

/**
 * Preload critical image assets
 */
export const preloadImages = (urls: string[]): void => {
  if (!urls.length || typeof window === "undefined") return;

  urls.forEach((url) => {
    prefetchResource(url, {
      type: "image",
      as: "image",
      importance: "high",
    });
  });
};

/**
 * Prefetch routes for faster navigation
 */
export const prefetchRoutes = (routes: string[]): void => {
  if (!routes.length || typeof window === "undefined") return;

  // Use intersection observer to delay prefetching until idle
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      routes.forEach((route) => {
        prefetchResource(`${route}`, {
          type: "document",
          importance: "low",
        });
      });
      observer.disconnect();
    }
  });

  // Observe the document body to trigger when visible
  observer.observe(document.body);
};

/**
 * Initialize performance optimizations for resource loading
 */
export const initResourcePrefetching = (): void => {
  // Wait until the page has loaded
  if (document.readyState === "complete") {
    initPrefetching();
  } else {
    window.addEventListener("load", initPrefetching);
  }
};

/**
 * Start prefetching resources after page load
 */
const initPrefetching = (): void => {
  // Preconnect to common domains
  preconnect("https://fonts.googleapis.com", true);

  // Schedule route prefetching during idle time
  if ("requestIdleCallback" in window) {
    // @ts-ignore - TS doesn't have requestIdleCallback types by default
    window.requestIdleCallback(
      () => {
        prefetchRoutes(["/dashboard", "/admin", "/auth"]);
      },
      { timeout: 2000 }
    );
  } else {
    setTimeout(() => {
      prefetchRoutes(["/dashboard", "/admin", "/auth"]);
    }, 2000);
  }
};
