import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Avatar,
  Typography,
  CardContent,
} from '@mui/material';

export const AccountProfile = ({ userDetails }) => {
  // Initialize user state with default values
  console.log(userDetails);
  console.log(userDetails);
  console.log(userDetails);
  console.log(userDetails);
  console.log(userDetails);
  const [user, setUser] = useState({
    avatar: '/assets/images/avatars/avatar_1.jpg',
    email: '',
    country: 'USA',
    jobTitle: 'Senior Developer',
    name: '', // Placeholder for name until we fetch data
    timezone: 'GMT-5:30',
  });

  // Update user state when userDetails changes
  useEffect(() => {
    // Check if userDetails is defined before updating user state
    if (userDetails) {
      setUser({
        avatar: '/assets/images/avatars/avatar_1.jpg',
        email: userDetails.email,
        country: 'USA',
        jobTitle: 'Senior Developer',
        name: userDetails.name,
        timezone: 'GTM-7',
      });
    }
  }, [userDetails]);

  // Additional logging for debugging
  console.log("Current User:");
  console.log(userDetails);
  console.log("User State:");
  console.log(user);

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Avatar
            src={user.avatar}
            sx={{
              height: 80,
              mb: 2,
              width: 80,
            }}
          />
          <Typography gutterBottom variant="h5">
            {user.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {user.email}
          </Typography>
          {/* Example: Displaying lastLogin if available in userDetails */}
          <Typography color="text.secondary" variant="body2">
            {userDetails && userDetails.lastLogin ? userDetails.lastLogin : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

AccountProfile.propTypes = {
  userDetails: PropTypes.object, // Adjust PropTypes to match expected shape of userDetails
};

export default AccountProfile;
