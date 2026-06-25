type Props = {
  onAdd: () => void;
};

export default function EmptyState({ onAdd }: Props) {
  return (
    <div
      style={{
        minHeight: 255,
        borderRadius: 28,
        border: "1px dashed var(--border-default)",
        background: "rgba(10, 25, 18, 0.45)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          maxWidth: 420,
        }}
      >
        <div style={{ color: "var(--text-secondary)" }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
          >
            <circle cx="7.5" cy="15.5" r="4.5" />
            <path d="M10.8 12.2L21 2.5" />
            <path d="M18 5h3v3" />
          </svg>
        </div>

        <h3
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Your vault is empty
        </h3>

        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          Add your first login to get started.
        </p>

        <button type="button" className="gold-button" onClick={onAdd}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add your first login
        </button>
      </div>
    </div>
  );
}
