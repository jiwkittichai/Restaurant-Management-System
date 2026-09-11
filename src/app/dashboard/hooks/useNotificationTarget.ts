"use client";
import { useEffect, useRef } from "react";

/** Resolve notification anchors after the page's asynchronous data and filters settle. */
export function useNotificationTarget(resetFilters: () => void) {
  const reset = useRef(resetFilters);
  reset.current = resetFilters;
  useEffect(() => {
    let observer: MutationObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    function navigate() {
      observer?.disconnect(); clearTimeout(timeout); cancelAnimationFrame(frame);
      const match = /^#(bill|table|order|ingredient)-(\d+)$/.exec(window.location.hash);
      if (!match) return;
      reset.current();
      frame = requestAnimationFrame(() => {
        const anchor = `${match[1] === "bill" ? "table" : match[1]}-${match[2]}`;
        function find() {
          const element = document.getElementById(anchor);
          if (!element) return false;
          const billButton = element.querySelector<HTMLButtonElement>("[data-notification-bill]");
          if (match![1] === "bill" && !billButton) return false;
          observer?.disconnect(); clearTimeout(timeout);
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          document.querySelectorAll('[data-notification-highlight]').forEach(el => el.removeAttribute('data-notification-highlight'));
          element.setAttribute("data-notification-highlight", "true");
          if (match![1] === "bill") billButton?.click();
          return true;
        }
        if (!find()) {
          observer = new MutationObserver(find);
          observer.observe(document.body, { childList: true, subtree: true });
          timeout = setTimeout(() => observer?.disconnect(), 10000);
        }
      });
    }
    navigate();
    window.addEventListener("hashchange", navigate);
    window.addEventListener("notification-target", navigate);
    return () => { observer?.disconnect(); clearTimeout(timeout); cancelAnimationFrame(frame); window.removeEventListener("hashchange", navigate); window.removeEventListener("notification-target", navigate); };
  }, []);
}
