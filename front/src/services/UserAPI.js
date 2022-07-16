import { useNavigate } from 'react-router-dom';

import Utils from './Utils';

const UserAPI = {
  async login(username, password) {
    const BASEURL = Utils.getBackendBaseURL();
    const response = await fetch(`${BASEURL}/rest/auth/login`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username, password})
    });
    const data = await response.json();
    if (data){
      if(!(data.error)){
        this.storeCurrentUser(data.access_token);
      }
    }
    return data;
  },
  async register(username, password){
    const BASEURL = Utils.getBackendBaseURL();
    const response = await fetch(`${BASEURL}/rest/auth/register`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username, password})
    });
    return response.json();
  },

  async changePassword(currentPassword, newPassword, newPasswordConfirmation){
    const BASEURL = Utils.getBackendBaseURL();
    const response = await fetch(`${BASEURL}/rest/auth/change-password`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({password: currentPassword, new_password: newPassword, new_password_confirmation: newPasswordConfirmation})
    });
  
    return response.json();
  },
  getCurrentUser() {
    return localStorage.getItem('user');
  },
  storeCurrentUser(jwt){
    localStorage.setItem('user', jwt);
  },

  async getAuthHeader(){
    const isValid = await this.isJWTValid();
    if (!isValid){
      this.logout();
      return new Headers();
    }
    const jwt = this.getCurrentUser();
    
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${jwt}`);
    return headers;
  },

  logout(){
    localStorage.removeItem('user');
    window.location.assign("/");
    window.location.reload();
  },

  isLoggedIn(){
    return localStorage.getItem('user') !== null;
  },

  async isJWTValid(){
    const jwt = this.getCurrentUser();
    if (jwt){
      try {
        const jwtbody = jwt.split('.')[1];
        const payload = JSON.parse(atob(jwtbody));
        const unvalidDate = payload.exp * 1000;
        const now = new Date();
        const BASEURL = Utils.getBackendBaseURL();
        if (unvalidDate > now.getTime()){
          const headers = new Headers();
          headers.append('Authorization', `Bearer ${jwt}`);
          headers.append("Content-Type", "application/json");
          const response = await fetch(`${BASEURL}/rest/auth/profile`, {
            method: 'GET',
            headers
          });
          const data = await response.json();
          return !data.deleteAccount;
        }
      } catch(e) {
        return false;
      }
    }
    return false;
  },

  async getProfile(){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = await this.getAuthHeader();
    headers.append("Content-Type", "application/json");
    const response = await fetch(`${BASEURL}/rest/auth/profile`, {
      method: 'GET',
      headers
    });
    return response.json();
  },

  getUserInfo(){
    const jwt = this.getCurrentUser();
    const jwtArray = jwt.split(".");
    const userInfo = JSON.parse(atob(jwtArray[1]));
    return userInfo;
  }
}


export default UserAPI;
