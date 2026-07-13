import loginHeroBg from "../../assets/branding/login-hero.png";

const BRAND_GREEN_DARK = "#15803d";

export default function LoginHero() {
  const hasHeroImage = Boolean(loginHeroBg);

  return (
    <div className="login-hero-media" aria-hidden="true">
      {hasHeroImage ? (
        <img src={loginHeroBg} alt="" className="login-hero-image" draggable={false} />
      ) : (
        <div
          className="login-hero-fallback"
          style={{
            background: `linear-gradient(145deg, ${BRAND_GREEN_DARK} 0%, #14532d 42%, #052e16 100%)`,
          }}
        />
      )}
    </div>
  );
}
