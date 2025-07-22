# Contributing to Chicken Stock Management System

Thank you for your interest in contributing to the Chicken Stock Management System! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/chicken-stock-management.git
   cd chicken-stock-management
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment** by copying `.env.example` to `.env` and filling in your Supabase credentials
5. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style
- Follow the existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Use React Context for global state management
- Follow the existing component structure

### CSS Guidelines
- Use CSS modules or follow the existing CSS structure
- Ensure responsive design for all screen sizes
- Support dark mode where applicable
- Use consistent spacing and typography

### Database Changes
- If you need to modify the database schema, update `schema.sql`
- Ensure all changes are backward compatible
- Test migrations thoroughly
- Document any new tables or columns

## 🧪 Testing

- Test your changes thoroughly in development
- Ensure the application builds successfully (`npm run build`)
- Test on different screen sizes and browsers
- Verify that existing functionality still works

## 📋 Pull Request Process

1. **Update documentation** if you've made changes that affect usage
2. **Test your changes** thoroughly
3. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```
4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Screenshots if UI changes are involved
   - List of changes made
   - Any breaking changes

## 🐛 Bug Reports

When reporting bugs, please include:
- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Browser and OS** information
- **Console errors** if any

## 💡 Feature Requests

For feature requests, please:
- **Check existing issues** to avoid duplicates
- **Describe the feature** clearly
- **Explain the use case** and benefits
- **Consider implementation** complexity

## 🔒 Security

If you discover a security vulnerability, please:
- **Do not** create a public issue
- **Email** the maintainers directly
- **Provide** detailed information about the vulnerability
- **Wait** for confirmation before disclosing publicly

## 📚 Areas for Contribution

We welcome contributions in these areas:

### Frontend
- UI/UX improvements
- New features and components
- Performance optimizations
- Accessibility improvements
- Mobile responsiveness

### Backend/Database
- Database optimizations
- New API endpoints
- Security enhancements
- Data validation improvements

### Documentation
- Code documentation
- User guides
- API documentation
- Tutorial content

### Testing
- Unit tests
- Integration tests
- End-to-end tests
- Performance testing

## 🎯 Coding Standards

### JavaScript/React
```javascript
// Use arrow functions for components
const MyComponent = () => {
  // Component logic here
  return <div>Content</div>;
};

// Use descriptive names
const handleSubmitForm = async (formData) => {
  // Function logic
};

// Use proper error handling
try {
  await apiCall();
} catch (error) {
  console.error('Error:', error);
  showError('Something went wrong');
}
```

### CSS
```css
/* Use consistent naming */
.component-name {
  /* Properties */
}

.component-name__element {
  /* Element styles */
}

.component-name--modifier {
  /* Modifier styles */
}
```

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches
- Follow the project's coding standards

## 📞 Getting Help

If you need help:
- Check the existing documentation
- Look through existing issues
- Create a new issue with your question
- Be specific about what you're trying to achieve

## 🏆 Recognition

Contributors will be:
- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Invited to join the core team for outstanding contributions

Thank you for contributing to the Chicken Stock Management System! 🐔