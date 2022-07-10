import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { Menu, MenuItem, IconButton, ListItemIcon, ListItemText } from '@mui/material';
import Iconify from '../../../components/Iconify';

import FileAPI from '../../../services/FileAPI';

export default function FileMenu(props) {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const {uid, setIsLoaded} = props;

  const handleFileDelete = () => {
    FileAPI.deleteFile(uid).then( () => {
      setIsLoaded(false);
    });
  };
  
  return (
    <>
      <IconButton ref={ref} onClick={() => setIsOpen(true)}>
        <Iconify icon="eva:more-vertical-fill" width={20} height={20} />
      </IconButton>

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
        <MenuItem onClick={handleFileDelete} sx={{ color: 'text.secondary' }}>
          <ListItemIcon>
            <Iconify icon="eva:trash-2-outline" width={24} height={24} />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ variant: 'body2' }} />
        </MenuItem>
      </Menu>
    </>
  );
}

FileMenu.propTypes = {
  uid: PropTypes.string,
  setIsLoaded: PropTypes.func
};
