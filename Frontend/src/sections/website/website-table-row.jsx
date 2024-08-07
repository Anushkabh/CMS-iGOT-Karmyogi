import axios from "axios";
import { useState } from "react";
import PropTypes from "prop-types";

import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import TableRow from "@mui/material/TableRow";
import MenuItem from "@mui/material/MenuItem";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import { Icon } from "@iconify/react";

import UserEditDialog from "./website-edit-dialog";
import { Box } from "@mui/material";

// ----------------------------------------------------------------------

export default function UserTableRow({ selected, id, user, fetchUsers }) {
  const [open, setOpen] = useState(null);
  const [isConfirmationDeleteOpen, setConfirmationOpen] = useState(false);
  const [isConfirmationActivateOpen, setConfirmationActivateOpen] =
    useState(false);
  const [isConfirmationEditOpen, setConfirmationEditOpen] = useState(false);

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleDelete = async () => {
    setConfirmationOpen(false); // Close the confirmation dialog
    try {
      const token = localStorage.getItem("token");

      // Send DELETE request to delete the user
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/website/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh users after successful deletion
      fetchUsers();
      console.log("User deleted successfully:", response.data);
    } catch (error) {
      console.error("Error deleting user:", error);
    }

    setOpen(null);
  };

  return (
    <>
      <TableRow hover tabIndex={-1} selected={selected}>
        <TableCell component="th" scope="row">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap>
              {user.name}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>{user.url}</TableCell>
        <TableCell>{user.bucketName}</TableCell>
        <TableCell>
          {new Date(user.createdAt).toISOString().slice(0, 10).split("T")[0]}
        </TableCell>
        <TableCell>
          {new Date(user.updatedAt).toISOString().slice(0, 10).split("T")[0]}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenMenu}>
            <Box
              component={Icon}
              className="component-iconify"
              icon={"eva:more-vertical-fill"}
              sx={{ width: 20, height: 20 }}
            />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setOpen(null);
            setConfirmationEditOpen(true);
          }}
        >
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => setConfirmationOpen(true)}
          sx={{ color: "error.main" }}
        >
          Delete
        </MenuItem>
      </Popover>

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmationDeleteOpen}
        onClose={() => setConfirmationOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete {user.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <UserEditDialog
        id={user._id}
        isConfirmationEditOpen={isConfirmationEditOpen}
        setConfirmationEditOpen={setConfirmationEditOpen}
        name={user.name}
        url={user.url}
        phone={user.phone}
        bucketName={user.bucketName}
        role={user.role}
        fetchUsers={fetchUsers}
      />
    </>
  );
}

UserTableRow.propTypes = {
  id: PropTypes.any,
  user: PropTypes.any,
  fetchUsers: PropTypes.any,
  setcurentUser: PropTypes.any,
  currentDataRow: PropTypes.any,
};
