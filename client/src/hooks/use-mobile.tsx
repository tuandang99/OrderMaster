import { useState, useEffect } from "react";

export default function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window !== "undefined") {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkIfMobile();

      // Add event listener for resize
      window.addEventListener("resize", checkIfMobile);

      // Clean up
      return () => {
        window.removeEventListener("resize", checkIfMobile);
      };
    }
  }, []);

  return isMobile;
}
