import axios from 'axios';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Card,
  Stack,
  Button,
  Container,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

const AccountPasswordChange = ({ userID }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setSnackbarMessage('New passwords do not match.');
      return;
    }

    if (!window.confirm('Are you sure you want to change your password?')) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/auth/changePassword',
        {
          userID,
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      console.log('Password change successful:', response.data);
      setSnackbarMessage('Password changed successfully.');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error.response.data.error);
      setSnackbarMessage('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Change Password | GYM</title>
      </Helmet>
      <Box sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ pt: 4 }}>
            <Container maxWidth="sm" p={4}>
              <Typography variant="h4" gutterBottom>
                Change Password
              </Typography>
              <form onSubmit={handleFormSubmit}>
                <Stack spacing={2}>
                  <TextField
                    type="password"
                    label="Old Password"
                    variant="outlined"
                    fullWidth
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <TextField
                    type="password"
                    label="New Password"
                    variant="outlined"
                    fullWidth
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <TextField
                    type="password"
                    label="Confirm New Password"
                    variant="outlined"
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
                  >
                    {isLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                  {snackbarMessage && (
                    <p style={{ fontSize: '0.8rem', color: 'red', marginTop: '8px' }}>
                      {snackbarMessage}
                    </p>
                  )}
                </Stack>
              </form>
            </Container>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

AccountPasswordChange.propTypes = {
  userID: PropTypes.any,
};

export default AccountPasswordChange;
