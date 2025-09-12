type ButtonProps = {
  name: string;
  onClick?: () => void;
  bgColor?: string;
  className?: string;
};

function Button({ name, onClick, bgColor, className }: ButtonProps) {
  return (
    <button
      className={`text-white border border-white ${
        bgColor ? bgColor : "bg-black"
      } hover:bg-gray-700 rounded-md px-4 py-2 ${
        onClick ? "cursor-pointer" : "cursor-default"
      } ${className ? className : ""}`}
      onClick={onClick}
      aria-label={name}
      type="button"
    >
      {name}
    </button>
  );
}

export default Button;
