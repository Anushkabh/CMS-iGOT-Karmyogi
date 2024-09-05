import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

function FolderSelect({ pages, selectedPageId, handlePageChange }) {
  return (
    <FormControl fullWidth>
      <InputLabel id="page-select-label">Select Page</InputLabel>
      <Select
        label="Select Folder"
        id="page-select"
        value={selectedPageId}
        onChange={handlePageChange}
      >
        {pages.map((page) => (
          <MenuItem key={page} value={page}>
            {page}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default FolderSelect;
