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

// const user = window.sessionStorage.getItem("user");

export const AccountProfileDetails = ({ userDetails }) => {
  console.log('edr hi ');
  console.log(userDetails);
  console.log(userDetails);
  const [values, setValues] = useState({
    name: userDetails.name,
    phone: userDetails.phone,
    email: userDetails.email,
    address: userDetails.address,
  });

  useEffect(() => {
    setValues({
      name: userDetails.name,
      phone: userDetails.phone,
      email: userDetails.email,
      address: userDetails.address,
    });
  }, [userDetails]);

  const handleChange = useCallback((event) => {
    setValues((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
  }, []);

  return (
    <form autoComplete="off" noValidate onSubmit={handleSubmit}>
      <Card>
        <CardHeader subheader="Please contact admin if your details are wrong" title="Profile" />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ m: 1.5 }}>
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  // helperText="Please specify the first name"
                  label="Name"
                  name="name"
                  onChange={handleChange}
                  required
                  disabled
                  value={values.name}
                />
              </Grid>

              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  onChange={handleChange}
                  // required
                  // disabled
                  disabled
                  value={values.email}
                />
              </Grid>

              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="phone"
                  name="phone"
                  onChange={handleChange}
                  disabled
                  value={values.phone}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained">Save details</Button>
        </CardActions>
      </Card>
    </form>
  );
};

AccountProfileDetails.propTypes = {
  userDetails: PropTypes.any,
};
