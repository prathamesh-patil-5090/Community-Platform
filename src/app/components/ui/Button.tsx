type ButtonProps = {
  name: string;
  onClick?: () => void;
};

function Button({ name, onClick }: ButtonProps) {
  return (
    <div>
      <button
        className={`text-white border border-white bg-black hover:bg-gray-700 rounded-md px-4 py-2 ${
          onClick ? "cursor-pointer" : "cursor-default"
        }`}
        onClick={onClick}
        aria-label={name}
      >
        {name}
      </button>
    </div>
  );
}

export default Button;
