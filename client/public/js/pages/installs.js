'use strict';

$('#data').DataTable({
  'paging': true,
  'searching': true,
  'info': true,
  'scrollX': true,
  'order': [[2, 'desc']],
  "columnDefs": [
    {
      targets: 0,
      width: '5em',
      render: $.fn.dataTable.render.ellipsis(10, true),
    },
    {
      targets: 1,
      width: '10em',
    },
    {
      targets: 2,
      width: '5em',
    },
    {
      targets: 4,
      width: '15em',
    },
    {
      targets: 5,
      width: '3em',
    },
  ],
});
