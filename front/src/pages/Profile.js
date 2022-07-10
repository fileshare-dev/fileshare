import { useState, useEffect } from 'react';
import { Container, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {QRCodeCanvas} from 'qrcode.react';

import Page from '../components/Page';


import UserAPI from '../services/UserAPI';

export default function Profile() {
  const [profile, setProfile] = useState(false);

  useEffect( () => {
    UserAPI.getProfile().then( (x) => {
      setProfile(x);
    });
  }, []);

  return (
    <Page title="Profile">
      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Profile
        </Typography>

        <Stack direction="row" flexWrap="wrap-reverse" alignItems="center" justifyContent="center" sx={{ mb: 12 }}>
          <Stack direction="row" spacing={1} flexShrink={0} sx={{ my: 1 }}>
            <Card sx={{ display: 'flex' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                  <Typography variant="subtitle1" color="text.secondary" component="div">
                    Username : {profile.username}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" component="div">
                    MFA secret:
                  </Typography>
                  <QRCodeCanvas value={profile.mfa_secret} />
                </CardContent>
              </Box>
            </Card>
          </Stack>
        </Stack>

      </Container>
    </Page>
  );
}
