function render_projects_page() {
  render_loading();
  let projects_map = DATA['projects_map'];

  let container = create_project_container();
  for (let project_id in projects_map) {
    let name_ = projects_map[project_id];
    let div = create_project_li(project_id, name_);
    container.find('.projects').append(div);
  }
  let content = $('#content');
  content.empty();
  content.append(container);
}

function create_project_container() {
  let html = `
    <div id="container" class="container mt-5">
      <div class="project-header">
        <h1>Projects</h1>
      </div>
      <div class="projects d-flex flex-column gap-3">
      </div>
    </div>
`;
  let div = parse_html(html);
  return div;
}

function create_project_li(project_id, name_) {
  let html = `
    <a id="${project_id}" class="project btn btn-secondary" data-id="${project_id}" href="?project_id=${project_id}">
      <div class="project-content col">
        <div class="project-name">
          ${name_}
        </div>
      </div>
    </a>
  `;
  let div = parse_html(html);
  return div;
}
