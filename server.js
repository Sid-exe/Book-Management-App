
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();  




const app = express();
const port = 5000; 

app.use(express.json());

const cors = require('cors');
app.use(cors());



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.log('Failed to connect to MongoDB Atlas', err));


app.get('/', (req, res) => {
  res.send('Book Management App Backend');
});

const Book = require('./models/book');

// GET /books: Retrieving all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find(); 
    res.status(200).json(books); // 
  } catch (err) {
    console.error('Error retrieving books:', err);  
    res.status(500).json({ message: 'Error retrieving books' }); 
  }
});

app.post('/add', async (req, res) => {
  const { title, author, publishYear, price, genre } = req.body;

  if (!title || !author || !publishYear || !price) {
    return res.status(400).json({ message: 'All fields (title, author, publishYear, price) are required' });
  }

  try {
   
    const existingBook = await Book.findOne({ title, author });

    if (existingBook) {
      return res.status(400).json({ message: 'A book with the same title and author already exists' });
    }

    
    const newBook = new Book({ title, author, publishYear, price, genre });
    await newBook.save();
    res.status(201).json({ message: 'Book added successfully', book: newBook });
  } catch (err) {
    // Check for validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: `Validation error: ${messages.join(', ')}` });
    }
    console.error('Error adding book:', err);
    res.status(500).json({ message: 'Error adding book' });
  }
});


// GET /books/:id: Retrieving details of a specific book by its ID
app.get('/books/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const book = await Book.findById(id);

      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
  
      res.status(200).json(book);
    } catch (err) {
      if (err.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid book ID format' });
      }
      res.status(500).json({ message: 'Error retrieving book details' });
    }
  });

// PUT /books/:id/update: Updating a book's details by ID
app.put('/books/:id/update', async (req, res) => {
  const bookId = req.params.id; // Get the book ID from URL params
  const { title, author, publishYear, price, genre } = req.body; // Get the data from request body

  try {
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Validation checks
    if (title) {
      if (typeof title !== 'string' || title.trim() === '' || !isNaN(title)) {
        return res.status(400).json({ message: 'Title must be a non-empty string and cannot be a number' });
      }
      book.title = title;
    }

    if (author) {
      if (typeof author !== 'string' || author.trim() === '' || !isNaN(author)) {
        return res.status(400).json({ message: 'Author must be a non-empty string and cannot be a number' });
      }
      book.author = author;
    }

    if (publishYear) {
      if (typeof publishYear !== 'number' || publishYear <= 0 || !Number.isInteger(publishYear)) {
        return res.status(400).json({ message: 'Publish year must be a positive integer' });
      }
      book.publishYear = publishYear;
    }

    if (price) {
      if (typeof price !== 'number' || price <= 0 || isNaN(price)) {
        return res.status(400).json({ message: 'Price must be a positive number' });
      }
      book.price = price;
    }

    if (genre) {
      if (typeof genre !== 'string' || genre.trim() === '') {
        return res.status(400).json({ message: 'Genre must be a non-empty string if provided' });
      }
      book.genre = genre;
    }

    const updatedBook = await book.save();

    res.status(200).json({ message: 'Book updated successfully', book: updatedBook });

  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ message: 'Error updating book' });
  }
});
  
  
// DELETE /books/:id/delete: Deleting a specific book by its ID
app.delete('/books/:id/delete', async (req, res) => {
    const { id } = req.params;  // Extract book ID from the URL parameter
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });  // Return Invalid ID error if id not valid
    }
  
    try {
      const deletedBook = await Book.findByIdAndDelete(id);
  
      if (!deletedBook) {
        return res.status(404).json({ message: 'Book not found' });
      }
  

      res.status(200).json({ message: 'Book successfully deleted' });
    } catch (err) {
      console.error('Error deleting book:', err); 
      res.status(500).json({ message: 'Error deleting the book' }); 
    }
  });
    
// Starting the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
