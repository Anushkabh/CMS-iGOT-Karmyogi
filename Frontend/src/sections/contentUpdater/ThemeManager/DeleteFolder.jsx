import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";

function DeletePage({
  pages,
  handleDeletePage,
  open,
  onClose,
  fetchedSelectedPageId,
}) {
  const [selectedPageId, setSelectedPageId] = useState("");

  useEffect(() => {
    setSelectedPageId(fetchedSelectedPageId);
  }, [fetchedSelectedPageId]);

  const handlePageChange = (event) => {
    setSelectedPageId(event.target.value);
  };

  const handleConfirmDelete = () => {
    handleDeletePage(selectedPageId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Page</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete this page?
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="delete-page-select-label">Select Page</InputLabel>
          <Select
            labelId="delete-page-select-label"
            value={selectedPageId}
            onChange={handlePageChange}
            label="Select Page"
          >
            {pages.map((page) => (
              <MenuItem key={page} value={page}>
                {page}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirmDelete}
          color="primary"
          disabled={!selectedPageId}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeletePage;
