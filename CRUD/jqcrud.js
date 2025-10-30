const BASE = "https://fakestoreapi.com";

    function displayProducts() {
      $.ajax({
        url: BASE + "/products",
        method: "GET",
        dataType: "json",
        success: function (data) {
          const itemsList = $("#itemsList");
          itemsList.empty();

          $.each(data, function (i, prod) {
            itemsList.append(`
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">${prod.title}</h5>
                  <p class="card-text">${prod.description}</p>
                  <p><strong>Price:</strong> $${prod.price}</p>
                  <p><strong>Category:</strong> ${prod.category}</p>
                  <img src="${prod.image}" alt="image" style="max-width:100px;" />
                  <div class="mt-2">
                    <button class="btn btn-info btn-sm mr-2 btn-edit" data-id="${prod.id}">Edit</button>
                    <button class="btn btn-danger btn-sm btn-del" data-id="${prod.id}">Delete</button>
                  </div>
                </div>
              </div>
            `);
          });
        },
        error: function (err) {
          console.error("Error fetching products:", err);
        },
      });
    }

    function deleteProduct() {
  const id = $(this).data("id");
  $.ajax({
    url: BASE + "/products/" + id,
    method: "DELETE",
    success: function () {
      // remove from DOM immediately
      $(`button[data-id='${id}']`).closest(".card").remove();
    },
    error: function (err) {
      console.error("Error deleting:", err);
    },
  });
}


    function editBtnClicked() {
      const id = $(this).data("id");
      $.ajax({
        url: BASE + "/products/" + id,
        method: "GET",
        success: function (prod) {
          $("#clearBtn").show();
          $("#createTitle").val(prod.title);
          $("#createPrice").val(prod.price);
          $("#createDescription").val(prod.description);
          $("#createCategory").val(prod.category);
          $("#createImage").val(prod.image);
          $("#createBtn").text("Update").data("id", prod.id);
        },
        error: function (err) {
          console.error("Error fetching product:", err);
        },
      });
    }

    function handleFormSubmission(e) {
      e.preventDefault();
      const id = $("#createBtn").data("id");
      const payload = {
        title: $("#createTitle").val(),
        price: parseFloat($("#createPrice").val()),
        description: $("#createDescription").val(),
        image: $("#createImage").val(),
        category: $("#createCategory").val()
      };

      if (id) {
        // Update
        $.ajax({
          url: BASE + "/products/" + id,
          method: "PUT",
          data: JSON.stringify(payload),
          contentType: "application/json",
          success: function () {
            resetForm();
            displayProducts();
          },
          error: function (err) {
            console.error("Error updating:", err);
          },
        });
      } else {
        // Create
        $.ajax({
          url: BASE + "/products",
          method: "POST",
          data: JSON.stringify(payload),
          contentType: "application/json",
          success: function () {
            resetForm();
            displayProducts();
          },
          error: function (err) {
            console.error("Error creating:", err);
          },
        });
      }
    }

    function resetForm() {
      $("#clearBtn").hide();
      $("#createBtn").removeData("id").text("Create");
      $("#createForm")[0].reset();
    }

    $(document).ready(function () {
      displayProducts();
      
      $(document).on("click", ".btn-del", deleteProduct);
      $(document).on("click", ".btn-edit", editBtnClicked);
      $("#createForm").submit(handleFormSubmission);
      $("#clearBtn").click(function () {
        resetForm();
      });
    });