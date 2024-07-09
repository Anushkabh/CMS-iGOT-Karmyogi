import axios from "axios";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const roles = ["admin", "editor", "super admin"];

export default function NewWebsiteForm({ setClickedTitle }) {
  const [websiteData, setWebsiteData] = useState({
    name: "",
    url: "",
  });

  const [error, setError] = useState(null);

  const [currentUserData, setCurrentUserData] = useState(null); // this is current user's data - token, role, name, url.

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const tokenParts = token.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        setCurrentUserData(payload);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWebsiteData({ ...websiteData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/website`,
        websiteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Website added successfully:", response.data);
      setWebsiteData({
        name: "",
        url: "",
      });
      setError("Website Added Successfully");
      setClickedTitle("all");
    } catch (error) {
      console.error("Error adding website:", error);
      setError(error.response.data.error);
    }
  };

  return (
    <Grid
      container
      px={8}
      py={2}
      spacing={2}
      justifyContent="center"
      alignItems="center"
    >
      <Grid item xs={12}>
        <Typography variant="h5" align="center" gutterBottom>
          Add New Website
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          name="name"
          value={websiteData.name}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="URL"
          variant="outlined"
          fullWidth
          name="url"
          value={websiteData.url}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Add Website
        </Button>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Grid>
    </Grid>
  );
}

NewWebsiteForm.propTypes = {
  setClickedTitle: PropTypes.func.isRequired,
};
