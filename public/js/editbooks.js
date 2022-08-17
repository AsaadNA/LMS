//This function is for filtering the search input for the table
//Filter using every column

$(document).ready(function () {
  $("#searchInput").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#tableBody tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
});

//Function for adding a new button

$("#addBookButton").click(function () {
  alert("Adding new book");
});

/* ******* EDIT BUTTON ********** */

//This function is for Save Changes in the Edit Modal
//This will send a put request to the backend to update the book

var oldISBN = "";

$("#saveEdit").click(function () {
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
  e.preventDefault();
  let fullName = $("#issueFullNameInput").val();
  let email = $("#issueEmailInput").val();

  let dataObj = {
    isbn: issueISBN,
    fullName: fullName,
    email: email,
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
    }
  };
});

function onIssueClick(data) {
  $("#issueModal").modal("show");
  $("#issueModalTitle").text("Issuing Book '" + data["title"] + "'");

  issueISBN = data["isbn"]; //Pass isbn to modal
}
