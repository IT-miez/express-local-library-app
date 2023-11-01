const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

const asyncHandler = require("express-async-handler");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});


// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").exec();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display Bookinstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [bookinstance, allBooksByBookinstance] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find({ bookinstance: req.params.id }, "title summary").exec(),
  ]);

  if (bookinstance === null) {
    // No results.
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete bookinstance",
    bookinstance: bookinstance,
    bookinstance_books: allBooksByBookinstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
    res.redirect("/catalog/bookinstances");

});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  // Get genres for form.
  const [bookinstance, book_list] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find({}, "title").exec()
  ]);

  if (bookinstance === null) {
    // No results.
    const err = new Error("Bookinstance not found");
    err.status = 404;
    return next(err);
  }
  console.log(bookinstance)

  res.render("bookinstance_form", {
    title: "Update Bookinstance",
    bookinstance: bookinstance,
    book_list: book_list
  });
});



// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  (req, res, next) => {

  body("imprint", "Imprint must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape()
    next()
  },
  
  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log(req.body)
    console.log("Annettu id kirjalle:")
    console.log(req.body.book._id)
    // Create a Genre object with escaped/trimmed data and old id.
    const bookinstance = new BookInstance({
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      book: req.body.book,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      res.render("genre_form", {
        name: "Update Genre",
        bookinstance: bookinstance,
        errors: errors.array(),
      });
      return;

    } else {
      // Data from form is valid. Update the record.
      console.log("TEST")
      const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
      console.log("UPDATED bookinstance")
      console.log(updatedBookInstance)
      // Redirect to book detail page.
      res.redirect(updatedBookInstance.url);
    }
  })
];
