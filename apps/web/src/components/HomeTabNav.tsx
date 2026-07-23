import { Link } from "react-router-dom";

type Props = {
  active: "diary" | "trash";
};

export function HomeTabNav({ active }: Props) {
  return (
    <div className="home-nav">
      <nav className="home-tab-bar">
        <Link to="/" className={active === "diary" ? "home-tab active" : "home-tab"}>
          日记
        </Link>
        <Link
          to="/trash"
          className={active === "trash" ? "home-tab active" : "home-tab"}
        >
          废纸篓
        </Link>
      </nav>
    </div>
  );
}
