import logoImg from "../assets/png.png";

export default function LogoMark({ className = "h-12 w-12" }) {
  return (
    <img
      src={logoImg}
      alt="Ehulak"
      className={`object-contain shrink-0 ${className}`}
    />
  );
}
