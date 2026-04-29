/* App router — switches between Landing / Studio / Credits via hash */

const { useState, useEffect } = React;

function readRoute() {
  const h = (window.location.hash || "").replace(/^#\/?/, "");
  if (h.startsWith("studio")) return "studio";
  if (h.startsWith("credits")) return "credits";
  return "landing";
}

function App() {
  const [route, setRoute] = useState(readRoute());

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r) => {
    window.location.hash = "#/" + (r === "landing" ? "" : r);
  };

  if (route === "studio") {
    return <Studio />;
  }
  if (route === "credits") {
    return <Credits onPlayAgain={() => go("studio")} />;
  }
  return <Landing onStart={() => go("studio")} />;
}

/* ---------- Tiny floating route nav (visible always, demo helper) ---------- */
function NavChrome() {
  const [route, setRoute] = useState(readRoute());
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r) => { window.location.hash = "#/" + (r === "landing" ? "" : r); };
  const Item = ({ id, label }) => (
    <button
      onClick={() => go(id)}
      className="font-mono tracked"
      style={{
        background: route === id ? "rgba(255,179,71,0.15)" : "transparent",
        border: "1px solid " + (route === id ? "var(--amber)" : "rgba(255,179,71,0.20)"),
        color: route === id ? "var(--amber)" : "var(--cream-60)",
        padding: "5px 11px",
        fontSize: 10,
        letterSpacing: "0.24em",
        borderRadius: 2,
        cursor: "pointer",
      }}
    >{label}</button>
  );

  return (
    <div style={{
      position: "fixed",
      top: 16, right: 20,
      zIndex: 200,
      display: "flex",
      gap: 6,
      pointerEvents: "auto",
    }}>
      <Item id="landing" label="/" />
      <Item id="studio"  label="/STUDIO" />
      <Item id="credits" label="/CREDITS" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.Fragment>
    <App />
    <NavChrome />
  </React.Fragment>
);
