import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import axios from "axios";

function AddNewPage({ open, onClose, selectedWebsiteBucket, handleCreateNewPage }) {
  const [newPageId, setNewPageId] = useState("");

  const handleNewPageChange = (event) => {
    setNewPageId(event.target.value);
  };

  const handleCreatePage = async () => {
    try {
      await handleCreateNewPage(newPageId);
      setNewPageId(""); // Clear the input after creation
      onClose(); // Close the dialog after creation
    } catch (error) {
      console.error("Error creating folder:", error.response?.data || error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Folder</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item m={4} xs={12}>
            <TextField
              label="New Page ID"
              value={newPageId}
              onChange={handleNewPageChange}
              fullWidth
              variant="outlined"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleCreatePage} color="primary">
          Create Folder
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddNewPage;
