import Utils from './Utils';

const DownloadAPI = {
  async downloadShare(publiclink){
    const BASEURL = Utils.getBackendBaseURL();
    const response = await fetch(`${BASEURL}/rest/download/${publiclink}`, {
      method: 'GET',
      mode: 'cors'
    });
    return response.json();
  },
  
  async downloadFile(publiclink, fileUid){
    const BASEURL = Utils.getBackendBaseURL();
    const response = await fetch(`${BASEURL}/rest/download/${publiclink}/${fileUid}/raw`, {
      method: 'GET',
      mode: 'cors'
    });
    return response;
  }
};

export default DownloadAPI;
