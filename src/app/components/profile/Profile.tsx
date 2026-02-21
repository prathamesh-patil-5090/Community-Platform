import { auth } from "@/auth";
import ProfileHeroSection from "./ProfileHeroSection";
import UserActivity from "./UserActivity";
import UserPosts from "./UserPosts";

async function Profile() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex flex-col items-center justify-center pt-30 gap-5">
      <ProfileHeroSection
        name={user?.name}
        email={user?.email}
        image={user?.image}
        joinedAt={null}
      />
      <div className="flex flex-col md:flex-row gap-8 md:items-start md:justify-center w-full">
        <UserActivity />
        <UserPosts />
      </div>
    </div>
  );
}

export default Profile;
