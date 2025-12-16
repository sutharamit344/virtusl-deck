import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  useTheme,
  Box,
} from "@mui/material";
import { useState } from "react";

const PasswordDialog = ({ onSubmit }) => {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const theme = useTheme();

  const handleSubmit = () => {
    onSubmit?.(input); // only if function passed
    setInput("");
    setOpen(false);
  };

  return (
    <Box 
        sx={{
            height:"100vh",
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            mt:-6
        }}
        >
      {/* Button to open dialog */}
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        sx={{
          backgroundColor: "#00D8FF",
          color: "#000",
          fontWeight: "bold",
          textTransform: "none",
          borderRadius: "12px",
          "&:hover": {
            backgroundColor: "#00bddd",
          },
        }}
      >
        Join Now
      </Button>

      {/* Password Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1c1c1c",
            borderRadius: "20px",
            boxShadow: "0px 0px 25px rgba(0, 216, 255, 0.2)",
            color: "#E6EDF3",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            color: "#00D8FF",
            fontSize: "1.25rem",
            textAlign: "center",
          }}
        >
          🔒 Enter Room Password
        </DialogTitle>

        <DialogContent sx={{ paddingX: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label="Password"
            variant="outlined"
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            sx={{
              mt: 1,
              input: {
                color: "#E6EDF3",
                backgroundColor: "#2a2a2a",
              },
              label: {
                color: "#aaa",
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                "& fieldset": {
                  borderColor: "#444",
                },
                "&:hover fieldset": {
                  borderColor: "#00D8FF",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#00D8FF",
                },
              },
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            sx={{
              color: "#aaa",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              backgroundColor: "#00D8FF",
              color: "#000",
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "#00bddd",
              },
            }}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PasswordDialog;
