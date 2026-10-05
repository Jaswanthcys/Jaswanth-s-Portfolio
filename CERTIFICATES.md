# Certificates

The Certificates section is data-driven. Its four starter entries are in `public/scripts/config.js` under `certificates`.

## Replace a placeholder

1. Put the real image in `public/assets/certificates/` (JPG, PNG, SVG, or WebP are suitable).
2. Update that certificate object's `image`, `title`, `issuer`, and `date` values in `public/scripts/config.js`.
3. Optionally add a real `verificationUrl`. When present, the fullscreen certificate viewer shows a secure external verification link; when omitted, it stays hidden.

Example:

```js
{
  title: "Frontend Development",
  issuer: "Example Institution",
  date: "2026",
  image: "/assets/certificates/frontend-certificate.jpg",
  verificationUrl: "https://issuer.example/verify/your-id",
}
```

The example values above are placeholders. The provided `certificate-01.svg` through `certificate-04.svg` files are explicitly marked sample artwork, not real credentials. Replace them with the owner's certificate images and accurate issuer/date details before presenting the portfolio as final.

## Add more certificates

Append another object to the same `certificates` array and add the matching local image. The grid and fullscreen viewer render from the array, so no layout edits are needed.

## Project structure note

The uploaded archive contains a static ES-module JavaScript/CSS frontend and a FastAPI contact endpoint. It did not contain a React application or MongoDB configuration. This update preserves the code and contact/API structure that was actually supplied rather than introducing a different stack.
