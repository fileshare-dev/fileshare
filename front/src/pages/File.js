import { useState , useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Modal,
  Stack,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  TableContainer,
  TablePagination,
} from '@mui/material';

import Page from '../components/Page';
import Scrollbar from '../components/Scrollbar';
import Iconify from '../components/Iconify';
import FileMenu from '../sections/@dashboard/files/FileMenu';

import FileAPI from '../services/FileAPI';

export default function User() {

  const [selectedFile, setSelectedFile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openModal, setOpenModal] = useState(false);

  const [files, setFiles] = useState([]);
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

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const onFileUpload = (event) => {
    event.preventDefault();
    FileAPI.upload(selectedFile).then((response) => {
      if (response){
        if (response.error){
          setError(response.message);
          setSuccess('');
        }else{
          setError('');
          setSuccess('Your file has been updated');
        }
      }
      setIsLoaded(false);
    });
  };

  useEffect( () => {
    FileAPI.list().then( (x) => {
      setFiles(x.files);
      setIsLoaded(true);
    });
  }, []);

  useEffect( () => {
    if (!isLoaded){
      FileAPI.list().then( (x) => {
        setFiles(x.files);
        setIsLoaded(true);
      });
    }
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - files.length) : 0;

  return (
    <Page title="File">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Files
          </Typography>
          <Button variant="contained" onClick={handleModelOpen} component={RouterLink} to="#" startIcon={<Iconify icon="eva:plus-fill" />}>
            New File
          </Button>
        </Stack>

        <Modal
          open={openModal}
          onClose={handleModalClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4
          }}>
            <Box
              sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography component="h1" variant="h5">
                Upload file
              </Typography>
              {error.length > 0 && <Alert severity="error">{error}</Alert>}
              {success.length > 0 && <Alert severity="success">{success}</Alert>}
 
              <Box component="form" onSubmit={onFileUpload} noValidate sx={{ mt: 1 }}>
                <label htmlFor="fileinput">Select your file<br/>
                  <input id="fileinput" type="file" onChange={onFileChange}/>
                </label>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  onClick={onFileUpload}
                >
                  Upload
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align='center'>
                      Name
                    </TableCell>
                    <TableCell align='center'>
                      Upload date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const { id, name, createdAt } = row;

                    return (
                      <TableRow
                        hover
                        key={id}
                        tabIndex={-1}
                        role="checkbox"
                      >
                        <TableCell scope="row" padding="none" align='center'>
                              {name}
                        </TableCell>
                        <TableCell scope="row" padding="none" align='center'>
                      {new Date(Date.parse(createdAt)).toLocaleString('en')}
                        </TableCell>
                        <TableCell align="right">
                          <FileMenu uid={id} setIsLoaded={setIsLoaded} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            count={files.length}
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
