//This function is for filtering the search input for the table
//Filter using every column

$(document).ready(function () {
  $("#searchInput").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#tableBody tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
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

$("#saveEdit").click(function () {
  $("#saveEdit").addClass("disabled");

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
      location.reload();
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
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
}

/* ******* ISSUE BUTTON ********** */

//This function is for Issuing Books in the Issue Modal
//This will send a put request to the backend to issue the book

let issueISBN = ""; //Pass isbn to modal
$("#issueForm").submit(function (e) {
  $("#issueConfirm").addClass("disabled");
  e.preventDefault();
  let fullName = $("#issueFullNameInput").val();
  let email = $("#issueEmailInput").val();
  let employeeCode = $("#issueEmployeeCodeInput").val();

  let dataObj = {
    isbn: issueISBN,
    fullName: fullName,
    email: email,
    employeeCode: employeeCode,
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
      location.reload();
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
      $("#issueConfirm").deleteClass("disabled");
    }
  };
});

function onIssueClick(data) {
  $("#issueModal").modal("show");
  $("#issueModalTitle").text("Issuing Book '" + data["title"] + "'");

  issueISBN = data["isbn"]; //Pass isbn to modal
}

/* ******* VIEW BUTTON ********** */

//This will reset the table on hide
$("#viewModal").on("hidden.bs.modal", function () {
  $("#viewTable tbody").empty();
});

function onViewClick(isbn) {
  const url = "http://localhost:4000/editbooks/issueHistory/" + isbn;
  let xhr = new XMLHttpRequest();

  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.send();

  xhr.onload = function () {
    if (xhr.status === 200) {
      $("#viewModal").modal("show");
      obj = JSON.parse(xhr.responseText);

      //loop through each person and append to table
      obj["data"].forEach(function (d) {
        if (d.returnDate !== null) {
          $("#viewTable tbody").append(
            "<tr>" +
              "<td>" +
              d.byName +
              "</td>" +
              "<td>" +
              d.byEmail +
              "</td>" +
              "<td>" +
              d.toName +
              "</td>" +
              "<td>" +
              d.toEmail +
              "</td>" +
              "<td>" +
              d.toEmployeeCode +
              "</td>" +
              "<td>" +
              d.issueDate +
              "</td>" +
              "<td>" +
              d.returnDate +
              "</td>" +
              "</tr>"
          );
        } else {
          $("#viewTable tbody").append(
            "<tr>" +
              "<td>" +
              d.byName +
              "</td>" +
              "<td>" +
              d.byEmail +
              "</td>" +
              "<td>" +
              d.toName +
              "</td>" +
              "<td>" +
              d.toEmail +
              "</td>" +
              "<td>" +
              d.toEmployeeCode +
              "</td>" +
              "<td>" +
              d.issueDate +
              "</td>" +
              "<td>" +
              "Pending" +
              "</td>" +
              "</tr>"
          );
        }
      });
    } else if (xhr.status === 400) {
      alert(xhr.responseText);
    }
  };
}

/* ******* ADD NEW BOOK BUTTON ********** */

$("#addButton").click(function () {
  $("#addBookModal").modal("show");
});

$("#insertBook").click(function () {
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
      location.reload();
    } else if (xhr.status === 400) {
      $("#insertBook").removeClass("disabled");
      alert(xhr.responseText);
    }
  };
});

/* ******* DELETE  BUTTON ********** */

function onDeleteClick(isbn) {
  $("#deleteButton").addClass("disabled");

  let dataObj = {
    isbn,
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
    } else if (xhr.status === 400) {
      $("#deleteButton").removeClass("disabled");
      alert(xhr.responseText);
    }
  };
}

/* ******* RETURN BUTTON ********** */

let returnISBN = "";
$("#returnForm").submit(function (e) {
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
      location.reload();
    } else if (xhr.status === 400) {
      $("#returnConfirm").removeClass("disabled");
      alert(xhr.responseText);
    }
  };
});

function onReturnClick(isbn) {
  $("#returnModal").modal("show");
  returnISBN = isbn;
}
