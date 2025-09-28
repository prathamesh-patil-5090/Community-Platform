interface LogoProps {
  onClick?: () => void;
}

function Logo({ onClick }: LogoProps) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <span className="text-white text-3xl font-extrabold mb-2">{"{C*"}</span>
    </div>
  );
}

export default Logo;
