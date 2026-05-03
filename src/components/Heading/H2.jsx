export default function H2({ children, className = '' }) {
  return <h2 className={`text--md fw-700 ${className}`.trim()}>{children}</h2>;
}
