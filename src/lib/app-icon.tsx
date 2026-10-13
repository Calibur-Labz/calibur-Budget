import { ImageResponse } from "next/og";

/** The app icon: a white "B" on the accent. */
export function renderAppIcon(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#00b7ff",
          color: "#ffffff",
          fontSize: size * 0.56,
          fontWeight: 700,
        }}
      >
        B
      </div>
    ),
    { width: size, height: size },
  );
}
