import { useState } from 'react';
import Products from './pages/Products/Products.jsx';
import Customers from './pages/Customers/Customers.jsx';

export default function App() {
  const [page, setPage] = useState('products');
  return (
    <div>
      <nav>
        <button onClick={() => setPage('products')}>Products</button>
        <button onClick={() => setPage('customers')}>Customers</button>
      </nav>
      {page === 'products' ? <Products /> : <Customers />}
    </div>
  );
}