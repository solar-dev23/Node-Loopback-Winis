'use strict';

$('.href-row').css('cursor', 'pointer').click(function() {
  window.document.location = $(this).data('href');
});

$('.latest-table').DataTable({
  paging: false,
  info: false,
  autoWidth: true,
  ordering: false,
  searching: false,
  columnDefs: [
    {
      targets: 0,
      render: $.fn.dataTable.render.ellipsis(10, true),
    },
    {
      targets: 1,
      width: '40%',
    },
  ],
});
