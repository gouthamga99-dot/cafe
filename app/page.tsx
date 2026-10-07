"use client";

import { useCallback, useRef, useState } from "react";
import UserView from "@/components/UserView";
import AdminView from "@/components/AdminView";

export default function Home() {
  const [view, setView] = useState<"user" | "admin">("user");
  const [toastMsg, setToastMsg] = useState({ text: "", err: false, show: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback((text: string, err = false) => {
    setToastMsg({ text, err, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg((t) => ({ ...t, show: false })), 3200);
  }, []);

  const go = (v: "user" | "admin") => { setView(v); window.scrollTo({ top: 0 }); };

  return (
    <>
      <header>
        <div className="wrap bar">
          <div className="brand"><i>☕</i><span>Cafe Orders</span></div>
          <div className="seg" role="tablist" aria-label="Switch side">
            <button role="tab" aria-selected={view === "user"} onClick={() => go("user")}>Order</button>
            <button role="tab" aria-selected={view === "admin"} onClick={() => go("admin")}>Admin</button>
          </div>
        </div>
      </header>

      <UserView active={view === "user"} toast={toast} />
      <AdminView active={view === "admin"} toast={toast} />

      <div className={`toast ${toastMsg.show ? "show" : ""} ${toastMsg.err ? "err" : ""}`} role="status">{toastMsg.text}</div>
    </>
  );
}
