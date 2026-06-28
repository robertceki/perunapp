import { BrowserRouter, Route, Routes } from "react-router-dom";

// P0 scaffold shell. Real routes (auth, member, admin) land in P2+.
function ScaffoldHome() {
  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <img
        src="/brand/perun-emblem-burgundy.png"
        alt="Perun"
        className="h-28 w-28 object-contain"
      />
      <img
        src="/brand/perun-wordmark-burgundy.png"
        alt="Perun Trening Centar"
        className="h-16 w-44 object-contain"
      />
      <p className="font-display text-xl font-extrabold text-ink">
        Web app — P0 scaffold radi
      </p>
      <p className="text-sm text-ink-muted">
        Vite · React · React Router · Tailwind · Supabase · PWA
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ScaffoldHome />} />
      </Routes>
    </BrowserRouter>
  );
}
