// ** React Import
import { useState } from "react";

// ** MUI Imports
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";

// ** Third Party Imports
import { usePopper } from "react-popper";
import { COPILOT } from "src/utils/images/icons";

const BuyNowButton = () => {
  // ** States
  const [open, setOpen] = useState<boolean>(false);
  const [popperElement, setPopperElement] = useState(null);
  const [referenceElement, setReferenceElement] = useState(null);

  const { styles, attributes, update } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "top-end",
    }
  );

  const handleOpen = () => {
    setOpen(true);
    update ? update() : null;
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box
      className="upgrade-to-pro-button mui-fixed"
      sx={{
        right: (theme) => theme.spacing(10),
        bottom: (theme) => theme.spacing(10),
        zIndex: 11,
        position: "fixed",
      }}
    >
      <img src={COPILOT} alt="Copilot" className="h-14 w-14 cursor-pointer" />
    </Box>
  );
};

export default BuyNowButton;
