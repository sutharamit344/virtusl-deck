import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, Typography, Slider,
  Switch, FormGroup, FormControlLabel, FormControl, FormLabel, TextField,
  Checkbox,
  RadioGroup,
  Radio
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { deleteRoom, updateRoomSettings } from "../redux/roomSlice";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

const SettingsDialog = ({ open, onClose, roomId, radius, setRadius, cardW, setCardW, cardH, setCardH }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {turnState, settings, deckId, roomName, hostName, hostUid, password, players, loading } = useSelector( (state) => state.room );
  const user = useSelector((state) => state.auth.user);
  const [tab, setTab] = useState(0);

  const handleChange = (setting, value) => {
    dispatch(updateRoomSettings({ roomId, setting, value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle>Room Settings</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 2 }}>
          <Tab label="Room" />
          <Tab label="Card" />
          <Tab label="Deck" />
          <Tab label="Table" />
          <Tab label="Strict" />
          <Tab label="Log" />
        </Tabs>

        {/* Room Tab */}
        {tab === 0 && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings?.private}
                  onChange={() => handleChange("private", !settings.private)}
                />
              }
              label="Private Room"
            />
            <TextField
              label="Room Password"
              value={settings?.password || ""}
              onChange={(e) => handleChange("password", e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings?.allowSpectators}
                  onChange={() => handleChange("allowSpectators", !settings.allowSpectators)}
                />
              }
              label="Allow Spectators"
            />

          </Box>
        )}

        {/* Card Tab */}
        {tab === 1 && (
          <Box>
            <Typography gutterBottom>Card Width</Typography>
            <Slider
              value={cardW}
              onChange={(e, val) => setCardW(val)}
              min={40}
              max={120}
              step={2}
              valueLabelDisplay="auto"
            />
            <Typography gutterBottom sx={{ mt: 2 }}>Card Height</Typography>
            <Slider
              value={cardH}
              onChange={(e, val) => setCardH(val)}
              min={60}
              max={180}
              step={2}
              valueLabelDisplay="auto"
            />
          </Box>
        )}

        {/* Deck Tab */}
        {tab === 2 && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.shuffleOnJoin}
                  onChange={() => handleChange("shuffleOnJoin", !settings.shuffleOnJoin)}
                />
              }
              label="Shuffle Deck on Join"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.allowDuplicates}
                  onChange={() => handleChange("allowDuplicates", !settings.allowDuplicates)}
                />
              }
              label="Allow Duplicate Cards"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.allowDiscard}
                  onChange={() => handleChange("allowDiscard", !settings.allowDiscard)}
                />
              }
              label="Enable Discard Pile"
            />
          </Box>
        )}


{tab === 3 && (
  <Box>
    {/* Mode Selection */}
    <FormControl component="fieldset" sx={{ mt: 2 }}>
      <FormLabel component="legend">Mode</FormLabel>
      <RadioGroup
        row
        value={settings?.table?.mode || "Stacked"}
        onChange={(e) => {
          handleChange("table", {
            ...settings.table,
            mode: e.target.value,
          });
        }}
      >
        {["Stacked", "Circular", "Revealed"].map((modeName) => (
          <FormControlLabel
            key={modeName}
            value={modeName}
            control={<Radio />}
            label={modeName}
          />
        ))}
      </RadioGroup>
    </FormControl>

    {(() => {
      const mode = settings?.table?.mode || "Stacked";
      const currentCardFace = settings?.table?.cardFace?.[mode] || {};
      const handKey = `${mode}_hand`;
      const currentHandFace = settings?.table?.cardFace?.[handKey] || {};
      const currentTurn = settings?.table?.turn?.[mode] || "None";
      const zone1 = settings?.table?.zones?.zone1?.[mode] || false;
      const zone2 = settings?.table?.zones?.zone2?.[mode] || false;
      const zone3 = settings?.table?.zones?.zone3?.[mode] || false;
      const zone4 = settings?.table?.zones?.zone4?.[mode] || false;
      const turnAccessEnabled = settings?.table?.turnAccessEnabled?.[mode] ?? true;

      return (
        <>
          {/* Card Face */}
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Card Face ({mode})</FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentCardFace.strict || false}
                    onChange={(e) => {
                      const strict = e.target.checked;
                      const faceUp = currentCardFace.faceUp ?? false;

                      handleChange("table", {
                        ...settings.table,
                        cardFace: {
                          ...settings.table.cardFace,
                          [mode]: strict ? { strict, faceUp } : { strict: false },
                        },
                      });
                    }}
                  />
                }
                label="Strict"
              />
              {currentCardFace.strict && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentCardFace.faceUp || false}
                      onChange={(e) => {
                        handleChange("table", {
                          ...settings.table,
                          cardFace: {
                            ...settings.table.cardFace,
                            [mode]: {
                              ...currentCardFace,
                              faceUp: e.target.checked,
                            },
                          },
                        });
                      }}
                    />
                  }
                  label={currentCardFace.faceUp ? "Up" : "Down"}
                />
              )}
            </FormGroup>
          </FormControl>

          {/* Card Face in Hand */}
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Card Face in Hand ({mode})</FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentHandFace.strict || false}
                    onChange={(e) => {
                      const strict = e.target.checked;
                      const faceUp = currentHandFace.faceUp ?? false;

                      handleChange("table", {
                        ...settings.table,
                        cardFace: {
                          ...settings.table.cardFace,
                          [handKey]: strict ? { strict, faceUp } : { strict: false },
                        },
                      });
                    }}
                  />
                }
                label="Strict"
              />
              {currentHandFace.strict && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentHandFace.faceUp || false}
                      onChange={(e) => {
                        handleChange("table", {
                          ...settings.table,
                          cardFace: {
                            ...settings.table.cardFace,
                            [handKey]: {
                              ...currentHandFace,
                              faceUp: e.target.checked,
                            },
                          },
                        });
                      }}
                    />
                  }
                  label={currentHandFace.faceUp ? "Up" : "Down"}
                />
              )}
            </FormGroup>
          </FormControl>

          {/* Per-Mode Turn Access Enable Checkbox */}
      <FormControl component="fieldset" sx={{ mt: 2 }}>
        <FormLabel component="legend">Turn Access (Who Played)</FormLabel>
          <FormControlLabel
            control={
              <Checkbox
                checked={turnAccessEnabled}
                onChange={(e) => {
                  handleChange("table", {
                    ...settings.table,
                    turnAccessEnabled: {
                      ...settings.table.turnAccessEnabled,
                      [mode]: e.target.checked,
                    },
                  });
                }}
              />
            }
            label="Turn Access"
          />

          {/* Turn Access (Who Played) - Conditional by Mode */}
          {turnAccessEnabled && (
              <RadioGroup
                row
                value={currentTurn}
                onChange={(e) => {
                  handleChange("table", {
                    ...settings.table,
                    turn: {
                      ...settings.table.turn,
                      [mode]: e.target.value,
                    },
                  });
                }}
              >
                {["Next", "Current", "None"].map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
          )}
        </FormControl>

          {/* Turn Skipping */}
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Turn Skipping</FormLabel>
            <RadioGroup
              row
              value={settings?.table?.turn?.skip || "auto"}
              onChange={(e) => {
                handleChange("table", {
                  ...settings.table,
                  turn: {
                    ...settings.table.turn,
                    skip: e.target.value,
                  },
                });
              }}
            >
              <FormControlLabel value="auto" control={<Radio />} label="Auto Skip" />
              <FormControlLabel value="manual" control={<Radio />} label="Manual Skip" />
            </RadioGroup>
          </FormControl>

          {/* Zone Settings */}
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Zone Setting</FormLabel>
            <FormControlLabel
              label="Zone 1"
              control={
                <Switch
                  checked={!!zone1}
                  onChange={(e) => {
                    handleChange("table", {
                      ...settings.table,
                      zones: {
                        ...settings.table.zones,
                        zone1: {
                          ...settings.table.zones?.zone1,
                          [mode]: e.target.checked,
                        },
                      },
                    });
                  }}
                />
              }
            />
            <FormControlLabel
              label="Zone 2"
              control={
                <Switch
                  checked={!!zone2}
                  onChange={(e) => {
                    handleChange("table", {
                      ...settings.table,
                      zones: {
                        ...settings.table.zones,
                        zone2: {
                          ...settings.table.zones?.zone2,
                          [mode]: e.target.checked,
                        },
                      },
                    });
                  }}
                />
              }
            />
            <FormControlLabel
              label="Zone 3"
              control={
                <Switch
                  checked={!!zone3}
                  onChange={(e) => {
                    handleChange("table", {
                      ...settings.table,
                      zones: {
                        ...settings.table.zones,
                        zone3: {
                          ...settings.table.zones?.zone3,
                          [mode]: e.target.checked,
                        },
                      },
                    });
                  }}
                />
              }
            />
            <FormControlLabel
              label="Zone 4"
              control={
                <Switch
                  checked={!!zone4}
                  onChange={(e) => {
                    handleChange("table", {
                      ...settings.table,
                      zones: {
                        ...settings.table.zones,
                        zone4: {
                          ...settings.table.zones?.zone4,
                          [mode]: e.target.checked,
                        },
                      },
                    });
                  }}
                />
              }
            />
          </FormControl>
        </>
      );
    })()}
  </Box>
)}


        {/* Strict Tab */}
        {tab === 4 && (
          <Box>
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">Strict Rules</FormLabel>
              <FormGroup row>

                {/* Strict Card Face Toggle */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!settings.strict?.card}
                      onChange={(e) => {
                        const value = e.target.checked;
                        const updatedStrict = {
                          ...settings.strict,
                          card: value ? { cardFace: false } : undefined
                        };
                        handleChange("strict", updatedStrict);
                      }}
                    />
                  }
                  label="Card Face Strict"
                />

                {/* Face Up/Down Toggle */}
                {!!settings.strict?.card && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.strict.card.cardFace || false}
                        onChange={(e) => {
                          const value = e.target.checked;
                          const updatedStrict = {
                            ...settings.strict,
                            card: {
                              ...settings.strict.card,
                              cardFace: value
                            }
                          };
                          handleChange("strict", updatedStrict);
                        }}
                      />
                    }
                    label={`Face ${settings.strict.card.cardFace ? "Up" : "Down"}`}
                  />
                )}

                {/* Strict Drag Toggle */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!settings.strict?.cardDrag}
                      onChange={(e) => {
                        const value = e.target.checked;
                        const updatedStrict = {
                          ...settings.strict,
                          cardDrag: value
                        };
                        handleChange("strict", updatedStrict);
                      }}
                    />
                  }
                  label="Disable Drag"
                />
              </FormGroup>
            </FormControl>
          </Box>
        )}

        {tab === 5 && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.enableLog}
                  onChange={() => handleChange("enableLog", !settings.enableLog)}
                />
              }
              label="Enable Room Log"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.showLogTop}
                  onChange={() => handleChange("showLogTop", !settings.showLogTop)}
                />
              }
              label="Show Log on Top"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        
            {hostUid === user?.uid && (
          <Button
            size="small"
            variant="text"
              onClick={() => {
                dispatch(deleteRoom({ roomId })).then(() => {
                  navigate("/rooms");
                });
              }}
            sx={{
              color: "#f44336",
              textTransform: "none",
              fontSize: "0.75rem",
              px: 1,
              mr: "auto"
            }}
            startIcon={<DeleteIcon fontSize="small" />}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
