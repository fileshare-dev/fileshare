import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { Alert, Menu, MenuItem, IconButton, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Button} from '@mui/material';
import Iconify from '../../../components/Iconify';

import ShareAPI from '../../../services/ShareAPI';

import Utils from '../../../services/Utils';

export default function ShareMenu(props) {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {uid, setIsLoaded, isPublic, link} = props;
  const BASEURL = Utils.getBackendBaseURL();

  const handleShareDelete = () => {
    ShareAPI.deleteShare(uid).then( () => {
      setIsLoaded(false);
    });
  };
  
  const handleCopyRawToClipboard = () => {
    navigator.clipboard.writeText(`${BASEURL}/rest/download/${link}`);
  };

  const handleCopyToGuiClipboard = () => {
    const { origin } = window.location;
    navigator.clipboard.writeText(`${origin}/#/download/${link}`);
  };

  const handleGiveAccess = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    ShareAPI.giveAccess(uid, data.get("token"), data.get("username")).then( (response) => {
      if (response.error){
        setSuccess('');
        setError(response.message);
      }else{
        setError('');
        setSuccess('Access was given');
        setTimeout( () => {
          setOpenModal(false);
        }, 2000);
      }
    });
  };

  const handleToggle = () => {
    ShareAPI.togglePublish(uid).then( () => {
      setIsLoaded(false);
    });
  };

  return (
    <>
      <IconButton ref={ref} onClick={() => setIsOpen(true)}>
        <Iconify icon="eva:more-vertical-fill" width={20} height={20} />
      </IconButton>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Give access</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To subscribe to give access to this share, you must provid the target username.
            {error.length > 0 && <Alert severity="error">{error}</Alert>}
            {success.length > 0 && <Alert severity="success">{success}</Alert>}
          </DialogContentText>
          <form onSubmit={handleGiveAccess} id="access_form" >
            <TextField
              autoFocus
              margin="dense"
              id="name"
              name="username"
              label="Username"
              type="text"
              fullWidth
              variant="standard"
            />            
            <TextField
              autoFocus
              margin="dense"
              id="mfa"
              name="token"
              label="Token"
              type="text"
              fullWidth
              variant="standard"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" type="submit" form="access_form">Subscribe</Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={isOpen}
        anchorEl={ref.current}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: { width: 200, maxWidth: '100%' },
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleToggle} sx={{ color: 'text.secondary' }}>
          <ListItemIcon>
            <Iconify icon="eva:clipboard-outline" width={24} height={24} />
          </ListItemIcon>
          <ListItemText primary={isPublic ? 'Unpublish' : 'Publish'} primaryTypographyProps={{ variant: 'body2' }} />
        </MenuItem>
 
        <MenuItem onClick={() => setOpenModal(true)} sx={{ color: 'text.secondary' }}>
          <ListItemIcon>
            <Iconify icon="eva:share-outline" width={24} height={24} />
          </ListItemIcon>
          <ListItemText primary='Give access to' primaryTypographyProps={{ variant: 'body2' }} />
        </MenuItem>

        {isPublic ?
        (<MenuItem onClick={handleCopyRawToClipboard} sx={{ color: 'text.secondary' }}>
          <ListItemIcon>
            <Iconify icon="eva:clipboard-outline" width={24} height={24} />
          </ListItemIcon>
          <ListItemText primary="Copy RAW public link" primaryTypographyProps={{ variant: 'body2' }} />
        </MenuItem> ) : null }
        {isPublic ?
        (<MenuItem onClick={handleCopyToGuiClipboard} sx={{ color: 'text.secondary' }}>
          <ListItemIcon>
            <Iconify icon="eva:clipboard-outline" width={24} height={24} />
          </ListItemIcon>
          <ListItemText primary="Copy public link" primaryTypographyProps={{ variant: 'body2' }} />
        </MenuItem> ) : null }
        <MenuItem onClick={handleShareDelete} sx={{ color: 'text.secondary' }}>
          <ListItemIcon>
            <Iconify icon="eva:trash-2-outline" width={24} height={24} />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ variant: 'body2' }} />
        </MenuItem>
      </Menu>
    </>
  );
}

ShareMenu.propTypes = {
  uid: PropTypes.string,
  setIsLoaded: PropTypes.func,
  isPublic: PropTypes.bool,
  link: PropTypes.string
};
