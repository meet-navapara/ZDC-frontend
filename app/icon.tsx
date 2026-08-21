import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Browser tab / PWA icon — geometric “z” from the zimji wordmark. */
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
          <svg
            width="210"
            height="230"
            viewBox="0 0 132 156"
            fill="#FAF8F4"
          >
            <path d="M8 10h116L104 48 66 118h58v38H0l24-38L64 48H8V10z" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
