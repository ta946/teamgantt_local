function parse_html(html) {
  var div = $($.parseHTML($.trim(html)));
  return div;
}
