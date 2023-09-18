function create_comments(comments_data) {
  let comments = [];
  for (let comment_id in comments_data) {
    let comment_data = comments_data[comment_id];
    let comment = create_comment(comment_data);
    comments.push(comment);
  }
  let toggle_comments_class;
  if (comments.length !== 0) {
    toggle_comments_class = 'text-body-info';
  } else {
    toggle_comments_class = 'text-body-tertiary disabled';
  }
  return [comments, toggle_comments_class];
}

function create_comment(comment_data) {
  const comment_id = comment_data['id'];
  const user = comment_data['added_by']['first_name'];
  const added_date = comment_data['added_date'];
  let time = new Date(added_date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  let date = `${added_date.split('T')[0]} ${time}`;
  let message = comment_data['message'];
  let documents_data = comment_data['attached_documents'];
  let message_list = message.split('\n');
  let message_html = '';
  for (let msg of message_list) {
    let msg_html;
    if (msg.startsWith('![') && msg.endsWith(')')) {
      let url = msg.slice(msg.indexOf('(') + 1, msg.length - 1);
      msg_html = `<img src=${url}>`;
    } else {
      msg_html = `<p>${msg}</p>\n`;
    }
    message_html += msg_html;
  }
  let documents = [];
  for (let document_data of documents_data) {
    let document = create_document(document_data);
    documents.push(document);
  }

  let html = `
    <div id="${comment_id}" class="comment px-2 text-success-emphasis border fs-7" data-id="${comment_id}">
      <div class="comment-header d-flex flex-row text-body-tertiary">
        <div class="comment-date">
        ${date}
        </div>
        <div class="comment-user px-3">
          ${user}
        </div>
      </div>
      <div class="comment-body fs-7">
        ${message_html}
      </div>
      <div class="documents d-flex flex-column">
      </div>
    </div>
  `;
  let comment = parse_html(html);
  let $documents = comment.find('.documents');
  for (let document of documents) {
    $documents.append(document);
  }
  return comment;
}

function create_document(document_data) {
  let document_id = document_data['document_id'];
  let document_url = document_data['download_url'];
  let document_name = document_data['name'];

  let html = `
    <div class="document">
      <a id="${document_id}" class="text-warning-emphasis" href="${document_url}">
        ${document_name}
      </a>
    </div>
  `;
  var document = parse_html(html);
  return document;
}
