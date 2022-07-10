import { useState , useEffect } from 'react';
import { useParams } from 'react-router-dom';

import {
  Alert,
  Grid,
  Typography
} from '@mui/material';

import Page from '../components/Page';
import DownloadAPI from '../services/DownloadAPI';

export default function Download() {
  const params = useParams();
  const [error, setError] = useState(0);


  useEffect(() => {
    if (params.link && !params.fileUid){
      DownloadAPI.downloadShare(params.link).then( (response) => {
        if (response){
          if (response.error){
            setError(response.message);
          }else{
            const b64url = `data://application/zip;base64,${response.share.data}`;
            fetch(b64url).then((data) => data.blob()).then( (blobfile) => {
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blobfile);
              link.setAttribute('download', `${link}.zip`);
              document.body.appendChild(link);
              link.click();
            });
          }
        }
      });
    }else if (params.link && params.fileUid){
        DownloadAPI.downloadFile(params.link, params.fileUid).then((response) => response.blob()).then( (blobfile) => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blobfile);
            link.setAttribute('download', `${params.fileUid}`);
            document.body.appendChild(link);
            link.click();
        });;
    }
  }, [params.link, params.fileUid]);

  return (
    <Page title="Download">
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        style={{minHeight: '100vh'}}
      >
        <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 5 }}>
          {error.length > 0 ? <Alert severity="error">{error}</Alert> : <Alert severity="info">Automatic download</Alert> }
        </Typography>
      </Grid>

    </Page>
  );
}
