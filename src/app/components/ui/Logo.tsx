import Image from "next/image";

interface LogoProps {
  onClick?: () => void;
}

function Logo({ onClick }: LogoProps) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <Image
        src="/logo/community_logo.png"
        alt="Community logomark"
        height={50}
        width={40}
      />
    </div>
  );
}

export default Logo;
