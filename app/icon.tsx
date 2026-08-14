import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Browser tab / PWA icon — minimal “z” monogram with sage accent. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF8F4",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            borderRadius: 80,
            background: "#1A1A1A",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              color: "#FAF8F4",
              fontSize: 220,
              fontWeight: 600,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              lineHeight: 1,
              marginTop: -12,
            }}
          >
            z
            <div
              style={{
                position: "absolute",
                top: 28,
                right: -8,
                width: 28,
                height: 28,
                borderRadius: 999,
                background: "#2F5D50",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
