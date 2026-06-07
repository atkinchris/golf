import { useEffect, useState } from "react";

const WIDE_BREAKPOINT = 600;

export function useIsWide(): boolean {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= WIDE_BREAKPOINT);

  useEffect(() => {
    function handleResize() {
      setIsWide(window.innerWidth >= WIDE_BREAKPOINT);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isWide;
}
