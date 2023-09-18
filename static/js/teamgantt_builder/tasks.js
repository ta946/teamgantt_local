function create_task(project_data, task_id, is_new_item_child) {
  let task_data = project_data['items'][task_id];
  const wbs = task_data['wbs'];
  const task_name = task_data['name'];
  const start_date = task_data['start_date'];
  const percent = task_data['percent_complete'];
  let [completed_class, text_class] = get_completed(percent);
  let [task_for_user_class, task_resource] = get_task_for_user(
    task_data,
    USER_ID,
    text_class
  );
  let comments_data = task_data['comments'];
  let [comments, toggle_comments_class] = create_comments(comments_data);
  let comments_count_text = comments.length > 0 ? comments.length : '';
  let is_new_item = !!is_new_item_child ? true : check_new_item(task_id);
  let new_item_class = !!is_new_item ? 'new-item' : '';

  let html = `
    <div id="${task_id}" class="task ${completed_class} ${task_for_user_class} ${new_item_class} border" data-id="${task_id}">
      <div class="task-body ${text_class} d-flex flex-row border fs-7">
        <button class="toggle-comment btn btn-sm btn-outline-info px-1 border-0 fs-7 ${toggle_comments_class} position-relative" type="button">
          <i class="fa-regular fa-comment"></i>
          <div class="comment-count">
            ${comments_count_text}
          </div>
        </button>
        <div class="wbs px-1 text-muted">
          <small>${wbs}</small>
        </div>
        <div class="task-name px-1 flex-grow-1">
          ${task_name}
        </div>
        ${task_resource}
        <div class="task-date px-2">
          ${start_date}
        </div>
        <div class="task-percent px-1">
          <input type="text" value="${percent}" maxlength="3" class="input-percent text-body text-center" data-id="${task_id}"> <i class="fa-regular fa-percent fa-sm text-body-tertiary"></i>
        </div>
        <button class="btn btn-outline-secondary task-edit px-1 ms-1 fs-7 border-0">
          <i class="fa-regular fa-edit fa-sm text-body-tertiary"></i>
        </button>
      </div>
      <div id="comments_${task_id}" class="comments task-comments hide-comments ms-3">
      </div>
    </div>
  `;
  // ${percent} <i class="fa-regular fa-percent fa-sm text-body-tertiary"></i>
  let task = parse_html(html);
  let $comments = task.find(`.task-comments`);
  for (let comment of comments) {
    $comments.append(comment);
  }
  bind_percent_input(task.find('.input-percent'));
  task
    .find('.toggle-comment')
    .first()
    .on('click', function () {
      let $comments = $(this).parent().siblings('.comments');
      $comments.toggleClass('hide-comments');
    });
  task
    .find('.task-edit')
    .first()
    .on('click', function () {
      let $task = $(this).closest('.task');
      let task_id = $task.attr('data-id');
      window.open(
        `https://app.teamgantt.com/my-tasks/gantt/edit/${task_id}`,
        '_blank'
      );
    });
  return [task, percent];
}

function get_task_for_user(task_data, user_id, text_class) {
  let task_for_user_class;
  let task_resource;
  let is_task_for_user = false;
  let resources = task_data['resources'];
  for (let resource of resources) {
    if (user_id == resource['type_id']) {
      is_task_for_user = true;
    }
  }
  if (is_task_for_user) {
    task_for_user_class = 'task-for-user';
    task_resource = `
      <div class="task-resource ${text_class} px-1">
        <i class="fa-solid fa-user fa-sm"></i>
      </div>
    `;
  } else {
    task_for_user_class = 'task-not-for-user';
    task_resource = '';
  }
  return [task_for_user_class, task_resource];
}

function bind_percent_input(el) {
  el.on('focus', function () {
    id = $(this).attr('data-id');
    value_current = $(this).val();
    // console.log('id ' + id);
    // console.log('value_current ' + value_current);
    $(this).on('keydown', function (e) {
      $this = $(this);
      if (e.type === 'keydown') {
        if (e.key == 'Escape' || e.key == 'Esc') {
          $this.val(value_current);
          $this.blur();
        } else if (e.key == 'Enter') {
          $this.blur();
        }
      }
    });
    $(this).one('focusout', function (e) {
      $this = $(this);
      $this.unbind('keydown');
      let value_new_str = $this.val();
      let value_new = Number(value_new_str);
      if (
        value_new_str == '' ||
        !Number.isInteger(value_new) ||
        value_new < 0 ||
        value_new > 100
      ) {
        $this.val(value_current);
        return;
      }
      if (value_new == value_current) {
        return;
      }
      try {
        update_task(id, value_new);
        if (value_new === 100) hide_empty_groups();
      } catch (error) {
        console.log(error);
        $this.val(value_current);
        return;
      }
      // console.log('value_new ' + value_new);
      // console.log('value_diff ' + (value_new - value_current));
    });
  });
}

function update_task(task_id, percent) {
  const url = `https://api.teamgantt.com/v1/tasks/${task_id}`;
  let body = {
    percent_complete: percent,
  };
  ajax('PATCH', url, body);

  DATA['projects'][project_id]['items'][task_id]['percent_complete'] = percent;
  toggle_save(true);

  apply_completion_classes(task_id, percent);
  text = `task ${task_id} updated!`;
  console.log(text);
  flash(text, { type: 'success' });
}
