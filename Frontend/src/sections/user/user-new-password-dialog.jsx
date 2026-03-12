import api from "../../utils/api";
import PropTypes from "prop-types";
import React, { useState } from "react";

import {
  Grid,
  Dialog,
  Button,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material";

function UserNewPasswordDialog({
  isConfirmationEditOpen,
  setConfirmationEditOpen,
  email: initialEmail,
  id,
  fetchUsers,
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errorshow, setError] = useState(null);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleEdit = async () => {
    try {
      // Send PUT request to update the user's email
      await api.put(
        `/user/users/${id}/password`,
        { email, password }
      );

      if (password) {
        // Send PUT request to update the user's password
        await api.put(
          `/user/users/${id}/password`,
          { password }
        );
      }

      // Refresh users after successful edit
      fetchUsers();
    } catch (error) {
      console.error("Error editing user:", error);
      setError(error.message);
    }

    setConfirmationEditOpen(false);
  };

  return (
    <Dialog
      open={isConfirmationEditOpen}
      onClose={() => setConfirmationEditOpen(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Edit User</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={3}>
          <Grid item xs={12}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              name="email"
              value={email}
              onChange={handleEmailChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="New Password"
              variant="outlined"
              fullWidth
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            {errorshow && (
              <Typography variant="body2" color="error">
                {errorshow}
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmationEditOpen(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={handleEdit} color="primary">
          Change Password
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UserNewPasswordDialog.propTypes = {
  setConfirmationEditOpen: PropTypes.func.isRequired,
  isConfirmationEditOpen: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  fetchUsers: PropTypes.func.isRequired,
};

export default UserNewPasswordDialog;
