import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';

import { Box, Stack, Container, Typography, Unstable_Grid2 as Grid } from '@mui/material';

import { AccountProfile } from '../sections/userProfile/myAccount/account-profile';
import  AccountPasswordChange  from '../sections/userProfile/myAccount/account-password-change';
import { AccountProfileDetails } from '../sections/userProfile/myAccount/account-profile-details';

const AccountPage = () => {
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/auth/userDetails', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('response');
        console.log('response');
        console.log('response');
        console.log(response.data.user);
        setUserDetails(response.data.user);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <Helmet>
        <title>User | GYM</title>
      </Helmet>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth="lg" gap={3}>
          <Stack spacing={3}>
            <div>
              <Typography variant="h4">Account</Typography>
            </div>
            <div>
              <Grid container spacing={3}>
                <Grid xs={12} md={6} lg={4} my={3}>
                  {userDetails && <AccountProfile userDetails={userDetails} />}
                </Grid>
              </Grid>
              {userDetails && <AccountProfileDetails userDetails={userDetails} />}
            </div>
            <div>
              <Grid container spacing={3}>
                <Grid xs={12} md={6} lg={4} my={3}>
                  {userDetails && <AccountPasswordChange userID={userDetails._id} />}
                </Grid>
              </Grid>
            </div>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default AccountPage;
