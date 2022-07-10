import UserAPI from './UserAPI';
import Utils from './Utils';


const ShareAPI = {
  async createShare(sharename, listOfFilesUid){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = UserAPI.getAuthHeader();
    headers.append("Content-Type", "application/json");
    const data = JSON.stringify({name: sharename, files: listOfFilesUid})
    const response = await fetch(`${BASEURL}/rest/shares/`, {
      method: 'POST',
      body: data,
      headers
    });
    return response.json();
  },

  async listShare(){
    const headers = UserAPI.getAuthHeader();
    const BASEURL = Utils.getBackendBaseURL();
    headers.append("Content-Type", "application/json");
    const response = await fetch(`${BASEURL}/rest/shares/`, {
      method: 'GET',
      headers
    });
    return response.json();
  },

  async togglePublish(uid){
    const headers = UserAPI.getAuthHeader();
    const BASEURL = Utils.getBackendBaseURL();
    headers.append("Content-Type", "application/json");
    const response = await fetch(`${BASEURL}/rest/shares/${uid}/toggle-publish`, {
      method: 'GET',
      headers
    });
    return response.json();
  },

  async giveAccess(uid, mfa, username){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = UserAPI.getAuthHeader();
    headers.append("Content-Type", "application/json");
    const data = JSON.stringify({code: mfa, username})
    const response = await fetch(`${BASEURL}/rest/shares/${uid}/give-access`, {
      method: 'POST',
      body: data,
      headers
    });
    return response.json();
  },

  async deleteShare(uid){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = UserAPI.getAuthHeader();
    headers.append("Content-Type", "application/json");
    const response = await fetch(`${BASEURL}/rest/shares/${uid}/`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  async downloadFileShareAuth(shareUID, fileName){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = UserAPI.getAuthHeader();
    headers.append("Content-Type", "application/json");
    const response = await fetch(`${BASEURL}/rest/shares/${shareUID}/files/${fileName}`, {
      method: 'GET',
      headers
    });
    return response.json();
  }
};

export default ShareAPI;
