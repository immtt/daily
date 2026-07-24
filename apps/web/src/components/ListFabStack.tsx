import { Link } from "react-router-dom";

type Props = {
  writeTo: string;
  writeLabel: string;
  trashTo?: string;
};

export function ListFabStack({
  writeTo,
  writeLabel,
  trashTo = "/trash",
}: Props) {
  return (
    <div className="fab-stack">
      <Link to={trashTo} className="fab-trash" aria-label="废纸篓">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 11v6M14 11v6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </Link>
      <Link to={writeTo} className="fab-write" aria-label={writeLabel}>
        +
      </Link>
    </div>
  );
}
