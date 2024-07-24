// WebsiteSelector.js
import React from "react";
import PropTypes from "prop-types";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

export default function WebsiteSelector({
  websites,
  selectedWebsite,
  setSelectedWebsite,
  setSelectedWebsiteBucket,
}) {
  const handleChange = (event) => {
    const selectedWebsite = websites.find(
      (website) => website.url === event.target.value
    );
    setSelectedWebsite(selectedWebsite.url);
    setSelectedWebsiteBucket(selectedWebsite.bucketName);
  };

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 4 }}>
      <InputLabel id="website-select-label">Select Website</InputLabel>
      <Select
        labelId="website-select-label"
        id="website-select"
        value={selectedWebsite}
        onChange={handleChange}
        label="Select Website"
      >
        {websites.map((website) => (
          <MenuItem key={website.id} value={website.url}>
            {website.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

WebsiteSelector.propTypes = {
  websites: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      bucketName: PropTypes.string.isRequired, // Ensure this is included in the shape
    })
  ).isRequired,
  selectedWebsite: PropTypes.string.isRequired,
  setSelectedWebsite: PropTypes.func.isRequired,
  setSelectedWebsiteBucket: PropTypes.func.isRequired, // Ensure this is included in the prop types
};
