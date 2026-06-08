import axios from 'axios';
// var axios = require('axios');
import qs from 'qs';
var data = qs.stringify({
    "token": "t8ux76qys3z07rho",
    "to": "+919980556593",
    "body": "WhatsApp API on UltraMsg.com works good"
});

var config = {
  method: 'post',
  url: 'https://api.ultramsg.com/instance179807/messages/chat',
  headers: {  
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});