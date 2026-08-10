import Link from "next/link";

// Replaces legacy pages/error.php ("Error Page: Page not found").
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#1d1c1c",
        color: "#e9e5d9",
      }}
    >
      <h1 style={{ fontSize: "6rem", margin: 0, color: "#00a859" }}>404</h1>
      <h2 style={{ marginTop: 0 }}>Page not found</h2>
      <p style={{ opacity: 0.8, maxWidth: 460 }}>
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 20,
          background: "#00a859",
          color: "#fff",
          padding: "14px 28px",
          borderRadius: 30,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Go Back Home
      </Link>
    </div>
  );
}
