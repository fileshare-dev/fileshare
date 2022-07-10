import { Box, Container, Typography, Link} from '@mui/material';

function Copyright() {
  return (
    <Box
      component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
        }}
    >
      <Container maxWidth="sm">
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <Link color="inherit" href="https://github.com/fileshare-dev/fileshare">
            FileShare
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Container>
    </Box>
    );
}

export default Copyright;
