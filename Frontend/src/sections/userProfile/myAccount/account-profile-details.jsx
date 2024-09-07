import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Button,
  TextField,
  CardHeader,
  CardContent,
  CardActions,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import axios from 'axios'; // You can also use fetch if you prefer

export const AccountProfileDetails = ({ userDetails }) => {
  const [values, setValues] = useState({
    name: userDetails.name,
    phone: userDetails.phone,
    email: userDetails.email,
  });

  // Update values if userDetails changes
  useEffect(() => {
    setValues({
      name: userDetails.name,
      phone: userDetails.phone,
      email: userDetails.email,
    });
  }, [userDetails]);

  // Handle input changes
  const handleChange = useCallback((event) => {
    setValues((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/auth/usersDetailUpdate/${userDetails._id}`,
        {
          name: values.name,
          phone: values.phone,
          email: values.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }

      );

      if (response.status === 200) {
        alert('User details updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      alert('Failed to update user details.');
    }
  }, [values, userDetails.id]);

  return (
    <form autoComplete="off" noValidate onSubmit={handleSubmit}>
      <Card>
        <CardHeader subheader="Please update your details below" title="Profile" />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ m: 1.5 }}>
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  onChange={handleChange}
                  required
                  value={values.name}
                />
              </Grid>

              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  onChange={handleChange}
                  required
                  value={values.email}
                />
              </Grid>

              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  onChange={handleChange}
                  required
                  value={values.phone}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained">Save details</Button>
        </CardActions>
      </Card>
    </form>
  );
};

AccountProfileDetails.propTypes = {
  userDetails: PropTypes.any.isRequired,
};
