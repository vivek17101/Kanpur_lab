export default function H3({ children, className = '' }) {
  return <h3 className={`text--default fw-700 ${className}`.trim()}>{children}</h3>;
}
