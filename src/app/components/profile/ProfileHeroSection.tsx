import Image from "next/image";
import { FaBirthdayCake } from "react-icons/fa";

function ProfileHeroSection() {
  return (
    <div className="w-full flex-col md:w-[1100px] bg-[#0a0a0a] md:rounded-lg flex items-center justify-start">
      <div className="relative w-50 h-50 rounded-full bg-black bottom-25">
        <Image
          src={"/logo/me.webp"}
          width={180}
          height={180}
          alt="Profile Picture"
          className="absolute rounded-full ml-2.5 mt-2"
        ></Image>
      </div>
      <div className="relative flex flex-col justify-center items-center px-4 md:px-3 text-wrap -top-22">
        <h1 className="text-white text-2xl md:text-4xl font-bold">
          Prathamesh Patil
        </h1>
        <h3 className="text-white text-lg md:text-2xl font-medium text-center">
          My name is Prathamesh Patil. I am a professional programmer in my
          daily life.{" "}
        </h3>
        <h3 className="flex items-center gap-2 text-white text-lg mt-5">
          <FaBirthdayCake />
          Joined on 23 Mar 2025
        </h3>
      </div>
    </div>
  );
}

export default ProfileHeroSection;
