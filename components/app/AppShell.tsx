"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const KEY = "tembera.rail";

interface RailValue {
  collapsed: boolean;
  toggle: () => void;
}

const RailContext = createContext<RailValue>({ collapsed: false, toggle: () => {} });

export function useRail(): RailValue {
  return useContext(RailContext);
}

/**
 * Owns the desktop rail's collapsed state.
 *
 * The width lives in `--t-rail-w`, and both the page content and the header
 * offset themselves by it — so overriding that one variable here collapses the
 * whole layout in step, with no second source of truth.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "collapsed") setCollapsed(true);
    } catch {
      // Storage unavailable — start expanded.
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(KEY, next ? "collapsed" : "expanded");
      } catch {
        // Non-fatal: the choice just won't persist.
      }
      return next;
    });
  }, []);

  return (
    <RailContext.Provider value={{ collapsed, toggle }}>
      <div className="t-app" data-rail={collapsed ? "collapsed" : "expanded"}>
        {children}
      </div>
    </RailContext.Provider>
  );
}
