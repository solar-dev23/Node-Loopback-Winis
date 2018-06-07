'use strict';

$('.href-row').css('cursor', 'pointer').click(function() {
  window.document.location = $(this).data('href');
});

$('#confirm-delete').on('show.bs.modal', function(e) {
  $(this).find('.btn-ok').attr('href', $(e.relatedTarget).data('href'));
});

$('#confirm-save').on('show.bs.modal', function(e) {
  console.log('SAVE');
});

$('#data').DataTable({
  'paging': true,
  'searching': true,
  'info': true,
  'scrollX': true,
  'order': [[7, 'desc']],
  'columnDefs': [
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
      targets: [5, 6],
      width: '3em',
    },
    {
      targets: 7,
      width: '5em',
    },
  ],
});
