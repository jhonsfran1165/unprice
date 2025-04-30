# @unprice/react

React components and hooks for the Unprice API.

## Installation

```bash
npm install @unprice/react @unprice/api
# or
yarn add @unprice/react @unprice/api
# or
pnpm add @unprice/react @unprice/api
```

## Usage

First, wrap your application with the `UnpriceProvider`:

```tsx
import { UnpriceProvider } from '@unprice/react'

function App() {
  return (
    <UnpriceProvider options={{ token: 'your-api-token' }}>
      {/* Your app components */}
    </UnpriceProvider>
  )
}
```

Then use the hooks in your components:

```tsx
import { useCustomers, useProjects } from '@unprice/react'

function CustomersList() {
  const { getCustomers, createCustomer, isLoading, error } = useCustomers()

  // Fetch customers
  const handleFetchCustomers = async () => {
    try {
      const customers = await getCustomers()
      console.log(customers)
    } catch (err) {
      console.error(err)
    }
  }

  // Create a customer
  const handleCreateCustomer = async () => {
    try {
      const customer = await createCustomer({
        name: 'John Doe',
        email: 'john@example.com'
      })
      console.log(customer)
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={handleFetchCustomers}>Fetch Customers</button>
      <button onClick={handleCreateCustomer}>Create Customer</button>
    </div>
  )
}
```

## Available Hooks

### useCustomers

```tsx
const { getCustomers, createCustomer, isLoading, error } = useCustomers()
```

### useProjects

```tsx
const { getProjects, createProject, isLoading, error } = useProjects()
```

## TypeScript Support

This package includes TypeScript types and works seamlessly with TypeScript projects.

## Security

The SDK is designed to be used in client-side applications and includes proper error handling and type safety. Make sure to never expose your API token in client-side code. Instead, proxy your requests through your backend server.