export default function H1({ children, className = '' }) {
  return <h1 className={`text--lg fw-700 ${className}`.trim()}>{children}</h1>;
}
