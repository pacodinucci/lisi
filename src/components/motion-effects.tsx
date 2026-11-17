"use client";

import { useEffect } from "react";

export function MotionEffects() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let frame = 0;

    if (!reduceMotion.matches && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const element = entry.target as HTMLElement;
            element.removeAttribute("data-reveal-pending");
            element.animate(
              [
                { opacity: 0, transform: "translateY(28px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 700, easing: "cubic-bezier(.2,.75,.2,1)" },
            );
            observer?.unobserve(element);
          }
        },
        { rootMargin: "0px 0px 80px 0px", threshold: 0.08 },
      );
      items.forEach((item) => {
        if (item.getBoundingClientRect().top > window.innerHeight) {
          item.setAttribute("data-reveal-pending", "");
        }
        observer?.observe(item);
      });
    }

    const hero = document.querySelector<HTMLElement>("[data-parallax]");
    const updateParallax = () => {
      frame = 0;
      if (!hero || reduceMotion.matches) return;
      hero.style.setProperty("--hero-parallax", `${Math.min(window.scrollY * 0.18, 120)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      items.forEach((item) => item.removeAttribute("data-reveal-pending"));
    };
  }, []);
  return null;
}
