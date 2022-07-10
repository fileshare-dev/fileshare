import PropTypes from 'prop-types';
import { IconButton, ListItem, ListItemText } from '@mui/material';
import Iconify from '../../../components/Iconify';

import ShareAPI from '../../../services/ShareAPI';

export default function ShareFileItem(props) {
  const {shareuid, filename} = props;

  const handleDownload = () => {
    ShareAPI.downloadFileShareAuth(shareuid, filename).then( (response) => {
      const b64url = `data://binary/octet-stream;base64,${response.share.file.data}`;
      fetch(b64url).then((data) => data.blob()).then( (blobfile) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blobfile);
        link.setAttribute('download', response.share.file.name);
        document.body.appendChild(link);
        link.click();
      });
    });
  };
  
  return (
    <div>
      <ListItem>
        <ListItemText inset primary={filename} />

        <IconButton onClick={handleDownload}>
          <Iconify icon="eva:download-outline" width={24} height={24} />
        </IconButton>
      </ListItem>
    </div>
  );
};

ShareFileItem.propTypes = {
  shareuid: PropTypes.string,
  filename: PropTypes.string
};
