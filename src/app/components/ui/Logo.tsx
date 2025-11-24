interface LogoProps {
  onClick?: () => void;
  logoClassName?: string;
}

function Logo({ onClick, logoClassName }: LogoProps) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <span
        className={`text-white text-3xl font-extrabold mb-2 ${logoClassName}`}
      >
        {"{C*"}
      </span>
    </div>
  );
}

export default Logo;
