const logoImages = import.meta.glob("../assets/branding/logo.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default",
});
export const brandLogoSrc = Object.values(logoImages)[0] ?? null;

export default function BrandLogo({ size = 40, alt = "OlitechHub", style, className }) {
  if (!brandLogoSrc) return null;

  return (
    <img
      src={brandLogoSrc}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        ...style,
      }}
    />
  );
}
