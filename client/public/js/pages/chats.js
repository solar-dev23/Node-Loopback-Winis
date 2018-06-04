$(".href-row").css('cursor', 'pointer').click(function() {
  window.document.location = $(this).data("href");
});

$('#data').DataTable({
  "paging": true,
  "searching": true,
  "info": true,
  "scrollX": true,
  "order": [[ 5, "desc" ]],
  columnDefs: [
    {
      targets: 0,
      width: '5em',
      render: $.fn.dataTable.render.ellipsis( 10, true )
    },
    {
      targets: 1,
      width: '5em'
    },
    {
      targets: 3,
      width: '10em'
    },
    {
      targets: 4,
      width: '10em'
    },
    {
      targets: 5,
      width: '5em'
    }
  ]
});
