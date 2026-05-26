function Button({ children, className = '', type = 'button', ...props }) {
  return (
    <button type={type} className={`h-12 rounded-lg bg-primary px-4 text-button text-on-primary transition-all hover:bg-primary-container active:scale-[0.98] ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
