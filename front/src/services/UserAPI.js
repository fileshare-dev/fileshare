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

  getAuthHeader(){
    if (!this.isJWTValid()){
      this.logout();
    }
    const jwt = this.getCurrentUser();
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${jwt}`);
    return headers;
  },

  logout(){
    localStorage.removeItem('user');
    window.location.assign("/");
  },

  isLoggedIn(){
    return localStorage.getItem('user') !== null;
  },
  isJWTValid(){
    const jwt = this.getCurrentUser();
    if (jwt){
      const jwtbody = jwt.split('.')[1];
      const payload = JSON.parse(atob(jwtbody));
      const unvalidDate = payload.exp * 1000;
      const now = new Date();
      return (unvalidDate > now.getTime());
    }
    return false;
  },

  async getProfile(){
    const BASEURL = Utils.getBackendBaseURL();
    const headers = this.getAuthHeader();
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
