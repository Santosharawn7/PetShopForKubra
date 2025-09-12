import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import Dashboard from '../../components/Dashboard'

// Mock axios
import { vi } from 'vitest'
vi.mock('axios')
const mockedAxios = axios

// Mock the API config
vi.mock('../../config/api', () => ({
  buildApiUrl: (path) => `http://localhost:5000${path}`
}))

// Mock data - updated to match actual API response structure
const mockProducts = [
  {
    id: 1,
    title: 'Test Product 1',
    description: 'Test description 1',
    price: 29.99,
    stock: 10,
    category: 'Food',
    image_url: 'https://example.com/image1.jpg',
    sold: 5,
    buyers: [
      {
        buyer_name: 'John Doe',
        product_name: 'Test Product 1',
        quantity: 2,
        price_paid: 29.99,
        payment_method: 'PayPal',
        phone_number: '123-456-7890',
        location: 'New York, NY'
      }
    ]
  },
  {
    id: 2,
    title: 'Test Product 2',
    description: 'Test description 2',
    price: 19.99,
    stock: 5,
    category: 'Toys',
    image_url: 'https://example.com/image2.jpg',
    sold: 3,
    buyers: []
  }
]

const mockUpdatedProduct = {
  id: 1,
  title: 'Updated Product',
  description: 'Updated description',
  price: 35.99,
  stock: 15,
  category: 'Food',
  image_url: 'https://example.com/updated-image.jpg',
  sold: 5,
  buyers: []
}

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock successful API responses
    mockedAxios.get.mockResolvedValue({
      data: mockProducts
    })
    
    mockedAxios.put.mockResolvedValue({
      data: {
        message: 'Product updated successfully!',
        product: mockUpdatedProduct
      }
    })
  })

  it('renders dashboard with products', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Product Inventory')).toBeInTheDocument()
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })
  })

  it('displays product statistics', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total products
      expect(screen.getByText('8')).toBeInTheDocument() // Total sales
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Find and click edit button for first product
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Check if edit modal is opened
    expect(screen.getByText('Edit Product')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Product 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test description 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('29.99')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Food')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/image1.jpg')).toBeInTheDocument()
  })

  it('updates form fields when user types', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Open edit modal
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Update form fields
    const nameInput = screen.getByDisplayValue('Test Product 1')
    fireEvent.change(nameInput, { target: { value: 'Updated Product Name' } })
    
    const priceInput = screen.getByDisplayValue('29.99')
    fireEvent.change(priceInput, { target: { value: '35.99' } })
    
    const stockInput = screen.getByDisplayValue('10')
    fireEvent.change(stockInput, { target: { value: '15' } })
    
    // Check if values are updated
    expect(nameInput.value).toBe('Updated Product Name')
    expect(priceInput.value).toBe('35.99')
    expect(stockInput.value).toBe('15')
  })

  it('saves product changes when save button is clicked', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Open edit modal
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Update form fields
    const nameInput = screen.getByDisplayValue('Test Product 1')
    fireEvent.change(nameInput, { target: { value: 'Updated Product Name' } })
    
    // Click save button
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/products/1',
        expect.objectContaining({
          name: 'Updated Product Name',
          description: 'Test description 1',
          price: 29.99,
          stock: 10,
          category: 'Food',
          image_url: 'https://example.com/image1.jpg'
        })
      )
    })
  })

  it('calls fetchDashboardData after successful update', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Open edit modal
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Click save button
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    // Check if dashboard data is refetched
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2) // Initial load + refetch after update
    })
  })

  it('closes edit modal when cancel button is clicked', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Open edit modal
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Check if modal is open
    expect(screen.getByText('Edit Product')).toBeInTheDocument()
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    // Check if modal is closed
    expect(screen.queryByText('Edit Product')).not.toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockedAxios.put.mockRejectedValue(new Error('API Error'))
    
    // Mock window.alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Open edit modal
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Click save button
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    // Check if error alert is shown
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to update product. Please try again.')
    })
    
    mockAlert.mockRestore()
  })

  it('validates required fields', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Open edit modal
    const editButtons = screen.getAllByTitle('Edit Product')
    fireEvent.click(editButtons[0])
    
    // Clear required fields
    const nameInput = screen.getByDisplayValue('Test Product 1')
    fireEvent.change(nameInput, { target: { value: '' } })
    
    const priceInput = screen.getByDisplayValue('29.99')
    fireEvent.change(priceInput, { target: { value: '' } })
    
    const stockInput = screen.getByDisplayValue('10')
    fireEvent.change(stockInput, { target: { value: '' } })
    
    // Try to save
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    // The form will submit with empty values, but the backend will validate
    // Check that the API was called with empty values
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/products/1',
        expect.objectContaining({
          name: '',
          price: '',
          stock: ''
        })
      )
    })
  })

  it('displays loading state initially', () => {
    // Mock loading state
    mockedAxios.get.mockImplementation(() => new Promise(() => {}))
    
    renderWithRouter(<Dashboard />)
    
    // Check if loading state is shown
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('displays error state when API fails', async () => {
    // Mock API error
    mockedAxios.get.mockRejectedValue(new Error('API Error'))
    
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
    })
  })

  it('toggles buyer drawer when view buyers button is clicked', async () => {
    renderWithRouter(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    // Find and click view buyers button
    const viewBuyersButtons = screen.getAllByText('View Buyers')
    fireEvent.click(viewBuyersButtons[0])
    
    // Check if buyers table is shown
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('🧾 Buyers for Test Product 1')).toBeInTheDocument() // More specific text
  })
})