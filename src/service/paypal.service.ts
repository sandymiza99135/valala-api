// paypal.helper.ts
import axios from "axios";

export class PaypalHelper {
    static async getAccessToken() {
        console.log("authentification get ");
        
        const response = await axios({
            url: `https://api-m.sandbox.paypal.com/v1/oauth2/token`,
            method: "post",
            data: "grant_type=client_credentials",
            auth: {
                username: process.env.PAYPAL_CLIENT_ID || "",
                password: process.env.PAYPAL_CLIENT_SECRET || ""
            }
        });
        console.log("response : ",response);
        

        return response.data.access_token;
    }
}
