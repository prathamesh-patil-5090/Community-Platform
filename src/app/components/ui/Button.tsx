type ButtonProps = {
  name: string;
  onClick?: () => void;
  bgColor?: string;
};

function Button({ name, onClick, bgColor }: ButtonProps) {
  return (
    <button
      className={`text-white border border-white ${
        bgColor ? bgColor : "bg-black"
      } hover:bg-gray-700 rounded-md px-4 py-2 ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={onClick}
      aria-label={name}
    >
      {name}
    </button>
  );
}

export default Button;
