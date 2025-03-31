const axios = require('axios');

const createAdmin = async () => {
  try {
    const response = await axios.post('http://localhost:8000/api/auth/create-admin', {
      username: 'admin2',
      email: 'admin2@example.com',
      password: 'Admin123'
    });

    console.log('Admin user created successfully:', response.data);
  } catch (error) {
    console.error('Error creating admin user:', error.response?.data || error.message);
  }
};

createAdmin(); 