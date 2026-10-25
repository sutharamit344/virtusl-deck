import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../app/store";
import { deleteRoom, updateRoomSettings } from "../pages/room/roomSlice";
import CommonDialog from "./ui/CustomDialog";
import Button from "./ui/Button";
import { Trash2 } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
}

const TABS = ["Room", "Table", "Hand", "Log"];

export const TableSettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  roomId,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const user = useSelector((state: RootState) => state.auth.user);
  const { settings, hostUid } = useSelector((state: RootState) => state.room);

  const handleChange = (setting: string, value: any) => {
    dispatch(updateRoomSettings({ roomId, setting, value }) as any);
  };

  const isHost = hostUid === user?.uid;

  const handleRoomDelete = () => {
    dispatch(deleteRoom({ roomId }) as any).then(() => {
      navigate("/rooms");
    });
  };

  const table = settings?.table || {
    mode: "Stacked",
    skip: "auto",
    turn: {},
    cardFace: {},
    turnAccessEnabled: {},
    zones: { zone1: {}, zone2: {}, zone3: {}, zone4: {} },
  };

  const mode = table.mode || "Stacked";
  const currentCardFace = table.cardFace?.[mode] || {};
  const handKey = `${mode}_hand`;
  const currentHandFace = table.cardFace?.[handKey] || {};
  const currentTurn = table.turn?.[mode] || "None";
  const turnAccessEnabled = table.turnAccessEnabled?.[mode] ?? true;
  const zone1 = table.zones?.zone1?.[mode] || false;
  const zone2 = table.zones?.zone2?.[mode] || false;
  const zone3 = table.zones?.zone3?.[mode] || false;
  const zone4 = table.zones?.zone4?.[mode] || false;

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Room Settings"
      maxWidth="md"
      actions={
        <div className="flex w-full items-center justify-between">
          {isHost ? (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={16} />}
              onClick={handleRoomDelete}
            >
              Delete Room
            </Button>
          ) : (
            <div />
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 min-h-[350px]">
        {/* Sidebar Tabs */}
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-white/10 pr-0 md:pr-4 shrink-0">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 text-left rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === idx
                  ? "bg-cyan-400/10 text-cyan-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto max-h-[45vh] pr-1">
          {activeTab === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-200">Room Security</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings?.private}
                  onChange={() => handleChange("private", !settings.private)}
                  className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                />
                <span className="text-sm font-medium text-gray-300">
                  Private Room (Require Password)
                </span>
              </label>

              {settings?.private && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400">
                    Room Password
                  </span>
                  <input
                    type="text"
                    value={settings?.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="Enter password"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings?.allowSpectators}
                  onChange={() =>
                    handleChange("allowSpectators", !settings.allowSpectators)
                  }
                  className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                />
                <span className="text-sm font-medium text-gray-300">
                  Allow Spectators
                </span>
              </label>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-200">Table Settings</h3>

              {/* Mode Selection */}
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-gray-400">
                  Layout Mode
                </span>
                <div className="flex gap-4">
                  {["Stacked", "Circular", "Revealed"].map((modeName) => (
                    <label
                      key={modeName}
                      className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-300"
                    >
                      <input
                        type="radio"
                        name="layoutMode"
                        value={modeName}
                        checked={mode === modeName}
                        onChange={(e) => {
                          handleChange("table", {
                            ...table,
                            mode: e.target.value,
                          });
                        }}
                        className="text-cyan-400 focus:ring-cyan-400/30 border-zinc-800"
                      />
                      <span>{modeName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card Face Configuration */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <span className="block text-sm font-semibold text-gray-400">
                  Card Face rules ({mode})
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-300">
                    <input
                      type="checkbox"
                      checked={!!currentCardFace.strict}
                      onChange={(e) => {
                        const strict = e.target.checked;
                        const faceUp = currentCardFace.faceUp ?? false;
                        handleChange("table", {
                          ...table,
                          cardFace: {
                            ...table.cardFace,
                            [mode]: strict
                              ? { strict, faceUp }
                              : { strict: false },
                          },
                        });
                      }}
                      className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                    />
                    <span>Strict (Force All Cards)</span>
                  </label>

                  {currentCardFace.strict && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-300">
                      <input
                        type="checkbox"
                        checked={!!currentCardFace.faceUp}
                        onChange={(e) => {
                          handleChange("table", {
                            ...table,
                            cardFace: {
                              ...table.cardFace,
                              [mode]: {
                                ...currentCardFace,
                                faceUp: e.target.checked,
                              },
                            },
                          });
                        }}
                        className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                      />
                      <span>Force Face Up</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Hand Configuration */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <span className="block text-sm font-semibold text-gray-400">
                  Card Face in Hand ({mode})
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-300">
                    <input
                      type="checkbox"
                      checked={!!currentHandFace.strict}
                      onChange={(e) => {
                        const strict = e.target.checked;
                        const faceUp = currentHandFace.faceUp ?? false;
                        handleChange("table", {
                          ...table,
                          cardFace: {
                            ...table.cardFace,
                            [handKey]: strict
                              ? { strict, faceUp }
                              : { strict: false },
                          },
                        });
                      }}
                      className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                    />
                    <span>Force strict hand</span>
                  </label>

                  {currentHandFace.strict && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-300">
                      <input
                        type="checkbox"
                        checked={!!currentHandFace.faceUp}
                        onChange={(e) => {
                          handleChange("table", {
                            ...table,
                            cardFace: {
                              ...table.cardFace,
                              [handKey]: {
                                ...currentHandFace,
                                faceUp: e.target.checked,
                              },
                            },
                          });
                        }}
                        className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                      />
                      <span>Force face up</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Active Zones */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <span className="block text-sm font-semibold text-gray-400">
                  Active Drop Zones
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Zone 1 (Discard Pile)", key: "zone1", val: zone1 },
                    { label: "Zone 2 (Locked Pile)", key: "zone2", val: zone2 },
                    { label: "Zone 3 (Reveal Pile)", key: "zone3", val: zone3 },
                    { label: "Zone 4 (Private Hand)", key: "zone4", val: zone4 },
                  ].map((z) => (
                    <label
                      key={z.key}
                      className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={!!z.val}
                        onChange={(e) => {
                          handleChange("table", {
                            ...table,
                            zones: {
                              ...table.zones,
                              [z.key]: {
                                ...table.zones?.[
                                  z.key as keyof typeof table.zones
                                ],
                                [mode]: e.target.checked,
                              },
                            },
                          });
                        }}
                        className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                      />
                      <span>{z.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-200">Hand Settings</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings?.strict?.card}
                  onChange={(e) => {
                    const value = e.target.checked;
                    const updatedStrict = {
                      ...settings?.strict,
                      card: value ? { cardFace: false } : undefined,
                    };
                    handleChange("strict", updatedStrict);
                  }}
                  className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                />
                <span className="text-sm font-medium text-gray-300">
                  Strict Hand Card Face Locks
                </span>
              </label>

              {settings?.strict?.card && (
                <label className="flex items-center gap-3 cursor-pointer pl-6">
                  <input
                    type="checkbox"
                    checked={!!settings.strict?.card?.cardFace}
                    onChange={(e) => {
                      const value = e.target.checked;
                      const updatedStrict = {
                        ...settings?.strict,
                        card: {
                          ...settings?.strict?.card,
                          cardFace: value,
                        },
                      };
                      handleChange("strict", updatedStrict);
                    }}
                    className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Hand Face Up Mode
                  </span>
                </label>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings?.strict?.cardDrag}
                  onChange={(e) => {
                    const value = e.target.checked;
                    const updatedStrict = {
                      ...settings?.strict,
                      cardDrag: value,
                    };
                    handleChange("strict", updatedStrict);
                  }}
                  className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                />
                <span className="text-sm font-medium text-gray-300">
                  Disable Drag & Drop (Lock Hand)
                </span>
              </label>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-200">Activity Logs</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings?.enableLog}
                  onChange={() => handleChange("enableLog", !settings.enableLog)}
                  className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                />
                <span className="text-sm font-medium text-gray-300">
                  Enable Room Activity Log
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings?.showLogTop}
                  onChange={() =>
                    handleChange("showLogTop", !settings.showLogTop)
                  }
                  className="rounded border-zinc-800 text-cyan-400 focus:ring-cyan-400/30"
                />
                <span className="text-sm font-medium text-gray-300">
                  Display Logs on Top Level
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </CommonDialog>
  );
};
