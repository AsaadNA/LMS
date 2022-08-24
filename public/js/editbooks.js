//This function is for filtering the search input for the table
//Filter using every column

$(document).ready(function () {
  //Use this inside your document ready jQuery
  window.onbeforeunload = function () {
    window.location.reload(true);
  };
  var table = $("#myTable").DataTable({
    order: [],
    language: {
      searchPlaceholder: "Search here....",
    },
    dom: 'B<"clear">lfrtip',
    buttons: {
      dom: {
        button: {
          tag: "button",
          className: "btn btn-success btn-md",
        },
      },
      buttons: [
        {
          extend: "csv",
          exportOptions: {
            columns: [0, 1, 2, 3, 4, 5],
          },
        },
        {
          extend: "excel",
          exportOptions: {
            columns: [0, 1, 2, 3, 4, 5],
          },
        },
        {
          extend: "pdf",
          exportOptions: {
            columns: [0, 1, 2, 3, 4, 5],
          },
        },
        {
          extend: "print",
          exportOptions: {
            columns: [0, 1, 2, 3, 4, 5],
          },
        },
        {
          text: "Import CSV Data",
          action: function (e, dt, node, config) {
            $("#uploadModal").modal("show");
          },
        },
        {
          text: "Insert New Book",
          action: function (e, dt, node, config) {
            $("#addBookModal").modal("show");
          },
        },
      ],
    },
  });

  $("#viewSearchInput").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#viewTableBody tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
});

/* ******* EDIT BUTTON ********** */

//This function is for Save Changes in the Edit Modal
//This will send a put request to the backend to update the book

var oldISBN = "";
var totalAvailableStock = 0;
var availableStock = 0;

//Prevent stock lowering less then the issued stock
$("#bookStockInput").on("input", function () {
  issuedStock = totalAvailableStock - availableStock;
  if ($(this).val() <= 0) $(this).val(0);
  if ($(this).val() < issuedStock && issuedStock !== 0) {
    alert(issuedStock + " Books have been issued already");
    $(this).val(issuedStock);
  }
});

$("#saveEdit").click(function () {
  $("#saveEdit").addClass("disabled");
  $("body").addClass("loading");

  let title = $("#bookTitleInput").val();
  let isbn = $("#bookISBNInput").val();
  let stock = $("#bookStockInput").val();
  let author = $("#bookAuthorInput").val();
  let category = $("#bookCategorySelect").val();

  let dataObj = {
    title: title,
    isbn: isbn,
    stock,
    oldisbn: oldISBN,
    author: author,
    category: category,
  };

  let data = JSON.stringify(dataObj);
  const url = "http://localhost:4000/editbooks";
  let xhr = new XMLHttpRequest();

  xhr.open("PUT", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.send(data);

  xhr.onload = function () {
    if (xhr.status === 200) {
      $("#editModal").modal("hide");
      $("body").removeClass("loading");
      location.reload();
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
      $("body").removeClass("loading");
      $("#saveEdit").removeClass("disabled");
    }
  };
});

function onEditClick(data) {
  $("#editModal").modal("show");
  $("#editModalTitle").text("Editing Book '" + data["title"] + "'");
  $("#bookTitleInput").val(data["title"]);
  $("#bookISBNInput").val(data["isbn"]);
  $("#bookStockInput").val(data["stock"]);
  $("#bookAuthorInput").val(data["author"]);
  $("#bookCategorySelect").val(data["category"]);

  //Here we save the oldISBN just in case an ISBN needs to be updated
  oldISBN = $("#bookISBNInput").val();
  availableStock = data["availableStock"];
  totalAvailableStock = data["stock"];
}

/* ******* ISSUE BUTTON ********** */

//This function is for Issuing Books in the Issue Modal
//This will send a put request to the backend to issue the book

let issueISBN = ""; //Pass isbn to modal
$("#issueForm").submit(function (e) {
  $("body").addClass("loading");
  $("#issueConfirm").addClass("disabled");
  e.preventDefault();
  let fullName = $("#issueFullNameInput").val();
  let email = $("#issueEmailInput").val();
  let employeeCode = $("#issueEmployeeCodeInput").val();
  let employeeExtension = $("#issueExtensionInput").val();

  let dataObj = {
    isbn: issueISBN,
    fullName: fullName,
    email: email,
    employeeCode: employeeCode,
    employeeExtension: employeeExtension,
  };

  let data = JSON.stringify(dataObj);
  const url = "http://localhost:4000/editbooks/issue";
  let xhr = new XMLHttpRequest();

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.send(data);

  xhr.onload = function () {
    if (xhr.status === 200) {
      $("#issueModal").modal("hide");
      $("body").removeClass("loading");
      location.reload();
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
      $("body").removeClass("loading");
      $("#issueConfirm").removeClass("disabled");
    }
  };
});

function onIssueClick(data) {
  $("#issueModal").modal("show");
  $("#issueModalTitle").text("Issuing Book '" + data["title"] + "'");

  issueISBN = data["isbn"]; //Pass isbn to modal
}

/* ******* ADD NEW BOOK BUTTON ********** */

$("#addButton").click(function () {
  $("#addBookModal").modal("show");
});

$("#insertBook").click(function () {
  $("body").addClass("loading");
  $("#insertBook").addClass("disabled");

  let title = $("#bookTitleInput_add").val();
  let isbn = $("#bookISBNInput_add").val();
  let stock = $("#bookStockInput_add").val();
  let author = $("#bookAuthorInput_add").val();
  let category = $("#bookCategorySelect_add").val();

  let dataObj = {
    title: title,
    isbn: isbn,
    stock,
    author: author,
    category: category,
  };

  let data = JSON.stringify(dataObj);
  const url = "http://localhost:4000/editbooks";
  let xhr = new XMLHttpRequest();

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.send(data);

  xhr.onload = function () {
    if (xhr.status === 200) {
      $("#addBookModal").modal("hide");
      $("body").removeClass("loading");

      location.reload();
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
      $("#insertBook").removeClass("disabled");
      $("body").removeClass("loading");
    }
  };
});

/* ******* DELETE  BUTTON ********** */

let deleteISBN = "";
function onDeleteClick(isbn) {
  $("#confirm-delete").modal("show");
  deleteISBN = isbn;
}

$("#confirmDelete").click(function () {
  $("body").addClass("loading");
  $("#deleteButton").addClass("disabled");

  let dataObj = {
    isbn: deleteISBN,
  };

  let data = JSON.stringify(dataObj);
  const url = "http://localhost:4000/editbooks";
  let xhr = new XMLHttpRequest();

  xhr.open("DELETE", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.send(data);

  xhr.onload = function () {
    if (xhr.status === 200) {
      location.reload();
      $("body").removeClass("loading");
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
      $("body").removeClass("loading");
      $("#deleteButton").removeClass("disabled");
    }
  };
});

/* ******* RETURN BUTTON ********** */

let returnISBN = "";
$("#returnForm").submit(function (e) {
  $("body").addClass("loading");
  $("#returnConfirm").addClass("disabled");
  e.preventDefault();
  employeeCode = $("#returnEmployeeCodeInput").val();

  let dataObj = {
    isbn: returnISBN,
    employeeCode: employeeCode,
  };

  let data = JSON.stringify(dataObj);
  const url = "http://localhost:4000/editbooks/return";
  let xhr = new XMLHttpRequest();

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.send(data);

  xhr.onload = function () {
    if (xhr.status === 200) {
      $("body").removeClass("loading");
      location.reload();
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
      $("body").removeClass("loading");
      $("#returnConfirm").removeClass("disabled");
    }
  };
});

function onReturnClick(isbn) {
  $("#returnModal").modal("show");
  returnISBN = isbn;
}

//Change to show issue history on click
function onTableRowClick(isbn, title) {
  window.location = "/view/" + isbn + "/" + title;
}
