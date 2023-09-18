function fetch_token() {
  auth_header = CLIENT_ID + ':' + CLIENT_SECRET;
  encoded_auth_header = btoa(auth_header);
  authorization = 'Basic ' + encoded_auth_header;

  body = new URLSearchParams({
    grant_type: 'password',
    username: EMAIL,
    password: PASS,
  }).toString();

  res = $.ajax({
    type: 'POST',
    url: TEAMGANTT_TOKEN_URL,
    async: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authorization,
    },
    data: body,
  });
  if (res.status != 200) {
    throw new Error('failed to fetch new token!');
  }
  TOKEN = res.responseJSON;
  console.log('TOKEN');
  console.log(TOKEN);
}

function check_token_expired() {
  expires_at = TOKEN['expires_at'];
  now = new Date().getTime() / 1000;
  ret = now < expires_at;
  return ret;
}
