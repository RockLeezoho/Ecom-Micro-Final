export function EmptyState({ message = "Không có dữ liệu phù hợp." }) {
  return <p className="empty-state">{message}</p>;
}
