var project_id = null;
var is_watch_fav = true;
let no_visible_children_class_name = 'no-visible-children';

function render_project_page(id_str) {
  render_loading();
  project_id = parseInt(id_str);
  let name_ = get_project_name(project_id);
  console.log('project: ' + project_id + ' ' + name_);

  let project = create_project(project_id);
  let content = $('#content');
  content.empty();
  content.append(project);

  hide_empty_groups();
  show_favourites();
}

function get_project_name(id) {
  let projects_map = DATA['projects_map'];
  let name_ = projects_map[id];
  return name_;
}

function create_project(project_id) {
  let project_data = DATA['projects'][project_id];
  console.log(project_data);
  let name_ = get_project_name(project_id);

  let html = `
    <div id="${project_id}" class="project" data-id="${project_id}">
    </div>
  `;
  let project = parse_html(html);

  let header = create_header(name_);
  let controls = create_controls();
  let groups = create_groups(project_data);

  project.append(header);
  project.append(controls);
  project.append(groups);
  return project;
}

function create_header(name_) {
  let html = `
    <div class="header d-flex gap-3">
      <div id="back" class="btn btn-secondary d-flex align-items-center">
        <i class="fa fa-chevron-left"></i>
      </div>
      <h1 class="project-name">
        ${name_}
      </h1>
    </div>
  `;
  var div = parse_html(html);

  div.find('#back').on('click', function () {
    render_projects_page();
  });
  return div;
}

function create_controls() {
  let html = `
    <div class="controls d-flex sticky-top">
      <button id="save_data" class="btn text-body-tertiary disabled" type="button">
        save
      </button>

      <button id="expand_groups" class="btn btn-outline-success hide" type="button">
        expand groups
      </button>
      <button id="collapse_groups" class="btn btn-outline-danger" type="button">
        collapse groups
      </button>

      <button id="show_comments" class="btn btn-outline-success" type="button">
        show comments
      </button>
      <button id="hide_comments" class="btn btn-outline-danger hide" type="button">
        hide comments
      </button>

      <button id="show_nonuser" class="btn btn-outline-success" type="button">
        show nonuser
      </button>
      <button id="hide_nonuser" class="btn btn-outline-danger hide" type="button">
        hide nonuser
      </button>

      <button id="show_completed" class="btn btn-outline-success" type="button">
        show completed
      </button>
      <button id="hide_completed" class="btn btn-outline-danger hide" type="button">
        hide completed
      </button>

      <button id="show_old" class="btn btn-outline-success hide" type="button">
        show old
      </button>
      <button id="hide_old" class="btn btn-outline-danger" type="button">
        hide old
      </button>

      <button id="unwatch_fav" class="btn btn-outline-success" type="button">
        unwatch fav
      </button>
      <button id="watch_fav" class="btn btn-outline-danger hide" type="button">
        watch fav
      </button>
      
      <button id="favourites" class="btn btn-outline-info" type="button">
        favourites
      </button>
      
      <button id="collapsed_completed" class="btn btn-outline-info" type="button">
        collapsed completed
      </button>
    </div>
  `;
  var controls = parse_html(html);

  controls.find('#save_data').on('click', save_data);

  controls.find('#expand_groups').on('click', function () {
    $('.group-header').removeClass('collapsed');
    $('#expand_groups').addClass('hide');
    $('#collapse_groups').removeClass('hide');
  });
  controls.find('#collapse_groups').on('click', function () {
    $('.group-header').addClass('collapsed');
    $('#expand_groups').removeClass('hide');
    $('#collapse_groups').addClass('hide');
  });

  controls.find('#show_comments').on('click', function () {
    $('.comments').removeClass('hide-comments');
    $('#show_comments').addClass('hide');
    $('#hide_comments').removeClass('hide');
  });
  controls.find('#hide_comments').on('click', function () {
    $('.comments').addClass('hide-comments');
    $('#show_comments').removeClass('hide');
    $('#hide_comments').addClass('hide');
  });

  controls.find('#show_nonuser').on('click', show_nonuser);
  controls.find('#hide_nonuser').on('click', hide_nonuser);

  controls.find('#show_completed').on('click', show_completed);
  controls.find('#hide_completed').on('click', hide_completed);

  controls.find('#show_old').on('click', function () {
    show_empty_groups();
    $('.groups').removeClass('hide-old');
    $('#show_old').addClass('hide');
    $('#hide_old').removeClass('hide');
    hide_empty_groups();
  });
  controls.find('#hide_old').on('click', function () {
    $('.groups').addClass('hide-old');
    $('#show_old').removeClass('hide');
    $('#hide_old').addClass('hide');
    hide_empty_groups();
  });

  controls.find('#unwatch_fav').on('click', function () {
    is_watch_fav = false;
    $('#unwatch_fav').addClass('hide');
    $('#watch_fav').removeClass('hide');
  });
  controls.find('#watch_fav').on('click', function () {
    is_watch_fav = true;
    $('#unwatch_fav').removeClass('hide');
    $('#watch_fav').addClass('hide');
  });

  controls.find('#favourites').on('click', function () {
    // show_empty_groups();
    $('div.group-header.collapsed').removeClass('collapsed');
    show_favourites();
    // hide_empty_groups();
  });

  controls.find('#collapsed_completed').on('click', collapsed_completed);
  return controls;
}

function check_new_item(task_id) {
  let is_new_item = DATA['projects'][project_id]['new_items'].includes(task_id);
  return is_new_item;
}

function check_empty_group(element) {
  $el = $(element);
  let children = $el.children('.group-body').find('.task');
  if ($('.groups').hasClass('hide-not-for-user'))
    children = $(children).not('.task-not-for-user');
  if ($('.groups').hasClass('hide-completed'))
    children = $(children).not('.item-complete');
  if ($('.groups').hasClass('hide-old'))
    children = $(children).filter('.new-item');
  return children.length === 0;
}

function hide_empty_groups() {
  $('.accordion-item').each(function (index, element) {
    if (check_empty_group(element))
      $(element).addClass(no_visible_children_class_name);
  });
}

function show_empty_groups() {
  $(`.${no_visible_children_class_name}`).each(function (index, element) {
    $(element).removeClass(no_visible_children_class_name);
  });
}

function toggle_save(toggle) {
  let $save = $('#save_data');
  if (!!toggle) {
    ISUNSAVED = true;
    $save.removeClass('disabled text-body-tertiary');
    $save.addClass(' btn-outline-info');
  } else {
    ISUNSAVED = false;
    $save.addClass('disabled text-body-tertiary');
    $save.removeClass('btn-outline-info');
  }
}

function show_nonuser() {
  show_empty_groups();
  $('.groups').removeClass('hide-not-for-user');
  $('#show_nonuser').addClass('hide');
  $('#hide_nonuser').removeClass('hide');
  hide_empty_groups();
}
function hide_nonuser() {
  $('.groups').addClass('hide-not-for-user');
  $('#show_nonuser').removeClass('hide');
  $('#hide_nonuser').addClass('hide');
  hide_empty_groups();
}

function show_completed() {
  show_empty_groups();
  $('.groups').removeClass('hide-completed');
  $('#show_completed').addClass('hide');
  $('#hide_completed').removeClass('hide');
  hide_empty_groups();
}
function hide_completed() {
  $('.groups').addClass('hide-completed');
  $('#show_completed').removeClass('hide');
  $('#hide_completed').addClass('hide');
  hide_empty_groups();
}

function show_favourites() {
  data = localstorage_load();
  not_found = [];
  data['favourties']['collapsed'].forEach(function (id) {
    item = $('div').find(`[data-id='${id}']`);
    if (item.length === 0) {
      not_found.push(id);
      return;
    }
    item.children('.group-header').addClass('collapsed');
    if (not_found.length !== 0) {
      for (let id of not_found) {
        let index = data['favourties']['collapsed'].indexOf(id);
        data['favourties']['collapsed'].splice(index, 1);
      }
      localstorage_save(data);
    }
  });
}

function collapsed_completed() {
  show_nonuser();
  show_completed();
  $('div.group-header.collapsed').removeClass('collapsed');
  $('.accordion-item.item-complete > .group-header').addClass('collapsed');
}
