import { useState , useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Container,
  Stack,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  List,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  TableContainer,
  TablePagination,
  TextField,
} from '@mui/material';

import Page from '../components/Page';
import Scrollbar from '../components/Scrollbar';
import Iconify from '../components/Iconify';
import ShareMenu from '../sections/@dashboard/shares/ShareMenu';
import ShareFileItem from '../sections/@dashboard/shares/ShareFileItem';

import ShareAPI from '../services/ShareAPI';
import FileAPI from '../services/FileAPI';

export default function User() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openModal, setOpenModal] = useState(false);

  const [files, setFiles] = useState([]);
  const [shares, setShares] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleModalClose = () => {
    setError('');
    setSuccess('');
    setOpenModal(false);
  };

  const handleModelOpen = () => {
    setError('');
    setSuccess('');
    setOpenModal(true);
  };

  useEffect( () => {
    if (!isLoaded){
      setIsLoaded(true);
      FileAPI.list().then( (x) => {
        setFiles(x.files);
      }).then( () => {
        ShareAPI.listShare().then( (x) => {
          setShares(x.shares);
        });
      });
    }
  }, [isLoaded]);


  const handleShareSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const filesUID = selectedFiles.map( (x) => x.id  );
    ShareAPI.createShare(data.get("share_name"), filesUID).then( (response) => {
      if (response){
        if (response.error){
          setSuccess('');
          setError(response.message);
        }else{
          setSuccess('The share has been created');
          setError('');
          setIsLoaded(false);
        }
      }
    });
  };

  const onFileSelected = (event, value) => {
    setSelectedFiles(value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - shares.length) : 0;

  return (
    <Page title="Share">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Files
          </Typography>
          <Button variant="contained" onClick={handleModelOpen} component={RouterLink} to="#" startIcon={<Iconify icon="eva:plus-fill" />}>
            New File
          </Button>
        </Stack>

        <Dialog
          open={openModal}
          onClose={handleModalClose}
          fullWidth
          maxWidth={"xs"}
        >
          <DialogTitle>Add a share</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleShareSubmit} noValidate sx={{ mt: 1 }}>
              {error.length > 0 && <Alert severity="error">{error}</Alert>}
              {success.length > 0 && <Alert severity="success">{success}</Alert>}
              <div>
                <TextField
                  required
                  fullWidth
                  name="share_name"
                  label="Share name"
                  type="text"
                  id="share_name"
                  />
                  <Autocomplete
                    multiple
                    limitTags={2}
                    onChange={onFileSelected}
                    id="multiple-limit-tags"
                    options={files}
                    getOptionLabel={(option) => option.name}
                    renderOption={(props, option) => 
                      (
                        <li {...props} key={option.id}>
                          {option.name}
                        </li>
                      )
                    }
                    renderInput={(params) => (
                      <TextField {...params} name="files" label="Files" placeholder="Select files" />
                    )}
                  />
                </div>
                <DialogActions>
                  <Button onClick={handleModalClose}>Cancel</Button>
                  <Button type="submit">Submit</Button>
                </DialogActions>
             </Box>
            </DialogContent>
        </Dialog>
        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableHead>
                  <TableRow role="checkbox">
                    <TableCell align='center'>
                      Name
                    </TableCell>
                    <TableCell align='center'>
                      Is public
                    </TableCell>
                    <TableCell align='center'>
                      Valid until
                    </TableCell>
                    <TableCell align='center'>
                      Files
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shares.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => 
                    (
                      <TableRow
                        key={row.id}
                      >
                        <TableCell align='center'>{row.name}</TableCell>

                        <TableCell align='center'>
                          {row.isPublic ? <Iconify icon='eva:done-all-fill' /> : <Iconify icon='eva:close-fill' /> }
                        </TableCell>
                        <TableCell align='center'> {row.validUntil ? new Date(Date.parse(row.validUntil)).toLocaleString("en"): ''}</TableCell>
                        <TableCell align='center'>
                          <List sx={{ maxWidth: 300 }}>
                            {row.files.map( (sharefile) => (
                              <ShareFileItem key={row.id+sharefile.id} filename={sharefile.name} shareuid={row.id} />
                            ))}
                          </List>
                        </TableCell>
                        <TableCell align='right'>
                          <ShareMenu uid={row.id} setIsLoaded={setIsLoaded} isPublic={row.isPublic} link={row.link} />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={shares.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </Page>
  );
}
