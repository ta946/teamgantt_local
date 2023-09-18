var ISUNSAVED = false;

function main() {
  console.log(TOKEN);
  console.log(DATA);
  window.onbeforeunload = confirm_exit;

  init_localstorage();

  render_projects_page();
  // render_project_page(Object.keys(DATA['projects_map'])[0]);

  // fetch_token();
  // fetch_comment();

  // flash('Default Flash Message', {
  //   'type': 'info',
  //   'duration' : 4000
  // });
}

function confirm_exit() {
  if (ISUNSAVED) return true;
}

function render_loading() {
  let html = `
  <div class='spinner-border' role='status' style='position: fixed; top: 50%; left: 50%;'>
    <span class='visually-hidden'>Loading...</span>
  </div>
  `;
  let div = parse_html(html);
  content = $('#content');
  content.empty();
  content.append(div);
}

function ajax(method, url, body, info) {
  if (!check_token_expired()) fetch_token();
  let authorization = 'Bearer ' + TOKEN['access_token'];
  data = body === undefined ? undefined : JSON.stringify(body);
  let res = $.ajax({
    type: method,
    url: url,
    data: data,
    async: false,
    headers: {
      Authorization: authorization,
    },
  });
  if (res.status != 200) {
    error = 'request failed!';
    if (info !== undefined) {
      error = `${error}\n${info}`;
    }
    console.log(error);
    flash(error, { type: 'danger' });
    throw new Error(error);
  }
  let result = res.responseJSON;
  return result;
}

function fetch_comment() {
  let target_type = 'tasks';
  let comment_id = 134889579;
  let url = TEAMGANTT_API_URL + target_type + '/' + comment_id + '/comments';
  let result = ajax('GET', url);
  console.log(result);
}

function average(array) {
  const sum = array.reduce((a, b) => a + b, 0);
  const avg = sum / array.length || 0;
  return avg;
}

function init_localstorage() {
  if (localStorage.teamgantt === undefined) {
    data = {
      favourties: {
        collapsed: [],
      },
    };
    localstorage_save(data);
  }
}
function localstorage_save(data) {
  localStorage.teamgantt = JSON.stringify(data);
}
function localstorage_load() {
  data = JSON.parse(localStorage.teamgantt);
  return data;
}
function localstorage_delete() {
  localStorage.removeItem('teamgantt');
}

async function save_data() {
  if (!ISUNSAVED) {
    flash('No changes to save!', { type: 'warning' });
    return;
  }

  try {
    text = `DATA = ${JSON.stringify(DATA)}`;
    let data_blob = new Blob([text], { type: 'text/plain' });

    const handle = await showSaveFilePicker({
      id: 'data',
      startIn: 'desktop',
      suggestedName: 'data.js',
      types: [
        {
          description: 'js file',
          accept: { 'text/javascript': ['.js'] },
        },
      ],
    });
    const writableStream = await handle.createWritable();
    await writableStream.write(data_blob);
    await writableStream.close();

    toggle_save(false);
    console.log('data file saved!');
  } catch (error) {
    console.log(error);
    flash('Error saving data!', { type: 'danger' });
  }
}
