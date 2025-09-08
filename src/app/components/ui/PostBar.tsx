function PostBar() {
  return (
    <div className="relative h-[50px]">
      <input
        placeholder="What's on your mind? "
        className={`text-white border border-white bg-black hover:bg-gray-700 rounded-md px-4 pl-2 py-2 w-80 sm:w-2xl focus:outline-blue-400`}
      ></input>
    </div>
  );
}

export default PostBar;
