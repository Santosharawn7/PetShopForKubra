import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ItemUploader from '../../components/ItemUploader'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock API config
vi.mock('../../config/api', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5000${endpoint}`
}))

describe('ItemUploader', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    axios.post.mockResolvedValue({ 
      data: { 
        message: 'Product uploaded successfully!',
        product: {
          id: 1,
          name: 'Test Product',
          price: 19.99,
          stock: 10
        }
      } 
    })
  })

  it('renders upload form correctly', () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('Add New Product')).toBeInTheDocument()
    expect(screen.getByText('Fill in the details below to add a new product to your inventory')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter product description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter price')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter stock quantity')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter image URL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter category')).toBeInTheDocument()
  })

  it('handles form input changes', () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const descriptionInput = screen.getByPlaceholderText('Enter product description')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')
    const imageInput = screen.getByPlaceholderText('Enter image URL')
    const categoryInput = screen.getByPlaceholderText('Enter category')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '10' } })
    fireEvent.change(imageInput, { target: { value: 'https://example.com/image.jpg' } })
    fireEvent.change(categoryInput, { target: { value: 'Toys' } })

    expect(nameInput.value).toBe('Test Product')
    expect(descriptionInput.value).toBe('Test Description')
    expect(priceInput.value).toBe('19.99')
    expect(stockInput.value).toBe('10')
    expect(imageInput.value).toBe('https://example.com/image.jpg')
    expect(categoryInput.value).toBe('Toys')
  })

  it('validates required fields', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()
    })
  })

  it('validates price format', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: 'invalid' } })
    fireEvent.change(stockInput, { target: { value: '10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid price')).toBeInTheDocument()
    })
  })

  it('validates stock format', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: 'invalid' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid stock quantity')).toBeInTheDocument()
    })
  })

  it('validates negative price', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '-10' } })
    fireEvent.change(stockInput, { target: { value: '10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument()
    })
  })

  it('validates negative stock', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '-10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Stock quantity must be 0 or greater')).toBeInTheDocument()
    })
  })

  it('submits form successfully with valid data', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const descriptionInput = screen.getByPlaceholderText('Enter product description')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')
    const imageInput = screen.getByPlaceholderText('Enter image URL')
    const categoryInput = screen.getByPlaceholderText('Enter category')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '10' } })
    fireEvent.change(imageInput, { target: { value: 'https://example.com/image.jpg' } })
    fireEvent.change(categoryInput, { target: { value: 'Toys' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/upload-item',
        {
          name: 'Test Product',
          description: 'Test Description',
          price: 19.99,
          stock: 10,
          image_url: 'https://example.com/image.jpg',
          category: 'Toys'
        }
      )
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles API errors gracefully', async () => {
    axios.post.mockRejectedValue(new Error('Upload failed'))
    
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to upload product. Please try again.')).toBeInTheDocument()
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    axios.post.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ 
        data: { 
          message: 'Product uploaded successfully!',
          product: { id: 1, name: 'Test Product' }
        } 
      }), 100)
    ))

    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    expect(screen.getByText('Adding Product...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('clears form after successful submission', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(nameInput.value).toBe('')
      expect(priceInput.value).toBe('')
      expect(stockInput.value).toBe('')
    })
  })

  it('handles decimal prices correctly', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '10' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/upload-item',
        expect.objectContaining({
          price: 19.99
        })
      )
    })
  })

  it('handles zero stock correctly', async () => {
    render(
      <ItemUploader
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter product name')
    const priceInput = screen.getByPlaceholderText('Enter price')
    const stockInput = screen.getByPlaceholderText('Enter stock quantity')

    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(priceInput, { target: { value: '19.99' } })
    fireEvent.change(stockInput, { target: { value: '0' } })

    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/upload-item',
        expect.objectContaining({
          stock: 0
        })
      )
    })
  })
})



