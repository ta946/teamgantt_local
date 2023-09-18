function create_groups(project_data) {
  let group_ids = project_data['groups'];
  let html = `
    <div id="groups" class="groups accordion container-lg hide-not-for-user hide-completed">
    </div>
  `;
  let groups = parse_html(html);

  for (let group_id of group_ids) {
    let is_new_item = check_new_item(group_id);
    let [group, percent] = create_group(project_data, group_id, is_new_item);
    groups.append(group);
  }
  return groups;
}

function create_group(
  project_data,
  group_id,
  is_new_item_child,
  type = 'group'
) {
  let group_data = project_data['items'][group_id];
  let group_name = group_data['name'];
  let wbs = group_data['wbs'];
  let comments_data = group_data['comments'];
  let [comments, toggle_comments_class] = create_comments(comments_data);

  let is_new_item = !!is_new_item_child ? true : check_new_item(group_id);
  let [items, percent, num_subgroups] = create_children(
    project_data,
    group_data,
    is_new_item
  );
  let group = create_accordion(
    group_id,
    group_name,
    type,
    wbs,
    percent,
    comments,
    toggle_comments_class,
    is_new_item
  );
  let accordion_body = group.find('.group-body');
  for (let item of items) {
    accordion_body.append(item);
  }
  if (num_subgroups === 0) {
    group
      .children('.group-header')
      .children('.collapse-current, .expand-current')
      .addClass('disabled text-body-tertiary');
  }
  return [group, percent];
}

function create_children(project_data, item_data, is_new_item_child) {
  let items = [];
  let percents = [];
  let num_subgroups = 0;
  for (let element of item_data['children']) {
    let item_id = element['id'];
    let item_type = element['type'];
    let res;
    let item;
    let percent;
    switch (item_type) {
      case 'subgroup':
        num_subgroups++;
        res = create_group(
          project_data,
          item_id,
          is_new_item_child,
          'subgroup'
        );
        break;
      case 'task':
        res = create_task(project_data, item_id, is_new_item_child);
        break;
    }
    [item, percent] = res;
    items.push(item);
    percents.push(percent);
  }
  const percent_total = parseInt(average(percents));
  return [items, percent_total, num_subgroups];
}

function create_accordion(
  id,
  name,
  type,
  wbs,
  percent,
  comments,
  toggle_comments_class,
  is_new_item
) {
  let font_size = 'fs-6';
  let padding = '';
  if (type == 'group') {
    font_size = 'fs-5';
    padding = 'p-1';
  }
  let [completed_class, text_class] = get_completed(percent);
  let comments_count_text = comments.length > 0 ? comments.length : '';
  let new_item_class = !!is_new_item ? 'new-item' : '';

  let html = `
    <div id="${id}" class="${type} ${completed_class} ${new_item_class} accordion-item" data-id="${id}">
      <div class="${type}-header group-header accordion-button d-flex flex-row ${padding} ${font_size}">
        <button class="toggle-comment btn btn-sm btn-outline-info border-0 ${toggle_comments_class} position-relative" type="button">
          <i class="fa-regular fa-comment"></i>
          <div class="comment-count">
            ${comments_count_text}
          </div>
        </button>
        <div class="wbs px-1 text-muted">
          <small>${wbs}</small>
        </div>
        <div class="${type}-name flex-grow-1 px-1">
          ${name}
        </div>
        <button class="collapse-current btn btn-sm btn-outline-info border-0" type="button">
          <i class="fa-solid fa-compress"></i>
        </button>
        <button class="expand-current btn btn-sm btn-outline-info border-0" type="button">
          <i class="fa-solid fa-expand"></i>
        </button>
        <div class="${type}-percent px-1">
          ${percent} <i class="fa-regular fa-percent fa-sm text-body-tertiary"></i>
        </div>
      </div>

      <div id="collapse_${id}" class="${type}-body group-body accordion-body">
        <div id="comments_${id}" class="comments ${type}-comments hide-comments ms-3 ${font_size}">
        </div>
      </div>
    </div>
  `;
  let accordion = parse_html(html);
  let $comments = accordion.find(`.${type}-comments`);
  for (let comment of comments) {
    $comments.append(comment);
  }
  accordion.children('.group-header').on('click', function () {
    $this = $(this);
    $this.toggleClass('collapsed');
    item_id = $this.parent().attr('data-id');
    if ($this.hasClass('collapsed')) {
      storage_collapsed_add(item_id);
    } else {
      storage_collapsed_remove(item_id);
    }
  });
  accordion
    .find('.toggle-comment')
    .first()
    .on('click', function (evt) {
      evt.stopPropagation();
      $comments = $(this)
        .parent()
        .siblings('.group-body')
        .children('.comments');
      $comments.toggleClass('hide-comments');
    });
  let $collapse_current = accordion
    .children('.group-header')
    .children('.collapse-current');
  $collapse_current.on('click', function (evt) {
    evt.stopPropagation();
    let $accordion_item = $(this).closest('.accordion-item');
    toggle_collapse_level($accordion_item, true);
  });
  let $expand_current = accordion
    .children('.group-header')
    .children('.expand-current');
  $expand_current.on('click', function (evt) {
    evt.stopPropagation();
    let $accordion_item = $(this).closest('.accordion-item');
    $accordion_item.children('.group-header').removeClass('collapsed');
    toggle_collapse_level($accordion_item, false);
  });
  return accordion;
}

function get_completed(percent) {
  let completed_class;
  let text_class;
  if (percent == 100) {
    completed_class = 'item-complete';
    text_class = 'text-info';
  } else {
    completed_class = 'item-incomplete';
    text_class = '';
  }
  return [completed_class, text_class];
}

function apply_completion_classes(id, percent) {
  let $item = $(`#${id}`);
  let $body = $item.children('.task-body');
  completed_class = 'item-complete';
  incompleted_class = 'item-incomplete';
  if (percent === 100) {
    $item.removeClass(incompleted_class);
    $item.addClass(completed_class);
    $body.addClass('text-info');
  } else {
    $item.addClass(incompleted_class);
    $item.removeClass(completed_class);
    $body.removeClass('text-info');
  }
}

function toggle_collapse_level(el, hide) {
  toggle = !!hide ? 'hide' : 'show';
  el_children = el.children('.group-body').find('.group-header');
  if (!!hide) {
    el_children.addClass('collapsed');
  } else {
    el_children.removeClass('collapsed');
  }
}

function storage_collapsed_add(id) {
  if (!is_watch_fav) return;
  data = localstorage_load();
  if (data['favourties']['collapsed'].includes(id)) return;
  data['favourties']['collapsed'].push(id);
  localstorage_save(data);
}

function storage_collapsed_remove(id) {
  if (!is_watch_fav) return;
  data = localstorage_load();
  let index = data['favourties']['collapsed'].indexOf(id);
  if (index === -1) return;
  data['favourties']['collapsed'].splice(index, 1);
  localstorage_save(data);
}
