import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { MdExitToApp, MdMeetingRoom } from "react-icons/md";
import { FaShareAlt } from "react-icons/fa";
import { Users, Plus } from "lucide-react";
import BottomNav from "../../layout/footer/BottomNav";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import { ConfirmationDialog } from "../../components/ui/CustomDialog";
import NoData from "../../components/common/NoData";
import { exitRoomSafely, findAllRooms } from "./services/rooms.services";
import Spinner from "../../components/common/Spinner";
import { Room, RoomState } from "./roomSlice";

interface Player {
  [key: string]: unknown;
}

function ShareButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const roomLink = `${window.location.origin}/room/${roomId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my card game room!",
          text: "Come play cards with me!",
          url: roomLink,
        });
      } catch {
        navigator.clipboard.writeText(roomLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleShare}
      leftIcon={<FaShareAlt size={16} />}
      className="bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20"
    >
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}

function RoomList(): JSX.Element {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const roomsList = useAppSelector((state) => state.room.roomsList);
  const loading = useAppSelector((state) => state.room.loading);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleJoin = (roomId: string) => navigate(`/room/${roomId}`);
  const handleCreate = () => navigate("/create-room");
  const handleJoinWithCode = () => navigate("/join-room");

  useEffect(() => {
    if (user?.uid) {
      dispatch(findAllRooms({ uid: user?.uid }));
    }
  }, []);

  const handleDeleteConfirm = async () => {
    if (roomToDelete && user?.uid && roomToDelete.roomId) {
      const res = await dispatch(
        exitRoomSafely({ roomId: roomToDelete?.roomId, userId: user?.uid })
      );
      if (res.meta.requestStatus == "fulfilled") {
        if (user?.uid) {
          dispatch(findAllRooms({ uid: user?.uid }));
        }
      }
    }
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  return (
    <div className="relative z-10 py-20">
      <div className="flex flex-col mx-auto lg:max-w-287.5 px-4 lg:px-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Rooms</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create, join, and manage your game rooms
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Button
              variant="secondary"
              leftIcon={<MdMeetingRoom size={18} />}
              onClick={handleJoinWithCode}
            >
              Join Room
            </Button>

            <Button leftIcon={<Plus size={18} />} onClick={handleCreate}>
              Create Room
            </Button>
          </div>
        </div>
        <div className="my-6 h-px w-full bg-white/10" />
        {/* Empty state */}
        {loading ? (
          <Spinner center />
        ) : roomsList?.length === 0 ? (
          <NoData title="No Rooms Found" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 w-full">
            {roomsList?.map((room: Room) => (
              <Card key={room.roomId} variant="elevated">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={room.hostAvatar}
                      name={room.hostName}
                      size="md"
                      status="online"
                      className={`ring-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-full ${
                        room.hostUid === user?.uid && "ring-cyan-400/50"
                      }`}
                    />

                    <div className="flex-1 flex flex-col items-start">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="font-semibold text-lg">
                          {room.roomName || "Untitled Room"}
                        </div>

                        <div className="flex items-center gap-1 rounded bg-cyan-400/10 px-2 py-0.5">
                          <Users size={14} className="text-cyan-400" />
                          <span className="text-xs text-cyan-400">
                            {room.players
                              ? Object.keys(room.players).length
                              : 0}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-400">
                        Host: {room.hostName || "Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-between w-full">
                    <Button
                      size="sm"
                      onClick={() => handleJoin(room.roomId)}
                      leftIcon={<MdMeetingRoom size={18} />}
                    >
                      Enter
                    </Button>

                    <ShareButton roomId={room.roomId} />

                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<MdExitToApp size={18} />}
                      onClick={() => {
                        setRoomToDelete(room);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Exit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}{" "}
      </div>

      <BottomNav />

      {/* Delete dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        message={`Are you sure you want to delete "${
          roomToDelete?.roomName || "this room"
        }"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default RoomList;
