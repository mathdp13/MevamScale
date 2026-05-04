const { OAuth2Client } = require('google-auth-library');

class GoogleAuthProvider {
  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verificar(token) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub } = ticket.getPayload();
    return { email, name, sub };
  }
}

module.exports = new GoogleAuthProvider();
