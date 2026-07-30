"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const MOBILE_MAX = 767;
export const TABLET_MAX = 1023;

export const ViewportContext = createContext({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isCompact: false,
});

export function useViewport() {
  const [vp, setVp] = useState({ isMobile: false, isTablet: false, isDesktop: true, isCompact: false });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const isMobile = w <= MOBILE_MAX;
      const isTablet = w > MOBILE_MAX && w <= TABLET_MAX;
      setVp({
        isMobile,
        isTablet,
        isDesktop: w > TABLET_MAX,
        isCompact: w <= TABLET_MAX,
      });
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return vp;
}

export { useContext };
