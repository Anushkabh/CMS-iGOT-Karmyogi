import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import api from "../../../utils/api";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const roles = ["admin", "editor", "super admin"];

export default function NewUserForm({ setClickedTitle }) {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const [error, setError] = useState(null);

  const [currentUserData, setCurrentUserDate] = useState(null); // this isis current user's data - token, role, name, email.

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const tokenParts = token.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        setCurrentUserDate(payload);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const response = await api.post("/auth/addNewUser", userData);
      setUserData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
      });
      setError("User Added Successfully");
      setClickedTitle("all");
    } catch (error) {
      console.error("Error adding user:", error);
      setError(error.response?.data?.error || error.response?.data?.message);
    }
  };

  return (
    <Grid px={8} py={2} spacing={2} justifyContent="center" alignItems="center">
      <Grid item xs={12}>
        <Typography variant="h5" align="center" gutterBottom>
          Add New User
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          name="name"
          value={userData.name}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          name="password"
          value={userData.password}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          name="email"
          value={userData.email}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Phone"
          variant="outlined"
          fullWidth
          name="phone"
          value={userData.phone}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Role"
          variant="outlined"
          fullWidth
          name="role"
          value={userData.role}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        >
          {currentUserData && currentUserData.role == "super admin" ? (
            roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))
          ) : (
            <MenuItem key={"editor"} value={"editor"}>
              {"editor"}
            </MenuItem>
          )}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Add User
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

NewUserForm.propTypes = {
  setClickedTitle: PropTypes.func.isRequired,
};
