import UserAPI from './UserAPI';
import Utils from './Utils';

const FileAPI = {
  async upload(file){
    const BASEURL = Utils.getBackendBaseURL();
    const data = new FormData();
    const headers = UserAPI.getAuthHeader();
    data.append('file', file, file.name);
    const response = await fetch(`${BASEURL}/rest/files/upload`, {
      method: 'POST',
      body: data,
      headers
    });
    return response.json();
  },
  async list(){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = UserAPI.getAuthHeader();
    const response = await fetch(`${BASEURL}/rest/files/`, {
      method: 'GET',
      headers
    });
    const output = await response.json();
    return output;
  },
  async deleteFile(uid){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = UserAPI.getAuthHeader();
    const response = await fetch(`${BASEURL}/rest/files/${uid}`, {
      method: 'DELETE',
      headers
    });
    const output = await response.json();
    return output;
  }
}

export default FileAPI;
