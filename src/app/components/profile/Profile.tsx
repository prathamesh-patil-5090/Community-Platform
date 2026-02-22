import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
import ProfileContent from "./ProfileContent";
import ProfileHeroSection from "./ProfileHeroSection";

async function Profile() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center pt-40 text-white/50">
        <p>You must be signed in to view your profile.</p>
      </div>
    );
  }

  await connectDB();

  const user = await User.findById(userId).select("-password").lean();

  const postsCount = await Post.countDocuments({ authorId: userId });

  const commentsAgg = await Post.aggregate([
    { $unwind: "$commentList" },
    { $match: { "commentList.authorId": userId } },
    { $count: "total" },
  ]);
  const commentsCount: number = commentsAgg[0]?.total ?? 0;

  return (
    <div className="flex flex-col items-center pt-10 pb-16 px-4 gap-6">
      {/* Hero – constrained to 1100 px */}
      <div className="w-full max-w-[1100px]">
        <ProfileHeroSection
          name={session.user?.name}
          email={session.user?.email}
          image={session.user?.image}
          joinedAt={user?.createdAt ? user.createdAt.toISOString() : null}
        />
      </div>

      {/* Activity + Posts/Comments – same max-width */}
      <div className="w-full max-w-[1100px]">
        <ProfileContent
          userId={userId}
          postsCount={postsCount}
          commentsCount={commentsCount}
        />
      </div>
    </div>
  );
}

export default Profile;
