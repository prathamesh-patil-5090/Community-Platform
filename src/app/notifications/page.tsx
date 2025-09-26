import Notifications from "../components/Notifications";

export default function NotificationsPage() {
  return (
    <div className="bg-black items-center justify-center p-4">
      <h1 className="font-sans font-bold text-2xl lg:text-5xl lg:pl-15 pb-5">
        Notifications
      </h1>
      <div className="flex justify-around">
        <Notifications />
      </div>
    </div>
  );
}
